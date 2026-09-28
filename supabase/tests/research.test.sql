-- Research: the table, its access rules, create_research, and feedback that always belong to one.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- ===== AC 1 (part): RLS on in the migration that creates the table =====

select ok(
  (select relrowsecurity from pg_class where oid = 'public.research'::regclass),
  'RLS is enabled on research'
);

-- ===== AC 2: every feedback belongs to a Research =====

select is(
  (select count(*)::integer from public.feedback where research_id is null),
  0,
  'after reset with the seed no feedback lacks a research'
);

-- ===== AC 72 (part): the seed has a workspace with two Research =====

select ok(
  exists (select 1 from public.research group by workspace_id having count(*) >= 2),
  'the seed has a workspace with two Research'
);

-- ===== AC 5: the form left the workspace; a new user gets no Research =====

select hasnt_column('public', 'workspaces', 'form_slug', 'workspaces has no form_slug');
select hasnt_column('public', 'workspaces', 'form_enabled', 'workspaces has no form_enabled');
select hasnt_column('public', 'workspaces', 'form_question', 'workspaces has no form_question');

-- Three users: the signup trigger gives each one a workspace.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a2', 'research-a@test.voce', '{"workspace_name": "Àrea A"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'research-b@test.voce', '{"workspace_name": "B"}'),
  ('00000000-0000-0000-0000-0000000000c2', 'research-c@test.voce', '{"workspace_name": "C"}');

create temporary table ws on commit drop as
select case m.user_id
    when '00000000-0000-0000-0000-0000000000a2' then 'a'
    when '00000000-0000-0000-0000-0000000000b2' then 'b'
    else 'c'
  end as name,
  m.workspace_id as id
from public.workspace_members m
where m.user_id in ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000b2',
                    '00000000-0000-0000-0000-0000000000c2');
grant select on ws to authenticated, anon;

select results_eq(
  $$select (select count(*) from public.workspace_members m where m.workspace_id = w.id)::integer,
      (select count(*) from public.subscriptions s where s.workspace_id = w.id)::integer,
      (select count(*) from public.research r where r.workspace_id = w.id)::integer
    from ws w where w.name = 'c'$$,
  $$values (1, 1, 0)$$,
  'a new user gets workspace, member and subscription and no Research'
);

-- ===== AC 11: create_research =====

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a2", "role": "authenticated"}';

select throws_ok(
  $$select public.create_research((select id from ws where name = 'b'), 'Perché non passano a Pro?')$$,
  '42501', 'not_a_member', 'create_research by a non member fails with not_a_member'
);

create temporary table a_research on commit drop as
select public.create_research((select id from ws where name = 'a'), '  Perché i team piccoli non passano a Pro?  ') as id;
select public.create_research((select id from ws where name = 'a'), 'Seconda domanda?');

select results_eq(
  $$select r.question, r.form_enabled, r.form_question is null, r.form_slug ~ '^[a-z0-9-]{3,60}$', r.form_slug like 'area-a-%'
    from public.research r where r.id = (select id from a_research)$$,
  $$values ('Perché i team piccoli non passano a Pro?', true, true, true, true)$$,
  'create_research makes a unique slug matching the pattern, form enabled and null form question'
);
select is(
  (select count(distinct form_slug)::integer from public.research where workspace_id = (select id from ws where name = 'a')),
  2,
  'each Research gets its own slug'
);
select throws_ok(
  $$select public.create_research((select id from ws where name = 'a'), '   ')$$,
  '22023', 'invalid_question', 'create_research refuses a blank question'
);
select throws_ok(
  $$select public.create_research((select id from ws where name = 'a'), repeat('a', 201))$$,
  '22023', 'invalid_question', 'create_research refuses a question over 200 characters'
);
select throws_ok(
  $$insert into public.research (workspace_id, question, form_slug) select id, 'Diretta?', 'diretta-123' from ws where name = 'a'$$,
  '42501', null, 'a Research cannot be inserted directly'
);
reset role;

-- B's Research, made by B.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000b2", "role": "authenticated"}';
create temporary table b_research on commit drop as
select public.create_research((select id from ws where name = 'b'), 'La domanda di B?') as id;
grant select on a_research, b_research to authenticated, anon;
reset role;

-- ===== AC 8 and 9 (part): A cannot read or change B's Research =====

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a2", "role": "authenticated"}';

select is(
  (select count(*)::integer from public.research where workspace_id <> (select id from ws where name = 'a')),
  0, 'A reads no research of B, unfiltered'
);
select is(
  (select count(*)::integer from public.research where id = (select id from b_research)),
  0, 'A reads no research of B, by id'
);
select is_empty(
  $$update public.research set question = 'Presa' where id = (select id from b_research) returning id$$,
  'A cannot update a research of B'
);
select is_empty(
  $$delete from public.research where id = (select id from b_research) returning id$$,
  'A cannot delete a research of B'
);
select throws_ok(
  $$insert into public.feedback (workspace_id, research_id, text, channel)
    select (select id from ws where name = 'a'), (select id from b_research), 'Intruso', 'Supporto'$$,
  '23503', null, 'a feedback with A''s workspace and B''s research is refused'
);
select throws_ok(
  $$update public.research set form_slug = 'presa-123' where id = (select id from a_research)$$,
  '42501', null, 'A cannot choose the form link of their own Research'
);
select lives_ok(
  $$update public.research set question = 'Nuova domanda?', form_enabled = false, form_question = 'Come va?'
    where id = (select id from a_research)$$,
  'A can change the question and the form of their own Research'
);
reset role;

select results_eq(
  $$select question from public.research where id = (select id from b_research)$$,
  $$values ('La domanda di B?')$$,
  'B''s Research is unchanged'
);

-- ===== AC 2: a feedback needs a Research =====

select throws_ok(
  $$insert into public.feedback (workspace_id, text, channel) select id, 'Senza Research', 'Supporto' from ws where name = 'a'$$,
  '23502', null, 'a feedback without research_id violates not null'
);

-- ===== AC 8 (part): anon reads nothing =====

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok('select * from public.research', '42501', null, 'anon cannot read research');
select throws_ok(
  $$select public.create_research((select id from ws where name = 'a'), 'Anonima?')$$,
  '42501', null, 'anon cannot call create_research'
);
reset role;

select * from finish();
rollback;
