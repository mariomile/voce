-- Research: a question of the PM with its own collection. Every feedback belongs to one Research, and
-- the public form moves from the workspace to the Research. Each existing workspace gets an "initial
-- Research" carrying its form (slug, state, question) and all its feedback, so /f/phc26 keeps working.
-- One transaction: it applies whole or not at all. Irreversible in production (every feedback changes
-- shape, the form columns leave the workspace): only Mario applies it there.

-- ===== The Research =====

create table public.research (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  -- The PM's question: the name of the Research. Never sent to the model.
  question text not null check (char_length(btrim(question)) between 1 and 200),
  form_slug text not null unique check (form_slug ~ '^[a-z0-9-]{3,60}$'),
  form_enabled boolean not null default true,
  -- Shown to strangers on the form. Null means the default question.
  form_question text check (char_length(btrim(form_question)) between 1 and 140),
  created_at timestamptz not null default now(),
  unique (workspace_id, id)
);
create index research_workspace_created_idx on public.research (workspace_id, created_at desc);

alter table public.research enable row level security;

create policy "Members read their research" on public.research
  for select to authenticated using (workspace_id in (select private.my_workspace_ids()));
create policy "Members update their research" on public.research
  for update to authenticated
  using (workspace_id in (select private.my_workspace_ids()))
  with check (workspace_id in (select private.my_workspace_ids()));
create policy "Members delete their research" on public.research
  for delete to authenticated using (workspace_id in (select private.my_workspace_ids()));

-- No insert: a Research is created by create_research, which picks the form link.
grant select, delete on public.research to authenticated;
grant update (question, form_enabled, form_question) on public.research to authenticated;

-- ===== The initial Research of every existing workspace =====

-- The question of the form when the PM chose one, otherwise one naming the workspace (Italian, like the form).
insert into public.research (workspace_id, question, form_slug, form_enabled, form_question, created_at)
select w.id, coalesce(w.form_question, 'Cosa dicono i clienti di ' || w.name || '?'),
  w.form_slug, w.form_enabled, w.form_question, w.created_at
from public.workspaces w;

-- ===== Every feedback belongs to a Research =====

alter table public.feedback add column research_id uuid;
update public.feedback f set research_id = r.id from public.research r where r.workspace_id = f.workspace_id;
alter table public.feedback alter column research_id set not null;
-- The composite key keeps the feedback and its Research in the same workspace.
alter table public.feedback add constraint feedback_research_fkey
  foreign key (workspace_id, research_id) references public.research (workspace_id, id) on delete cascade;
create index feedback_research_received_idx on public.feedback (research_id, received_at desc, created_at desc);

grant insert (research_id) on public.feedback to authenticated;

-- Interview notes run up to 10,000 characters. The public form and the CSV import keep 2,000 in their
-- own functions.
alter table public.feedback drop constraint feedback_text_check;
alter table public.feedback add constraint feedback_text_check check (char_length(btrim(text)) between 1 and 10000);

-- The numbers of each Research, so the app never downloads every feedback. security_invoker keeps RLS in force.
create view public.research_feedback_stats with (security_invoker = true) as
  select f.workspace_id, f.research_id, count(*)::integer as feedback_count,
    count(distinct f.channel)::integer as channel_count,
    min(f.received_at) as first_received_at, max(f.received_at) as last_received_at
  from public.feedback f
  group by f.workspace_id, f.research_id;

grant select on public.research_feedback_stats to authenticated;

-- The channels now count per Research: the Feedback tab of a Research filters by them.
drop view public.feedback_channels;
create view public.feedback_channels with (security_invoker = true) as
  select workspace_id, research_id, channel, count(*)::integer as feedback_count
  from public.feedback
  group by workspace_id, research_id, channel;

grant select on public.feedback_channels to authenticated;

-- ===== Analytics: the first Research that reaches 5 feedback =====

alter table public.analytics_milestones drop constraint analytics_milestones_event_check;
alter table public.analytics_milestones add constraint analytics_milestones_event_check check (event in (
  'signed_up', 'first_feedback_added', 'first_analysis_completed', 'upgraded_to_pro', 'first_research_collected'
));

-- A migrated workspace whose initial Research already has 5 feedback does not enter the cohort as new.
insert into public.analytics_milestones (workspace_id, event)
select f.workspace_id, 'first_research_collected'
from public.feedback f
group by f.workspace_id, f.research_id
having count(*) >= 5
on conflict do nothing;

-- ===== The form leaves the workspace =====

alter table public.workspaces drop column form_slug, drop column form_enabled, drop column form_question;

create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  workspace_name text;
  workspace_id uuid;
