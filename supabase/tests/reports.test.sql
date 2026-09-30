-- The report of a Research: a 'report' row of analyses reserved by start_analysis (1 analysis of the plan),
-- finish_report only for the server, the quotes checked again against the saved feedback, reports readable
-- only by the members of their workspace and gone with their Research.
begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a9', 'reports-a@test.voce', '{"workspace_name": "A"}'),
  ('00000000-0000-0000-0000-0000000000b9', 'reports-b@test.voce', '{"workspace_name": "B"}');

create temporary table ws on commit drop as
select case m.user_id when '00000000-0000-0000-0000-0000000000a9' then 'a' else 'b' end as name, m.workspace_id as id
from public.workspace_members m
where m.user_id in ('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-0000000000b9');

grant select on ws to authenticated, anon, service_role;

-- A has two Research (r1 with two feedback, r2 with one), B one.
insert into public.research (id, workspace_id, question, form_slug) values
  ('a0000000-0000-0000-0000-000000000001', (select id from ws where name = 'a'), 'Perché i team piccoli non passano a Pro?', 'report-uno'),
  ('a0000000-0000-0000-0000-000000000002', (select id from ws where name = 'a'), 'Seconda domanda?', 'report-due'),
  ('a0000000-0000-0000-0000-000000000003', (select id from ws where name = 'b'), 'Domanda di B?', 'report-b');
insert into public.feedback (id, workspace_id, research_id, text, channel) values
  ('a1000000-0000-0000-0000-000000000001', (select id from ws where name = 'a'), 'a0000000-0000-0000-0000-000000000001',
    'Il prezzo per utente pesa sui team piccoli.', 'Supporto'),
  ('a1000000-0000-0000-0000-000000000002', (select id from ws where name = 'a'), 'a0000000-0000-0000-0000-000000000001',
    'Siamo in tre e Pro costa troppo per noi.', 'Intervista'),
  ('a1000000-0000-0000-0000-000000000003', (select id from ws where name = 'a'), 'a0000000-0000-0000-0000-000000000002',
    'Feedback di un''altra Research.', 'Supporto');

-- The themes analysis the report comes from, done; a verdict analysis, done; both of r1.
insert into public.analyses (id, workspace_id, research_id, kind, period_start, feedback_count, status) values
  ('a2000000-0000-0000-0000-000000000001', (select id from ws where name = 'a'), 'a0000000-0000-0000-0000-000000000001',
    'themes', current_date, 2, 'done'),
  ('a2000000-0000-0000-0000-000000000002', (select id from ws where name = 'a'), 'a0000000-0000-0000-0000-000000000001',
    'verdict', current_date, 2, 'done');

create temporary table started (id uuid) on commit drop;
grant select, insert, delete on started to service_role;

