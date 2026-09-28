-- The delete rule on feedback, checked on its own. Through the API every delete filters by id, so the
-- select rule applies too and would hide a delete rule that is too wide. A delete with no WHERE and
-- no RETURNING is checked against the delete rule alone.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

-- Two users: the signup trigger gives each one a workspace.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'delete-rule-a@test.voce', '{"workspace_name": "A"}'),
  ('00000000-0000-0000-0000-00000000000b', 'delete-rule-b@test.voce', '{"workspace_name": "B"}');

insert into public.research (workspace_id, question, form_slug)
select m.workspace_id, 'Domanda?', 'delete-rule-' || right(m.user_id::text, 1)
from public.workspace_members m
where m.user_id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');

insert into public.feedback (workspace_id, research_id, text, channel)
select r.workspace_id, r.id, 'Feedback', 'Supporto'
from public.research r
where r.form_slug in ('delete-rule-a', 'delete-rule-b');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
delete from public.feedback;
reset role;

select is(
  (select count(*)::integer from public.feedback f join public.workspace_members m on m.workspace_id = f.workspace_id
   where m.user_id = '00000000-0000-0000-0000-00000000000a'),
  0,
  'A deletes the feedback of their workspace'
);
select is(
  (select count(*)::integer from public.feedback f join public.workspace_members m on m.workspace_id = f.workspace_id
   where m.user_id = '00000000-0000-0000-0000-00000000000b'),
  1,
  'the same delete leaves the feedback of B''s workspace'
);

select * from finish();
rollback;