begin
  -- The signup form sends the product name. Google sign-ups have none: use the email name.
  workspace_name := left(btrim(coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'workspace_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Il mio prodotto'
  )), 60);

  -- No Research: the PM creates the first one from their question.
  insert into public.workspaces (name) values (workspace_name) returning id into workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (workspace_id, new.id, 'owner');

  insert into public.subscriptions (workspace_id) values (workspace_id);
  return new;
end
$$;

-- ===== Create a Research =====

-- Checks the membership and the question, gives the form a new link (on, default question), returns the id.
create function public.create_research(ws uuid, question text)
returns uuid
language plpgsql volatile security definer set search_path = ''
as $$
declare
  workspace_name text;
  new_id uuid;
begin
  select w.name into workspace_name from public.workspaces w
  where w.id = ws and w.id in (select private.my_workspace_ids());
  if workspace_name is null then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  if question is null or char_length(btrim(question)) not between 1 and 200 then
    raise exception 'invalid_question' using errcode = '22023';
  end if;

  insert into public.research (workspace_id, question, form_slug)
  values (ws, btrim(create_research.question), private.new_form_slug(workspace_name))
  returning id into new_id;
  return new_id;
end
$$;

revoke all on function public.create_research(uuid, text) from public, anon, authenticated;
grant execute on function public.create_research(uuid, text) to authenticated;

-- ===== Public form, now on the Research =====

-- Returns only what the form shows. accepting is false when the PM turned the link off or the workspace
-- is full: the visitor reads a kind message. Nothing for an unknown link (a regenerated one, a deleted Research).
create or replace function public.get_public_form(slug text)
returns table (workspace_name text, question text, accepting boolean)
language sql stable security definer set search_path = ''
as $$
  select w.name,
    coalesce(r.form_question, 'Cosa vuoi dire al team di ' || w.name || '?'),
    r.form_enabled and private.accepts_feedback(w.id)
  from public.research r
  join public.workspaces w on w.id = r.workspace_id
  where r.form_slug = get_public_form.slug
$$;

-- Returns 'ok', 'invalid', 'unavailable' (unknown or disabled link, workspace full) or 'rate_limited'.
-- Only the server calls it, with the secret key and the IP it sees. The limits stay per workspace.
create or replace function public.submit_public_feedback(slug text, feedback_text text, email text, client_ip text)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  ws uuid;
  research uuid;
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

  select r.workspace_id, r.id into ws, research from public.research r
  where r.form_slug = submit_public_feedback.slug and r.form_enabled;
  if ws is null then
    return 'unavailable';
  end if;
  -- Locks the workspace: attempts and the Free limit on its forms are checked one at a time.
  perform 1 from public.workspaces w where w.id = ws for no key update;

  delete from private.form_attempts where created_at < now() - interval '1 hour';
  -- 300 per hour per IP, 300 per hour per workspace.
  if (select count(*) from private.form_attempts a
      where a.ip_hash = visitor and a.created_at > now() - interval '1 hour') >= 300
    or (select count(*) from private.form_attempts a
      where a.workspace_id = ws and a.created_at > now() - interval '1 hour') >= 300 then
    return 'rate_limited';
  end if;
  insert into private.form_attempts (workspace_id, ip_hash) values (ws, visitor);

  if not private.accepts_feedback(ws) then
    return 'unavailable';
  end if;
  insert into public.feedback (workspace_id, research_id, text, channel, email)
  values (ws, research, btrim(feedback_text), 'Modulo pubblico', clean_email);
  return 'ok';
end
$$;

-- The old link and its QR code stop working at once. The new link is on.
drop function public.regenerate_form_link(uuid);
create function public.regenerate_form_link(research uuid)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  new_slug text;
begin
  update public.research r
  set form_slug = private.new_form_slug(w.name), form_enabled = true
  from public.workspaces w
  where r.id = regenerate_form_link.research and w.id = r.workspace_id
    and r.workspace_id in (select private.my_workspace_ids())
  returning r.form_slug into new_slug;
  if new_slug is null then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  return new_slug;
end
$$;

revoke all on function public.regenerate_form_link(uuid) from public, anon, authenticated;
grant execute on function public.regenerate_form_link(uuid) to authenticated;

-- ===== CSV import into a Research =====

-- rows: [{"text", "channel", "customer", "received_at"}], already validated by the server.
-- Returns one outcome per row, in order: 'new', 'duplicate' (same text, channel and customer as a
-- feedback already in this Research or an earlier row) or 'over_limit' (past the Free limit, which
-- counts every Research of the workspace). The same ticket can serve two Research.
-- One array, not a set of rows: the API would cut a set at 1,000 rows.
-- With dry_run nothing is saved: the preview and the import share this logic.
drop function public.import_feedback(uuid, jsonb, boolean);
create function public.import_feedback(ws uuid, research uuid, rows jsonb, dry_run boolean default false)
returns text[]
language plpgsql volatile security definer set search_path = ''
as $$
declare
  remaining integer;
  result text[];
