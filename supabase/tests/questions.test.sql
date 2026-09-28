-- Questions to the feedback: tables only the server reads and writes, and the quota functions.
begin;
create extension if not exists pgtap with schema extensions;
select plan(52);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.questions'::regclass),
  'RLS is enabled on questions'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.question_runs'::regclass),
  'RLS is enabled on question_runs'
);

-- Four users: the signup trigger gives each one a Free workspace.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'questions-a@test.voce', '{"workspace_name": "A"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'questions-b@test.voce', '{"workspace_name": "B"}'),
  ('00000000-0000-0000-0000-0000000000c1', 'questions-c@test.voce', '{"workspace_name": "C"}'),
  ('00000000-0000-0000-0000-0000000000d1', 'questions-d@test.voce', '{"workspace_name": "D"}');

create temporary table ws on commit drop as
select case m.user_id
    when '00000000-0000-0000-0000-0000000000a1' then 'a'
    when '00000000-0000-0000-0000-0000000000b1' then 'b'
    when '00000000-0000-0000-0000-0000000000c1' then 'c'
    else 'd'
  end as name,
  m.workspace_id as id
from public.workspace_members m
where m.user_id in ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1',
                    '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1');
grant select on ws to authenticated, anon;

-- One Research per workspace (rs), and one of B that A must not be able to ask about.
create temporary table rs on commit drop as
select w.name, gen_random_uuid() as id, w.id as workspace_id from ws w;
insert into public.research (id, workspace_id, question, form_slug)
select id, workspace_id, 'Domanda ' || name || '?', 'questions-' || name from rs;
grant select on rs to authenticated, anon, service_role;

-- One question with its log in A and in B.
insert into public.questions (id, workspace_id, status, outcome, feedback_considered, feedback_count, citation_count)
select case w.name when 'a' then '10000000-0000-0000-0000-0000000000a1'::uuid else '10000000-0000-0000-0000-0000000000b1'::uuid end,
  w.id, 'done', 'answered', 3, 2, 1
from ws w where w.name in ('a', 'b');
insert into public.question_runs (question_id, workspace_id, model, input)
select q.id, q.workspace_id, 'anthropic/claude-sonnet-5', '{"prompt": "segreto"}'
from public.questions q where q.id in ('10000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000b1');

-- ===== AC 2 and 3: nobody but the server reads or writes the tables =====

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';

select throws_ok('select * from public.questions', '42501', null, 'A cannot read questions, unfiltered');
select throws_ok($$select * from public.questions where id = '10000000-0000-0000-0000-0000000000b1'$$, '42501', null,
  'A cannot read B''s question by id');
select throws_ok('select * from public.question_runs', '42501', null, 'A cannot read question_runs, unfiltered');
select throws_ok($$select * from public.question_runs where question_id = '10000000-0000-0000-0000-0000000000b1'$$, '42501', null,
  'A cannot read B''s run by id');
select throws_ok($$insert into public.questions (workspace_id, feedback_considered) select id, 1 from ws where name = 'a'$$,
  '42501', null, 'authenticated cannot insert questions');
select throws_ok($$update public.questions set status = 'done'$$, '42501', null, 'authenticated cannot update questions');
select throws_ok('delete from public.questions', '42501', null, 'authenticated cannot delete questions');
select throws_ok($$insert into public.question_runs (question_id, workspace_id, model, input)
  values ('10000000-0000-0000-0000-0000000000a1', (select id from ws where name = 'a'), 'm', '{}')$$,
  '42501', null, 'authenticated cannot insert question_runs');
select throws_ok($$update public.question_runs set error = 'x'$$, '42501', null, 'authenticated cannot update question_runs');
select throws_ok('delete from public.question_runs', '42501', null, 'authenticated cannot delete question_runs');

-- ===== AC 4: the functions are only for the server =====

select throws_ok($$select public.start_question((select id from ws where name = 'a'), (select id from rs where name = 'a'), 'm', 1, '{}')$$, '42501', null,
  'authenticated cannot call start_question');
select throws_ok($$select public.finish_question('10000000-0000-0000-0000-0000000000a1', 1, '[]', '{}')$$, '42501', null,
  'authenticated cannot call finish_question');
select throws_ok($$select public.fail_question('10000000-0000-0000-0000-0000000000a1', 'x', '{}')$$, '42501', null,
  'authenticated cannot call fail_question');
select throws_ok($$select public.question_usage((select id from ws where name = 'a'))$$, '42501', null,
  'authenticated cannot call question_usage');
reset role;

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok('select * from public.questions', '42501', null, 'anon cannot read questions');
select throws_ok($$select * from public.questions where id = '10000000-0000-0000-0000-0000000000b1'$$, '42501', null,
  'anon cannot read a question by id');
select throws_ok('select * from public.question_runs', '42501', null, 'anon cannot read question_runs');
select throws_ok($$select * from public.question_runs where question_id = '10000000-0000-0000-0000-0000000000b1'$$, '42501', null,
  'anon cannot read a run by id');
select throws_ok($$insert into public.questions (workspace_id, feedback_considered) select id, 1 from ws where name = 'a'$$,
  '42501', null, 'anon cannot insert questions');
