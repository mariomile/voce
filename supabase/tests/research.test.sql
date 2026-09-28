-- Research: the table, its access rules, create_research, and feedback that always belong to one.
begin;
create extension if not exists pgtap with schema extensions;
select plan(38);

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
grant select on ws to authenticated, anon, service_role;

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

-- ===== AC 27: CSV duplicates are looked for only in the same Research =====

insert into public.feedback (workspace_id, research_id, text, channel)
select r.workspace_id, r.id, 'Doppione', 'Supporto' from public.research r where r.id = (select id from a_research);

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a2", "role": "authenticated"}';
select is(
  public.import_feedback((select id from ws where name = 'a'), (select id from a_research),
    '[{"text": "Doppione", "channel": "Supporto", "customer": null, "received_at": null}]', true),
  array['duplicate'],
  'a row equal to a feedback of the same Research is duplicate'
);
select is(
  public.import_feedback((select id from ws where name = 'a'),
    (select r.id from public.research r where r.workspace_id = (select id from ws where name = 'a')
       and r.id <> (select id from a_research)),
    '[{"text": "Doppione", "channel": "Supporto", "customer": null, "received_at": null}]', true),
  array['new'],
  'the same row is new when the equal feedback is in another Research'
);

-- ===== AC 25 (database part): notes up to 10,000 characters; the CSV stays at 2,000 =====

select throws_ok(
  format($$select public.import_feedback(%L, %L, %L::jsonb, true)$$,
    (select id from ws where name = 'a'), (select id from a_research),
    jsonb_build_array(jsonb_build_object('text', repeat('a', 2001), 'channel', 'Supporto'))),
  '22023', 'invalid_rows', 'a 2,001-character CSV row is still refused'
);
reset role;

select lives_ok(
  $$insert into public.feedback (workspace_id, research_id, text, channel)
    select r.workspace_id, r.id, repeat('n', 10000), 'Intervista' from public.research r where r.id = (select id from a_research)$$,
  'a feedback of 10,000 characters is saved'
);
select throws_ok(
  $$insert into public.feedback (workspace_id, research_id, text, channel)
    select r.workspace_id, r.id, repeat('n', 10001), 'Intervista' from public.research r where r.id = (select id from a_research)$$,
  '23514', null, 'a feedback of 10,001 characters violates the check'
);
select is(
  public.submit_public_feedback((select r.form_slug from public.research r where r.id = (select id from b_research)),
    repeat('m', 2001), null, 'hash-ip'),
  'invalid',
  'a 2,001-character public form response is still refused'
);

-- ===== AC 66 (database part) =====

select lives_ok(
  $$insert into public.analytics_milestones (workspace_id, event) select id, 'first_research_collected' from ws where name = 'a'$$,
  'analytics_milestones accepts first_research_collected'
);

-- ===== AC 2: a feedback needs a Research =====

select throws_ok(
  $$insert into public.feedback (workspace_id, text, channel) select id, 'Senza Research', 'Supporto' from ws where name = 'a'$$,
  '23502', null, 'a feedback without research_id violates not null'
);

-- ===== AC 56: deleting a Research =====

-- A Research of A with everything a Research holds, another one that stays, and A on Free (3 analyses).
reset role;
insert into public.research (id, workspace_id, question, form_slug) values
  ('dd000000-0000-0000-0000-000000000001', (select id from ws where name = 'a'), 'Da eliminare?', 'da-eliminare'),
  ('dd000000-0000-0000-0000-000000000002', (select id from ws where name = 'a'), 'Resta?', 'resta-qui');
insert into public.feedback (id, workspace_id, research_id, text, channel) values
  ('dd100000-0000-0000-0000-000000000001', (select id from ws where name = 'a'), 'dd000000-0000-0000-0000-000000000001',
    'Il prezzo pesa.', 'Supporto'),
  ('dd100000-0000-0000-0000-000000000002', (select id from ws where name = 'a'), 'dd000000-0000-0000-0000-000000000002',
    'Resto qui.', 'Supporto');
-- Four analyses this month (three themes, one verdict), each with its log.
insert into public.analyses (id, workspace_id, research_id, kind, period_start, feedback_count, status)
select ('dd200000-0000-0000-0000-00000000000' || n)::uuid, (select id from ws where name = 'a'),
  'dd000000-0000-0000-0000-000000000001', (case when n = 3 then 'verdict' else 'themes' end)::public.analysis_kind,
  current_date, 1, 'done'
from generate_series(1, 4) n;
insert into public.analysis_runs (analysis_id, workspace_id, model, input, output, issues, input_tokens)
select id, workspace_id, 'm', '{"prompt": "Il prezzo pesa."}', '"Il prezzo pesa."', '[]', 100
from public.analyses where research_id = 'dd000000-0000-0000-0000-000000000001';
insert into public.themes (id, workspace_id, research_id, analysis_id, kind, title, summary, sentiment)
values ('dd300000-0000-0000-0000-000000000001', (select id from ws where name = 'a'), 'dd000000-0000-0000-0000-000000000001',
  'dd200000-0000-0000-0000-000000000001', 'problem', 'Prezzo', 'Il prezzo pesa.', 'negative');
