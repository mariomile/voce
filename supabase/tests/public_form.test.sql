-- The public form in a full room: every phone behind the venue Wi-Fi shares one IP, and a hundred of
-- them press "Invia" in the same few seconds. The limits must fit a room of 500 sending two each, and a
-- Pro workspace must not make those submissions wait for each other on its row.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'form-pro@test.voce', '{"workspace_name": "Pro"}'),
  ('00000000-0000-0000-0000-0000000000f2', 'form-free@test.voce', '{"workspace_name": "Free"}'),
  ('00000000-0000-0000-0000-0000000000f3', 'form-other@test.voce', '{"workspace_name": "Altro"}');

create temporary table w on commit drop as
select m.user_id, m.workspace_id as id from public.workspace_members m
where m.user_id in ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2',
  '00000000-0000-0000-0000-0000000000f3');

update public.subscriptions set plan = 'pro'
where workspace_id in (select id from w where user_id <> '00000000-0000-0000-0000-0000000000f2');

insert into public.research (workspace_id, question, form_slug)
select id, 'Domanda?', case user_id
  when '00000000-0000-0000-0000-0000000000f1' then 'sala-pro'
  when '00000000-0000-0000-0000-0000000000f2' then 'sala-free'
  else 'sala-altra' end
from w;

-- Which row locks this transaction holds on a workspace. Foreign keys take "For Key Share", which
-- blocks nobody who submits; "For No Key Update" makes every other submission to it wait.
create extension if not exists pgrowlocks with schema extensions;
create function pg_temp.locks_workspace(owner uuid) returns boolean language sql as $$
  select coalesce(bool_or('For No Key Update' = any(l.modes)), false)
  from extensions.pgrowlocks('public.workspaces') l
  join public.workspaces ws on ws.ctid = l.locked_row
  where ws.id = (select id from w where user_id = owner)
$$;

-- ===== No wait on the workspace row for a Pro workspace =====

select is(public.submit_public_feedback('sala-pro', 'Dalla sala.', '', 'ip-lock'), 'ok', 'a Pro form accepts');
select ok(
  not pg_temp.locks_workspace('00000000-0000-0000-0000-0000000000f1'),
  'a Pro workspace is not locked by a public form submission: a room does not queue on it'
);

select is(public.submit_public_feedback('sala-free', 'Dalla sala.', '', 'ip-lock'), 'ok', 'a Free form accepts');
select ok(
  pg_temp.locks_workspace('00000000-0000-0000-0000-0000000000f2'),
  'a Free workspace is still locked, so two submissions cannot both take its last slot'
);

-- ===== A room of 500 sending two each, from one IP =====

-- 999 earlier attempts of the same IP in the last hour, on another form.
insert into private.form_attempts (workspace_id, ip_hash, created_at)
select (select id from w where user_id = '00000000-0000-0000-0000-0000000000f3'),
  sha256(convert_to('ip-room', 'UTF8')), now() - interval '30 minutes'
from generate_series(1, 999);

select is(public.submit_public_feedback('sala-pro', 'Il millesimo.', '', 'ip-room'), 'ok',
  'the 1000th submission of the hour from one IP is accepted');
select is(public.submit_public_feedback('sala-free', 'Il 1001°.', '', 'ip-room'), 'rate_limited',
  'the 1001st from the same IP is refused, on any form');

-- ===== At most 1000 an hour per workspace, from any IP =====

select is(public.submit_public_feedback('sala-altra', 'Dati mobili.', '', 'ip-mobile'), 'ok',
  'another IP is not held back by the first: the form with 999 attempts takes its 1000th');
select is(public.submit_public_feedback('sala-altra', 'Un altro telefono.', '', 'ip-mobile-2'), 'rate_limited',
  'the workspace refuses its 1001st submission of the hour, whatever the IP');

-- Attempts older than an hour no longer count.
update private.form_attempts set created_at = now() - interval '2 hours';
select is(public.submit_public_feedback('sala-pro', 'Un''ora dopo.', '', 'ip-room'), 'ok',
  'an hour later the same IP and workspace are accepted again');

select * from finish();
rollback;