select throws_ok($$update public.questions set status = 'done'$$, '42501', null, 'anon cannot update questions');
select throws_ok('delete from public.questions', '42501', null, 'anon cannot delete questions');
select throws_ok($$insert into public.question_runs (question_id, workspace_id, model, input)
  values ('10000000-0000-0000-0000-0000000000a1', (select id from ws where name = 'a'), 'm', '{}')$$,
  '42501', null, 'anon cannot insert question_runs');
select throws_ok($$update public.question_runs set error = 'x'$$, '42501', null, 'anon cannot update question_runs');
select throws_ok('delete from public.question_runs', '42501', null, 'anon cannot delete question_runs');
select throws_ok($$select public.start_question((select id from ws where name = 'a'), (select id from rs where name = 'a'), 'm', 1, '{}')$$, '42501', null,
  'anon cannot call start_question');
select throws_ok($$select public.finish_question('10000000-0000-0000-0000-0000000000a1', 1, '[]', '{}')$$, '42501', null,
  'anon cannot call finish_question');
select throws_ok($$select public.fail_question('10000000-0000-0000-0000-0000000000a1', 'x', '{}')$$, '42501', null,
  'anon cannot call fail_question');
select throws_ok($$select public.question_usage((select id from ws where name = 'a'))$$, '42501', null,
  'anon cannot call question_usage');
reset role;

-- ===== AC 5: Free 10, Pro 100 questions per Italian calendar month, in any state =====

-- A (Free) already has 1 done question. 8 more of this month in every state; the running one is
-- older than 5 minutes, so it is closed as stale and still counts. Last month's do not count.
insert into public.questions (workspace_id, status, outcome, feedback_considered, created_at)
select w.id, s.status::public.question_status, s.outcome::public.question_outcome, 1, s.created_at
from ws w, (values
  ('done', 'answered', now()), ('done', 'no_evidence', now()), ('done', 'answered', now()),
  ('failed', null, now()), ('failed', null, now()), ('failed', null, now()), ('failed', null, now()),
  ('running', null, now() - interval '6 minutes')
) as s (status, outcome, created_at)
where w.name = 'a';
insert into public.questions (workspace_id, status, outcome, feedback_considered, created_at)
select w.id, 'done', 'answered', 1, date_trunc('month', now() at time zone 'Europe/Rome') at time zone 'Europe/Rome' - interval '1 day'
from ws w, generate_series(1, 5) where w.name = 'a';

select is((select outcome from public.start_question((select id from ws where name = 'a'), (select id from rs where name = 'a'), 'm', 1, '{}')), 'ok',
  'Free: with 9 questions this month in mixed states, the tenth is reserved');
update public.questions set status = 'done', outcome = 'answered'
where workspace_id = (select id from ws where name = 'a') and status = 'running';
select is((select outcome from public.start_question((select id from ws where name = 'a'), (select id from rs where name = 'a'), 'm', 1, '{}')), 'limit',
  'Free: with 10 questions this month, the next one is refused');
select results_eq($$select used, quota from public.question_usage((select id from ws where name = 'a'))$$,
  $$values (10, 10)$$, 'question_usage counts every state of this month only');

-- B (Pro) already has 1 done question: 98 more.
update public.subscriptions set plan = 'pro' where workspace_id = (select id from ws where name = 'b');
insert into public.questions (workspace_id, status, outcome, feedback_considered)
select w.id, case when g % 2 = 0 then 'done' else 'failed' end::public.question_status,
  case when g % 2 = 0 then 'answered' end::public.question_outcome, 1
from ws w, generate_series(1, 98) g where w.name = 'b';
select is((select outcome from public.start_question((select id from ws where name = 'b'), (select id from rs where name = 'b'), 'm', 1, '{}')), 'ok',
  'Pro: with 99 questions this month, the hundredth is reserved');
update public.questions set status = 'failed' where workspace_id = (select id from ws where name = 'b') and status = 'running';
select is((select outcome from public.start_question((select id from ws where name = 'b'), (select id from rs where name = 'b'), 'm', 1, '{}')), 'limit',
  'Pro: with 100 questions this month, the next one is refused');
select results_eq($$select used, quota from public.question_usage((select id from ws where name = 'b'))$$,
  $$values (100, 100)$$, 'question_usage reads the Pro quota');

-- ===== AC 7: the question quota is separate from the analyses =====

insert into public.analyses (workspace_id, period_start, feedback_count, status)
select w.id, current_date, 1, 'done' from ws w, generate_series(1, 3) where w.name = 'c';
select is((select outcome from public.start_question((select id from ws where name = 'c'), (select id from rs where name = 'c'), 'm', 1, '{}')), 'ok',
  'Free with 3 done analyses this month can still ask');
select results_eq($$select used, quota from public.question_usage((select id from ws where name = 'c'))$$,
  $$values (1, 10)$$, 'analyses do not count as questions');

-- ===== AC 8: one question at a time; a stuck one is freed after 5 minutes and counts =====