begin
  if ws is null or ws not in (select private.my_workspace_ids())
    or not exists (select 1 from public.research r where r.id = import_feedback.research and r.workspace_id = ws) then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  if jsonb_typeof(rows) is distinct from 'array' or jsonb_array_length(rows) > 2000 then
    raise exception 'invalid_rows' using errcode = '22023';
  end if;
  -- The server already checked every row. This keeps a direct call to the same rules:
  -- some visible text of at most 2,000 characters, a date from 2000 to today on the Italian calendar.
  if exists (
    select 1 from jsonb_array_elements(rows) r
    where coalesce(r.value ->> 'text', '') !~ '[^[:space:]]'
      or char_length(btrim(r.value ->> 'text')) > 2000
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
    where f.workspace_id = ws and f.research_id = import_feedback.research
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
    insert into public.feedback (workspace_id, research_id, text, channel, customer, received_at)
    select ws, import_feedback.research, o.text, o.channel, o.customer,
      coalesce(o.received_at, (now() at time zone 'Europe/Rome')::date)
    from outcomes o
    where o.outcome = 'new' and not dry_run
    order by o.idx
  )
  select coalesce(array_agg(o.outcome order by o.idx), '{}') into result from outcomes o;
  return result;
end
$$;

revoke all on function public.import_feedback(uuid, uuid, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.import_feedback(uuid, uuid, jsonb, boolean) to authenticated;

-- ===== Analyses and themes of a Research =====

-- A click reserves one row per kind: the themes, and (with hypotheses, in a later part) the verdict.
create type public.analysis_kind as enum ('themes', 'verdict');

-- research_id is set at the reservation. Deleting the Research empties it and keeps the row, so the
-- month's quota still counts it (on delete set null of that column only: the workspace stays).
alter table public.analyses
  add column research_id uuid,
  add column kind public.analysis_kind not null default 'themes';
update public.analyses a set research_id = r.id from public.research r where r.workspace_id = a.workspace_id;
alter table public.analyses add constraint analyses_research_fkey
  foreign key (workspace_id, research_id) references public.research (workspace_id, id) on delete set null (research_id);
create index analyses_research_kind_idx on public.analyses (research_id, kind, created_at desc);

-- The themes go with their Research.
alter table public.themes add column research_id uuid;
update public.themes t set research_id = a.research_id from public.analyses a where a.id = t.analysis_id;
alter table public.themes alter column research_id set not null;
alter table public.themes add constraint themes_research_fkey
  foreign key (workspace_id, research_id) references public.research (workspace_id, id) on delete cascade;
create index themes_research_idx on public.themes (research_id);

-- ===== Reserve the analyses of a click =====

-- kinds: what the server decided to run. inputs: {"themes": {...}, "verdict": {...}}, the log of each run.
-- Returns one 'ok' row per kind with its analysis id, or a single row: 'busy' (one is running anywhere in
-- the workspace), 'limit' (the done and running ones of the month plus the requested ones exceed the
-- plan, or the failed ones already reached it) or 'invalid' (no kind, or one twice). All or nothing.
drop function public.start_analysis(uuid, text, date, integer, jsonb);
create function public.start_analysis(
  ws uuid, research uuid, model text, kinds public.analysis_kind[], period_start date, feedback_count integer, inputs jsonb
)
returns table (outcome text, kind public.analysis_kind, analysis_id uuid)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  requested integer := coalesce(array_length(kinds, 1), 0);
  k public.analysis_kind;
  new_id uuid;
begin
  -- One analysis decision at a time on this workspace.
  perform 1 from public.workspaces w where w.id = ws for no key update;
  if not found then
    raise exception 'unknown_workspace' using errcode = '22023';
  end if;
  if not exists (select 1 from public.research r where r.id = start_analysis.research and r.workspace_id = ws) then
    raise exception 'unknown_research' using errcode = '22023';
  end if;
  if requested = 0 or requested <> (select count(distinct x) from unnest(kinds) x) then
    return query select 'invalid', null::public.analysis_kind, null::uuid;
    return;
  end if;

  -- A run the server never finished (crash, killed function) must not block the workspace forever.
  with stale as (
    update public.analyses a set status = 'failed'
    where a.workspace_id = ws and a.status = 'running' and a.created_at < now() - interval '10 minutes'
    returning a.id
  )
  update public.analysis_runs r set error = 'stale', finished_at = now()
  from stale where r.analysis_id = stale.id;

  if exists (select 1 from public.analyses a where a.workspace_id = ws and a.status = 'running') then
    return query select 'busy', null::public.analysis_kind, null::uuid;
    return;
  end if;

  -- Failed runs still cost tokens: they do not use the quota, but at most as many again per month.
  if (select count(*) filter (where a.status <> 'failed') + requested > private.analyses_limit(ws)
        or count(*) filter (where a.status = 'failed') >= private.analyses_limit(ws)
      from public.analyses a
      where a.workspace_id = ws
        and date_trunc('month', a.created_at at time zone 'Europe/Rome')
          = date_trunc('month', now() at time zone 'Europe/Rome')) then
    return query select 'limit', null::public.analysis_kind, null::uuid;
    return;
  end if;

  foreach k in array kinds loop
    insert into public.analyses (workspace_id, research_id, kind, period_start, feedback_count, status)
    values (ws, start_analysis.research, k, start_analysis.period_start, start_analysis.feedback_count, 'running')
    returning id into new_id;
    insert into public.analysis_runs (analysis_id, workspace_id, model, input)
    values (new_id, ws, start_analysis.model, coalesce(inputs -> k::text, '{}'));
    return query select 'ok', k, new_id;
  end loop;
end
$$;

-- ===== Save the themes of a Research =====

-- Same as before, on a themes row: priority and status come from the last done themes analysis of the
-- same Research, and the themes carry its research_id. Returns the number of verified quotes it saved.
drop function public.finish_analysis(uuid, jsonb, jsonb);
create function public.finish_analysis(analysis uuid, themes jsonb, run jsonb)
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare
  ws uuid;
  res uuid;
  previous uuid;
  theme jsonb;
  theme_id uuid;
  quotes integer;
begin
  select a.workspace_id, a.research_id into ws, res from public.analyses a
  where a.id = analysis and a.status = 'running' and a.kind = 'themes';
  if ws is null then
    raise exception 'analysis_not_running' using errcode = '22023';
  end if;
  perform 1 from public.workspaces w where w.id = ws for no key update;

  select a.id into previous from public.analyses a
  where a.research_id = res and a.kind = 'themes' and a.status = 'done'
  order by a.created_at desc limit 1;

  for theme in select t.value from jsonb_array_elements(themes) t loop
    insert into public.themes (workspace_id, research_id, analysis_id, kind, title, summary, sentiment, priority, status)
    select ws, res, analysis, (theme ->> 'kind')::public.theme_kind, btrim(theme ->> 'title'), btrim(theme ->> 'summary'),
      (theme ->> 'sentiment')::public.theme_sentiment, old.priority, coalesce(old.status, 'to_review')
    from (select 1) one
    left join lateral (
      select o.priority, o.status from public.themes o
      where o.workspace_id = ws and o.analysis_id = previous
        and lower(btrim(o.title)) = lower(btrim(theme ->> 'title'))
      limit 1
    ) old on true
    returning id into theme_id;

    insert into public.theme_feedback (theme_id, feedback_id, workspace_id, quote_rank, highlight)
    select theme_id, f.value::uuid, ws, q.rank, q.text
    from jsonb_array_elements_text(theme -> 'feedback') f
    -- Only feedback that still exist. The lock waits for a delete in progress, then skips the row it removed.
    join public.feedback kept on kept.workspace_id = ws and kept.id = f.value::uuid
    left join lateral (
      select (qq.ordinality)::smallint as rank, qq.value ->> 'text' as text
      from jsonb_array_elements(theme -> 'quotes') with ordinality qq
      where qq.value ->> 'feedback_id' = f.value
      limit 1
    ) q on true
    for key share of kept;
  end loop;

  -- The server checked the quotes against the texts it sent. Check again against the saved texts.
  if exists (
    select 1 from public.theme_feedback tf
    join public.themes t on t.id = tf.theme_id
    join public.feedback f on f.workspace_id = tf.workspace_id and f.id = tf.feedback_id
    where t.analysis_id = analysis and tf.highlight is not null
      and (tf.highlight = '' or strpos(f.text, tf.highlight) = 0)
  ) then
    raise exception 'quote_not_in_feedback' using errcode = '22023';
  end if;

  select count(*)::integer into quotes from public.theme_feedback tf
  join public.themes t on t.id = tf.theme_id
  where t.analysis_id = analysis and tf.highlight is not null;

  update public.analyses set status = 'done' where id = analysis;
  update public.analysis_runs set
    output = run -> 'output',
    issues = run -> 'issues',
    input_tokens = (run ->> 'input_tokens')::integer,
    output_tokens = (run ->> 'output_tokens')::integer,
    duration_ms = (run ->> 'duration_ms')::integer,
    cost_usd = (run ->> 'cost_usd')::numeric,
    finished_at = now()
  where analysis_id = analysis;
  return quotes;
end
$$;

revoke all on function public.start_analysis(uuid, uuid, text, public.analysis_kind[], date, integer, jsonb)
  from public, anon, authenticated;
revoke all on function public.finish_analysis(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.start_analysis(uuid, uuid, text, public.analysis_kind[], date, integer, jsonb) to service_role;
grant execute on function public.finish_analysis(uuid, jsonb, jsonb) to service_role;
