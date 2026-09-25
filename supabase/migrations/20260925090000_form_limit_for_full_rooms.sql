-- A full room often reaches the internet from one IP (venue Wi-Fi, carrier NAT). 10 per minute per IP
-- stopped a room of 230 after the first ten. Now: 300 per hour per IP, across all workspaces, and
-- 300 per hour per workspace. A room fits; one IP still cannot fill more than one form's hour.

create or replace function public.submit_public_feedback(slug text, feedback_text text, email text, client_ip text)
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
  insert into public.feedback (workspace_id, text, channel, email)
  values (ws, btrim(feedback_text), 'Modulo pubblico', clean_email);
  return 'ok';
end
$$;
