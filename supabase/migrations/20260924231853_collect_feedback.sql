-- Feedback collection: public form only through the server with rate limits, new form link, CSV import.

-- ===== Public form attempts, for the rate limits =====

-- Private schema: not exposed by the API. Rows older than an hour go at the next submission.
create table private.form_attempts (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  -- The server sends a keyed hash of the visitor IP, hashed again here: enough to count, never the address.
  ip_hash bytea not null,
  created_at timestamptz not null default now()
);
alter table private.form_attempts enable row level security;
revoke all on private.form_attempts from public, anon, authenticated;
create index form_attempts_ip_idx on private.form_attempts (ip_hash, created_at);
create index form_attempts_workspace_idx on private.form_attempts (workspace_id, created_at);

-- ===== Public form submissions: only the server calls this =====

-- The anonymous visitor could call the old function directly, skipping the anti-bot field and
-- sending any IP. Now the server calls it with the secret key and the IP it sees.
drop function public.submit_public_feedback(text, text, text);

-- Returns 'ok', 'invalid', 'unavailable' (unknown or disabled link, workspace full) or 'rate_limited'.
create function public.submit_public_feedback(slug text, feedback_text text, email text, client_ip text)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  ws uuid;
  visitor bytea := sha256(convert_to(coalesce(client_ip, ''), 'UTF8'));
  clean_email text := nullif(btrim(email), '');
begin
  if feedback_text is null or char_length(btrim(feedback_text)) not between 1 and 2000 then
    return 'invalid';
  end if;
  if clean_email is not null
    and (char_length(clean_email) > 254 or clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    return 'invalid';
  end if;

  -- Locks the workspace: attempts and the Free limit on the same form are checked one at a time.
  select w.id into ws from public.workspaces w
  where w.form_slug = submit_public_feedback.slug and w.form_enabled
  for no key update;
  if ws is null then
    return 'unavailable';
  end if;

  delete from private.form_attempts where created_at < now() - interval '1 hour';
  -- 10 per minute per IP, 300 per hour per workspace.
  if (select count(*) from private.form_attempts a
      where a.ip_hash = visitor and a.created_at > now() - interval '1 minute') >= 10
    or (select count(*) from private.form_attempts a
      where a.workspace_id = ws and a.created_at > now() - interval '1 hour') >= 300 then
    return 'rate_limited';
  end if;
  insert into private.form_attempts (workspace_id, ip_hash) values (ws, visitor);

  if not private.accepts_feedback(ws) then
    return 'unavailable';
  end if;
  insert into public.feedback (workspace_id, text, channel, email)
  values (ws, btrim(feedback_text), 'Modulo pubblico', clean_email);
  return 'ok';
end
$$;

revoke all on function public.submit_public_feedback(text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_public_feedback(text, text, text, text) to service_role;

-- ===== New form link =====

-- The old link and its QR code stop working at once. The new link is on.
create function public.regenerate_form_link(ws uuid)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  new_slug text;
begin
  update public.workspaces w
  set form_slug = private.new_form_slug(w.name), form_enabled = true
  where w.id = ws and w.id in (select private.my_workspace_ids())
  returning w.form_slug into new_slug;
  if new_slug is null then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  return new_slug;
end
$$;

revoke all on function public.regenerate_form_link(uuid) from public, anon, authenticated;
grant execute on function public.regenerate_form_link(uuid) to authenticated;

-- ===== CSV import =====

-- rows: [{"text", "channel", "customer", "received_at"}], already validated by the server.
-- Returns one outcome per row, in order: 'new', 'duplicate' (same text, channel and customer as a
-- feedback already in the workspace or an earlier row) or 'over_limit' (past the Free limit).
-- One array, not a set of rows: the API would cut a set at 1,000 rows.
-- With dry_run nothing is saved: the preview and the import share this logic.
create function public.import_feedback(ws uuid, rows jsonb, dry_run boolean default false)
returns text[]
language plpgsql volatile security definer set search_path = ''
as $$
declare
  remaining integer;
  result text[];
begin
  if ws is null or ws not in (select private.my_workspace_ids()) then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  if jsonb_typeof(rows) is distinct from 'array' or jsonb_array_length(rows) > 2000 then
    raise exception 'invalid_rows' using errcode = '22023';
  end if;
  -- The server already checked every row. This keeps a direct call to the same rules:
  -- some visible text, a date from 2000 to today on the Italian calendar.
  if exists (
    select 1 from jsonb_array_elements(rows) r
    where coalesce(r.value ->> 'text', '') !~ '[^[:space:]]'
      or (r.value ->> 'received_at')::date not between '2000-01-01' and (now() at time zone 'Europe/Rome')::date
  ) then
    raise exception 'invalid_rows' using errcode = '22023';
  end if;

  -- One writer at a time on this workspace: the free slots cannot change under us.
  perform 1 from public.workspaces where id = ws for no key update;
  remaining := private.feedback_limit(ws) - (select count(*) from public.feedback where workspace_id = ws);

  with input as (
    select (r.ordinality - 1)::integer as idx,
      btrim(r.value ->> 'text') as text,
      btrim(r.value ->> 'channel') as channel,
      nullif(btrim(r.value ->> 'customer'), '') as customer,
      (r.value ->> 'received_at')::date as received_at
    from jsonb_array_elements(rows) with ordinality r
  ),
  existing as (
    select distinct f.text, f.channel, coalesce(f.customer, '') as customer
    from public.feedback f
    where f.workspace_id = ws
  ),
  marked as (
    select i.*,
      e.text is not null
        or row_number() over (partition by i.text, i.channel, coalesce(i.customer, '') order by i.idx) > 1
        as duplicate
    from input i
    left join existing e
      on e.text = i.text and e.channel = i.channel and e.customer = coalesce(i.customer, '')
  ),
  outcomes as (
    select m.*,
      case
        when m.duplicate then 'duplicate'
        when remaining is not null
          and count(*) filter (where not m.duplicate) over (order by m.idx) > remaining then 'over_limit'
        else 'new'
      end as outcome
    from marked m
  ),
  saved as (
    insert into public.feedback (workspace_id, text, channel, customer, received_at)
    select ws, o.text, o.channel, o.customer,
      coalesce(o.received_at, (now() at time zone 'Europe/Rome')::date)
    from outcomes o
    where o.outcome = 'new' and not dry_run
    order by o.idx
  )
  select coalesce(array_agg(o.outcome order by o.idx), '{}') into result from outcomes o;
  return result;
end
$$;

revoke all on function public.import_feedback(uuid, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.import_feedback(uuid, jsonb, boolean) to authenticated;