insert into public.theme_feedback (theme_id, feedback_id, workspace_id, quote_rank, highlight)
values ('dd300000-0000-0000-0000-000000000001', 'dd100000-0000-0000-0000-000000000001', (select id from ws where name = 'a'), 1, 'prezzo');
insert into public.research_hypotheses (id, workspace_id, research_id, text)
values ('dd400000-0000-0000-0000-000000000001', (select id from ws where name = 'a'), 'dd000000-0000-0000-0000-000000000001', 'Il prezzo frena');
insert into public.hypothesis_verdicts (hypothesis_id, workspace_id, research_id, analysis_id, verdict, reasoning, feedback_read, arrived_after)
values ('dd400000-0000-0000-0000-000000000001', (select id from ws where name = 'a'), 'dd000000-0000-0000-0000-000000000001',
  'dd200000-0000-0000-0000-000000000003', 'confirmed', 'Il prezzo pesa.', 1, 0);
insert into public.verdict_feedback (hypothesis_id, feedback_id, workspace_id, stance, quote_rank, highlight)
values ('dd400000-0000-0000-0000-000000000001', 'dd100000-0000-0000-0000-000000000001', (select id from ws where name = 'a'), 'for', 1, 'prezzo');
insert into public.questions (id, workspace_id, research_id, status, feedback_considered)
values ('dd500000-0000-0000-0000-000000000001', (select id from ws where name = 'a'), 'dd000000-0000-0000-0000-000000000001', 'failed', 1);
insert into public.question_runs (question_id, workspace_id, model, input, output, issues, input_tokens)
values ('dd500000-0000-0000-0000-000000000001', (select id from ws where name = 'a'), 'm', '{"prompt": "Il prezzo pesa?"}',
  '"Il prezzo pesa."', '[]', 50);
-- The fourth analysis is still running (set after the hypothesis: they are locked during an analysis).
update public.analyses set status = 'running' where id = 'dd200000-0000-0000-0000-000000000004';

-- The member deletes it during an analysis: the hypotheses go with it.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a2", "role": "authenticated"}';
select lives_ok(
  $$delete from public.research where id = 'dd000000-0000-0000-0000-000000000001'$$,
  'a member deletes a Research, also during one of its analyses'
);
reset role;

select results_eq(
  $$select (select count(*) from public.feedback where research_id = 'dd000000-0000-0000-0000-000000000001')::integer,
      (select count(*) from public.feedback where id = 'dd100000-0000-0000-0000-000000000002')::integer,
      (select count(*) from public.themes where id = 'dd300000-0000-0000-0000-000000000001')::integer,
      (select count(*) from public.theme_feedback where theme_id = 'dd300000-0000-0000-0000-000000000001')::integer,
      (select count(*) from public.research_hypotheses where id = 'dd400000-0000-0000-0000-000000000001')::integer,
      (select count(*) from public.hypothesis_verdicts where hypothesis_id = 'dd400000-0000-0000-0000-000000000001')::integer,
      (select count(*) from public.verdict_feedback where hypothesis_id = 'dd400000-0000-0000-0000-000000000001')::integer$$,
  $$values (0, 1, 0, 0, 0, 0, 0)$$,
  'deleting a Research deletes its feedback, themes, hypotheses, verdicts and links, and nothing of another Research'
);

select results_eq(
  $$select (select count(*) from public.analyses where id::text like 'dd200000-%' and research_id is null)::integer,
      (select count(*) from public.questions where id = 'dd500000-0000-0000-0000-000000000001' and research_id is null)::integer$$,
  $$values (4, 1)$$,
  'its analyses and questions stay with a null research_id'
);

select results_eq(
  $$select count(*)::integer, count(*) filter (where input is null and output is null and issues is null)::integer,
      count(*) filter (where model = 'm' and input_tokens = 100)::integer
    from public.analysis_runs where analysis_id::text like 'dd200000-%'$$,
  $$values (4, 4, 4)$$,
  'their analysis runs lose input, output and issues, and keep model and tokens'
);
select results_eq(
  $$select input is null and output is null and issues is null, input_tokens from public.question_runs
    where question_id = 'dd500000-0000-0000-0000-000000000001'$$,
  $$values (true, 50)$$,
  'their question runs lose input, output and issues, and keep the tokens'
);

-- The analysis that was running closes after the deletion: its log takes no text back.
set local role service_role;
select public.fail_analysis('dd200000-0000-0000-0000-000000000004', 'research_deleted',
  '{"output": "Il prezzo pesa.", "issues": [{"reason": "x"}], "input_tokens": 7}');
reset role;
select results_eq(
  $$select error, output is null and issues is null, input_tokens from public.analysis_runs
    where analysis_id = 'dd200000-0000-0000-0000-000000000004'$$,
  $$values ('research_deleted'::text, true, 7)$$,
  'a run closed after its Research was deleted keeps no text'
);

-- Still counted: the 3 done analyses of the deleted Research fill A's Free month.
set local role service_role;
select is(
  (select outcome from public.start_analysis((select id from ws where name = 'a'), 'dd000000-0000-0000-0000-000000000002', 'm',
    array['themes']::public.analysis_kind[], current_date, 1, '{}')),
  'limit',
  'the analyses of a deleted Research still count in the month'
);
reset role;

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
