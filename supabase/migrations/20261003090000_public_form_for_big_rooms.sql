-- A full room on the public form, measured on production (2026-09-29): 300 phones behind one IP.
-- 1. 300 per hour per IP and per workspace let exactly 300 through: the 301st feedback of the hour was
--    refused from any IP, so a room of 300 could not send a second one. Now 1000 and 1000: a room of 500
--    sending two each fits. One IP still cannot send more than 1000 an hour across all forms.
-- 2. Every submission locked the workspace row, so 100 phones pressing "Invia" together waited for each
--    other: up to 6.4 seconds in the database. The lock only keeps two submissions from both taking the
--    last slot of the Free limit, so only a workspace with a limit takes it. On Pro the hourly limits can
--    be passed by the submissions running at the same moment (a burst of 100 could reach 1100), and a
--    downgrade to Free during a burst can leave a few more than 100 feedback, like any downgrade.

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
  -- A workspace with a Free limit: attempts and the limit on its forms are checked one at a time.
  if private.feedback_limit(ws) is not null then
    perform 1 from public.workspaces w where w.id = ws for no key update;
  end if;

  delete from private.form_attempts where created_at < now() - interval '1 hour';
  -- 1000 per hour per IP, 1000 per hour per workspace.
  if (select count(*) from private.form_attempts a
      where a.ip_hash = visitor and a.created_at > now() - interval '1 hour') >= 1000
    or (select count(*) from private.form_attempts a
      where a.workspace_id = ws and a.created_at > now() - interval '1 hour') >= 1000 then
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

-- Same rule on every insert (form, notes, CSV): a workspace without a limit has no slot to race for.
create or replace function private.enforce_feedback_limit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if private.feedback_limit(new.workspace_id) is null then
    return new;
  end if;
  -- Serialize inserts on the same workspace, so two cannot both take the last slot.
  perform 1 from public.workspaces where id = new.workspace_id for no key update;
  if not private.accepts_feedback(new.workspace_id) then
    raise exception 'feedback_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end
$$;