-- ===== The functions are only for the server =====

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a9", "role": "authenticated"}';
select throws_ok(
  $$select public.finish_report('a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'it', '{}', 2, '{}')$$,
  '42501', null, 'authenticated cannot call finish_report'
);
select throws_ok(
  $$insert into public.research_reports (workspace_id, research_id, analysis_id, source_analysis_id, locale, content, feedback_count, model)
    values ((select id from ws where name = 'a'), 'a0000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
      'a2000000-0000-0000-0000-000000000001', 'it', '{}', 2, 'm')$$,
  '42501', null, 'authenticated cannot write a report'
);
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok(
  $$select public.finish_report('a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'it', '{}', 2, '{}')$$,
  '42501', null, 'anon cannot call finish_report'
);
reset role;

set local role service_role;

-- ===== A report is 1 analysis of the plan =====

insert into started
select analysis_id from public.start_analysis((select id from ws where name = 'a'), 'a0000000-0000-0000-0000-000000000001',
  'claude-test', array['report']::public.analysis_kind[], current_date, 2, '{"report": {"prompt": "dati"}}');
select results_eq(
  $$select a.kind::text, a.status::text, r.model, r.input ->> 'prompt'
    from public.analyses a join public.analysis_runs r on r.analysis_id = a.id where a.id = (select id from started)$$,
  $$values ('report', 'running', 'claude-test', 'dati')$$,
  'start_analysis reserves a running report row with its log'
);
select results_eq(
  $$select outcome from public.start_analysis((select id from ws where name = 'a'), 'a0000000-0000-0000-0000-000000000002',
    'm', array['themes']::public.analysis_kind[], current_date, 1, '{}')$$,
  $$values ('busy')$$,
  'a running report makes the workspace busy'
);

-- ===== Checks before saving =====

select throws_ok(
  $$select public.finish_report('a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'it', '{}', 2, '{}')$$,
  '22023', 'analysis_not_running', 'finish_report only closes a running report row'
);
select throws_ok(
  $$select public.finish_report((select id from started), 'a2000000-0000-0000-0000-000000000002', 'it', '{}', 2, '{}')$$,
  '22023', 'invalid_source', 'the source must be a done themes analysis'
);
select throws_ok(
  $$select public.finish_report((select id from started), 'a2000000-0000-0000-0000-000000000001', 'it',
    '{"findings": [{"quotes": [{"feedbackId": "a1000000-0000-0000-0000-000000000001", "highlight": "pesa sui team grandi"}]}]}', 2, '{}')$$,
  '22023', 'quote_not_in_feedback', 'a quote not in its feedback fails the save'
);
select throws_ok(
  $$select public.finish_report((select id from started), 'a2000000-0000-0000-0000-000000000001', 'it',
    '{"hypotheses": [{"quotes": [{"feedbackId": "a1000000-0000-0000-0000-000000000002", "highlight": ""}]}]}', 2, '{}')$$,
  '22023', 'quote_not_in_feedback', 'an empty highlight fails the save'
);
select throws_ok(
  $$select public.finish_report((select id from started), 'a2000000-0000-0000-0000-000000000001', 'it',
    '{"findings": [{"quotes": [{"feedbackId": "a1000000-0000-0000-0000-000000000003", "highlight": "altra Research"}]}]}', 2, '{}')$$,
  '22023', 'quote_not_in_feedback', 'a quote of a feedback of another Research fails the save'
);
select throws_ok(
  $$select public.finish_report((select id from started), 'a2000000-0000-0000-0000-000000000001', 'it',
    '{"findings": [{"quotes": [{"highlight": "pesa sui team piccoli"}]}]}', 2, '{}')$$,
  '22023', 'quote_not_in_feedback', 'a quote without its feedback fails the save'
);
select is(
  (select count(*)::integer from public.research_reports),
  0,
  'nothing is saved when a check fails'
);

-- ===== Saving =====

select isnt(
  public.finish_report((select id from started), 'a2000000-0000-0000-0000-000000000001', 'it', $${
    "summary": ["Il prezzo frena i team piccoli."],
    "findings": [{"themeId": "t", "quotes": [
      {"feedbackId": "a1000000-0000-0000-0000-000000000001", "highlight": "pesa sui team piccoli"},
      {"feedbackId": "a1000000-0000-0000-0000-0000000000ff", "highlight": "feedback eliminato nel frattempo"}
    ]}],
    "hypotheses": [{"quotes": [{"feedbackId": "a1000000-0000-0000-0000-000000000002", "highlight": "Pro costa troppo", "stance": "for"}]}]
  }$$::jsonb, 2, '{"output": {"summary": []}, "issues": [], "input_tokens": 12000, "output_tokens": 3000, "duration_ms": 40000, "cost_usd": 0.054}'),
  null,
  'finish_report saves the report, skipping a quote of a feedback deleted meanwhile'
);
select results_eq(
  $$select research_id::text, source_analysis_id::text, locale, feedback_count, model, input_tokens, output_tokens, cost_usd, duration_ms,
      content -> 'summary' ->> 0
    from public.research_reports where analysis_id = (select id from started)$$,
  $$values ('a0000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'it', 2, 'claude-test', 12000, 3000,
      0.054::numeric(12, 6), 40000, 'Il prezzo frena i team piccoli.')$$,
  'the report keeps its Research, source, language, model, tokens and cost'
);
select results_eq(
  $$select a.status::text, r.output_tokens, r.cost_usd, r.finished_at is not null
    from public.analyses a join public.analysis_runs r on r.analysis_id = a.id where a.id = (select id from started)$$,
  $$values ('done', 3000, 0.054::numeric(12, 6), true)$$,
  'the report row of analyses is done and its log closed'
);
select throws_ok(
  $$select public.finish_report((select id from started), 'a2000000-0000-0000-0000-000000000001', 'it', '{}', 2, '{}')$$,
  '22023', 'analysis_not_running', 'a report row is saved once'
);
-- Free: 3 analyses a month. The themes, the verdict and the report are done: no room for another report.
select results_eq(
  $$select outcome from public.start_analysis((select id from ws where name = 'a'), 'a0000000-0000-0000-0000-000000000002',
    'm', array['report']::public.analysis_kind[], current_date, 1, '{}')$$,
  $$values ('limit')$$,
  'the report used 1 analysis of the plan: at the limit, no other report'
);

-- On Pro, a second report, on r2 once it has its themes.
insert into public.analyses (id, workspace_id, research_id, kind, period_start, feedback_count, status) values
  ('a2000000-0000-0000-0000-000000000003', (select id from ws where name = 'a'), 'a0000000-0000-0000-0000-000000000002',
    'themes', current_date, 1, 'done');
update public.subscriptions set plan = 'pro' where workspace_id = (select id from ws where name = 'a');
delete from started;
insert into started
select analysis_id from public.start_analysis((select id from ws where name = 'a'), 'a0000000-0000-0000-0000-000000000002',
  'claude-test', array['report']::public.analysis_kind[], current_date, 1, '{}');
select throws_ok(
  $$select public.finish_report((select id from started), 'a2000000-0000-0000-0000-000000000003', 'fr', '{}', 1, '{}')$$,
  '23514', null, 'the language is it or en'
);
select throws_ok(
  $$select public.finish_report((select id from started), 'a2000000-0000-0000-0000-000000000001', 'en', '{}', 1, '{}')$$,
  '22023', 'invalid_source', 'the source must be of the same Research'
);
select isnt(
  public.finish_report((select id from started), 'a2000000-0000-0000-0000-000000000003', 'en', '{"summary": []}', 1, '{}'),
  null,
  'a second report, on the other Research'
);

reset role;

-- ===== Who reads a report =====

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a9", "role": "authenticated"}';
select is((select count(*)::integer from public.research_reports), 2, 'a member reads the reports of their workspace');
select throws_ok(
  $$update public.research_reports set locale = 'en'$$, '42501', null, 'a member cannot change a report'
);
select throws_ok($$delete from public.research_reports$$, '42501', null, 'a member cannot delete a report');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000b9", "role": "authenticated"}';
select is((select count(*)::integer from public.research_reports), 0, 'another workspace reads no report');
reset role;

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok($$select count(*) from public.research_reports$$, '42501', null, 'anon cannot read reports');
reset role;

-- ===== Deleting =====

create temporary table first_report on commit drop as
select analysis_id as id from public.research_reports where research_id = 'a0000000-0000-0000-0000-000000000001';
delete from public.research where id = 'a0000000-0000-0000-0000-000000000001';
select results_eq(
  $$select research_id::text from public.research_reports$$,
  $$values ('a0000000-0000-0000-0000-000000000002')$$,
  'deleting a Research deletes its reports, not the others'
);
select results_eq(
  $$select a.research_id is null, r.input is null, r.output is null, r.cost_usd
    from public.analyses a join public.analysis_runs r on r.analysis_id = a.id where a.id = (select id from first_report)$$,
  $$values (true, true, true, 0.054::numeric(12, 6))$$,
  'the report row stays for the quota, without its texts'
);

select lives_ok(
  $$delete from public.workspaces where id = (select id from ws where name = 'a')$$,
  'deleting a workspace with a report works'
);
select is((select count(*)::integer from public.research_reports), 0, 'its reports go with it');

select * from finish();
rollback;