insert into public.questions (id, workspace_id, feedback_considered, created_at)
select '20000000-0000-0000-0000-0000000000d1', w.id, 1, now() - interval '2 minutes' from ws w where w.name = 'd';
insert into public.question_runs (question_id, workspace_id, model, input)
select '20000000-0000-0000-0000-0000000000d1', w.id, 'm', '{}' from ws w where w.name = 'd';
select is((select outcome from public.start_question((select id from ws where name = 'd'), (select id from rs where name = 'd'), 'm', 1, '{}')), 'busy',
  'a running question under 5 minutes old makes the next one busy');
select results_eq($$select used from public.question_usage((select id from ws where name = 'd'))$$,
  $$values (1)$$, 'busy reserves nothing');

update public.questions set created_at = now() - interval '6 minutes' where id = '20000000-0000-0000-0000-0000000000d1';
select is((select outcome from public.start_question((select id from ws where name = 'd'), (select id from rs where name = 'd'), 'm', 1, '{}')), 'ok',
  'over 5 minutes the stuck question no longer blocks: the new one is reserved');
select results_eq(
  $$select q.status::text, r.error, r.finished_at is not null from public.questions q
    join public.question_runs r on r.question_id = q.id where q.id = '20000000-0000-0000-0000-0000000000d1'$$,
  $$values ('failed', 'stale', true)$$, 'the stuck question is failed as stale in question_runs');
select results_eq($$select used from public.question_usage((select id from ws where name = 'd'))$$,
  $$values (2)$$, 'the stale question still counts, with the new one');

-- ===== AC 17: finish_question checks the quotes again on the saved feedback =====

insert into public.feedback (id, workspace_id, research_id, text, channel)
select v.id::uuid, w.id, r.id, v.text, 'Supporto' from ws w join public.research r on r.workspace_id = w.id, (values
  ('30000000-0000-0000-0000-000000000001', 'La banca si scollega ogni lunedì.'),
  ('30000000-0000-0000-0000-000000000002', 'Devo ricollegare la banca ogni settimana.')
) as v (id, text) where w.name = 'c';
-- C has a running question from the AC 7 test.
create temporary table c_question on commit drop as
select q.id from public.questions q where q.workspace_id = (select id from ws where name = 'c') and q.status = 'running';

select throws_ok(
  $$select public.finish_question((select id from c_question), 2,
    '[{"feedback_id": "30000000-0000-0000-0000-000000000001", "text": "si scollega ogni martedì"}]', '{}')$$,
  '22023', 'quote_not_in_feedback', 'a quote not in the saved text is refused');
select is((select status::text from public.questions where id = (select id from c_question)), 'running',
  'the refused question stays running');

select is(
  public.finish_question((select id from c_question), 2,
    '[{"feedback_id": "30000000-0000-0000-0000-000000000002", "text": "ricollegare la banca"},
      {"feedback_id": "30000000-0000-0000-0000-000000000001", "text": "si scollega"}]',
    '{"output": {"answer": "x"}, "issues": [], "input_tokens": 10, "output_tokens": 5, "duration_ms": 7, "cost_usd": 0.001}'),
  '[{"feedback_id": "30000000-0000-0000-0000-000000000002", "text": "ricollegare la banca"},
    {"feedback_id": "30000000-0000-0000-0000-000000000001", "text": "si scollega"}]'::jsonb,
  'finish_question returns the kept quotes in order');
select results_eq(
  $$select q.status::text, q.outcome::text, q.feedback_count, q.citation_count::integer, r.input_tokens, r.finished_at is not null
    from public.questions q join public.question_runs r on r.question_id = q.id where q.id = (select id from c_question)$$,
  $$values ('done', 'answered', 2, 2, 10, true)$$, 'the question is answered, with the count and the log');

-- A quote of a feedback deleted meanwhile is dropped; with none left the outcome is no_evidence.
select is((select outcome from public.start_question((select id from ws where name = 'c'), (select id from rs where name = 'c'), 'm', 1, '{}')), 'ok',
  'C reserves another question');
create temporary table c_second on commit drop as
select q.id from public.questions q where q.workspace_id = (select id from ws where name = 'c') and q.status = 'running';
delete from public.feedback where id = '30000000-0000-0000-0000-000000000001';
select is(
  public.finish_question((select id from c_second), 1,
    '[{"feedback_id": "30000000-0000-0000-0000-000000000001", "text": "si scollega"}]', '{}'),
  '[]'::jsonb, 'the quote of a deleted feedback is dropped');
select results_eq(
  $$select outcome::text, citation_count::integer from public.questions where id = (select id from c_second)$$,
  $$values ('no_evidence', 0)$$, 'with no quote left the outcome is no_evidence');

-- ===== AC 50 (database part): the question belongs to its Research =====

select is(
  (select research_id from public.questions where id = (select id from c_second)),
  (select id from rs where name = 'c'),
  'start_question saves questions.research_id'
);
select throws_ok(
  $$select public.start_question((select id from ws where name = 'a'), (select id from rs where name = 'b'), 'm', 1, '{}')$$,
  '22023', 'unknown_research', 'a Research of another workspace is refused'
);

select * from finish();
rollback;
