-- Analyses of a Research: start_analysis with kinds, the quota and busy on the workspace, finish_analysis
-- that inherits only from the same Research.
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a3', 'analysis-a@test.voce', '{"workspace_name": "A"}'),
  ('00000000-0000-0000-0000-0000000000b3', 'analysis-b@test.voce', '{"workspace_name": "B"}');

create temporary table ws on commit drop as
select case m.user_id when '00000000-0000-0000-0000-0000000000a3' then 'a' else 'b' end as name, m.workspace_id as id
from public.workspace_members m
where m.user_id in ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000b3');

-- Two Research in A (r1, r2), one in B (rb), each with two feedback.
create temporary table rs on commit drop as
select v.name, v.id::uuid, (select id from ws where ws.name = v.ws) as workspace_id
from (values
  ('r1', 'a', '30000000-0000-0000-0000-000000000001'),
  ('r2', 'a', '30000000-0000-0000-0000-000000000002'),
  ('rb', 'b', '30000000-0000-0000-0000-000000000003')
) as v (name, ws, id);
insert into public.research (id, workspace_id, question, form_slug)
select id, workspace_id, 'Domanda ' || name || '?', 'analisi-' || name from rs;
insert into public.feedback (id, workspace_id, research_id, text, channel)
select ('40000000-0000-0000-0000-00000000000' || n)::uuid, r.workspace_id, r.id, 'La banca si scollega ' || n, 'Supporto'
from rs r join (values ('r1', 1), ('r1', 2), ('r2', 3), ('r2', 4), ('rb', 5), ('rb', 6)) as f (name, n) on f.name = r.name;

grant select on ws, rs to authenticated, anon, service_role;

-- ===== AC 10 (part): the functions are only for the server =====

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a3", "role": "authenticated"}';
select throws_ok(
  $$select public.start_analysis((select id from ws where name = 'a'), (select id from rs where name = 'r1'), 'm',
    array['themes']::public.analysis_kind[], current_date, 2, '{}')$$,
  '42501', null, 'authenticated cannot call start_analysis'
);
select throws_ok($$select public.finish_analysis(gen_random_uuid(), '[]', '{}')$$, '42501', null,
  'authenticated cannot call finish_analysis');
select throws_ok($$select public.fail_analysis(gen_random_uuid(), 'x', '{}')$$, '42501', null,
  'authenticated cannot call fail_analysis');
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok(
  $$select public.start_analysis((select id from ws where name = 'a'), (select id from rs where name = 'r1'), 'm',
    array['themes']::public.analysis_kind[], current_date, 2, '{}')$$,
  '42501', null, 'anon cannot call start_analysis'
);
select throws_ok($$select public.finish_analysis(gen_random_uuid(), '[]', '{}')$$, '42501', null,
  'anon cannot call finish_analysis');
reset role;

-- The server runs them with the secret key.
set local role service_role;

-- ===== The Research must be of the workspace =====

select throws_ok(
  $$select public.start_analysis((select id from ws where name = 'a'), (select id from rs where name = 'rb'), 'm',
    array['themes']::public.analysis_kind[], current_date, 2, '{}')$$,
  '22023', 'unknown_research', 'a Research of another workspace is refused'
);

-- ===== One row of analyses and of analysis_runs per kind =====

create temporary table started on commit drop as
select * from public.start_analysis((select id from ws where name = 'a'), (select id from rs where name = 'r1'), 'm',
  array['themes', 'verdict']::public.analysis_kind[], current_date, 2,
  '{"themes": {"prompt": "temi"}, "verdict": {"prompt": "verdetto"}}');

select results_eq(
  $$select s.outcome, s.kind::text, a.research_id = (select id from rs where name = 'r1'), a.kind::text, a.status::text,
      r.input ->> 'prompt'
    from started s join public.analyses a on a.id = s.analysis_id join public.analysis_runs r on r.analysis_id = a.id
    order by s.kind$$,
  $$values ('ok', 'themes', true, 'themes', 'running', 'temi'), ('ok', 'verdict', true, 'verdict', 'running', 'verdetto')$$,
  'themes and verdict reserve two rows in the same call, each with its run'
);

-- ===== AC 34: busy with a running analysis in any Research of the workspace =====

select results_eq(
  $$select outcome, kind, analysis_id from public.start_analysis((select id from ws where name = 'a'),
    (select id from rs where name = 'r2'), 'm', array['themes']::public.analysis_kind[], current_date, 2, '{}')$$,
  $$values ('busy', null::public.analysis_kind, null::uuid)$$,
  'a running analysis in any Research of the workspace makes start_analysis busy'
);
select results_eq(
  $$select outcome from public.start_analysis((select id from ws where name = 'b'),
    (select id from rs where name = 'rb'), 'm', array['themes']::public.analysis_kind[], current_date, 2, '{}')$$,
  $$values ('ok')$$,
  'another workspace is not busy'
);

-- The running rows are 11 minutes old: closed as stale, they do not block and do not count.
update public.analyses set created_at = now() - interval '11 minutes'
where workspace_id = (select id from ws where name = 'a');
select results_eq(
  $$select outcome, kind::text from public.start_analysis((select id from ws where name = 'a'),
    (select id from rs where name = 'r2'), 'm', array['themes']::public.analysis_kind[], current_date, 2, '{}')$$,
  $$values ('ok', 'themes')$$,
  'a running row older than 10 minutes does not block'
);
select results_eq(
  $$select a.status::text, r.error from public.analyses a join public.analysis_runs r on r.analysis_id = a.id
    where a.id in (select analysis_id from started) order by a.kind$$,
  $$values ('failed', 'stale'), ('failed', 'stale')$$,
  'it is failed as stale'
);

-- ===== AC 33: the quota counts every kind =====

delete from public.analyses where workspace_id = (select id from ws where name = 'a');
insert into public.analyses (workspace_id, research_id, period_start, feedback_count, status)
select id, (select id from rs where name = 'r1'), current_date, 1, 'done' from ws where name = 'a';

create temporary table two on commit drop as
select * from public.start_analysis((select id from ws where name = 'a'), (select id from rs where name = 'r1'), 'm',
  array['themes', 'verdict']::public.analysis_kind[], current_date, 2, '{}');
select is((select count(*)::integer from two where outcome = 'ok'), 2, 'Free with 1 used: themes and verdict pass');

update public.analyses set status = 'done' where id in (select analysis_id from two);
select results_eq(
  $$select outcome from public.start_analysis((select id from ws where name = 'a'), (select id from rs where name = 'r1'), 'm',
    array['themes']::public.analysis_kind[], current_date, 2, '{}')$$,
  $$values ('limit')$$,
  'limit when the done ones plus the requested exceed the plan'
);

delete from public.analyses where workspace_id = (select id from ws where name = 'a');
insert into public.analyses (workspace_id, research_id, period_start, feedback_count, status)
select id, (select id from rs where name = 'r1'), current_date, 1, 'done' from ws, generate_series(1, 2) where name = 'a';
select results_eq(
  $$select outcome from public.start_analysis((select id from ws where name = 'a'), (select id from rs where name = 'r1'), 'm',
    array['themes', 'verdict']::public.analysis_kind[], current_date, 2, '{}')$$,
  $$values ('limit')$$,
  'Free with 2 used: a request of 2 does not pass'
);
select is(
  (select count(*)::integer from public.analyses where workspace_id = (select id from ws where name = 'a')),
  2, 'a refused request reserves nothing'
);

delete from public.analyses where workspace_id = (select id from ws where name = 'a');
insert into public.analyses (workspace_id, research_id, period_start, feedback_count, status)
select id, (select id from rs where name = 'r1'), current_date, 1, 'failed' from ws, generate_series(1, 3) where name = 'a';
select results_eq(
  $$select outcome from public.start_analysis((select id from ws where name = 'a'), (select id from rs where name = 'r1'), 'm',
    array['themes']::public.analysis_kind[], current_date, 2, '{}')$$,
  $$values ('limit')$$,
  'limit when the failed ones reach the plan'
);
select results_eq(
  $$select outcome from public.start_analysis((select id from ws where name = 'a'), (select id from rs where name = 'r1'), 'm',
    array[]::public.analysis_kind[], current_date, 2, '{}')$$,
  $$values ('invalid')$$,
  'an empty request reserves nothing'
);

-- ===== AC 30: finish_analysis inherits priority and status only from the same Research =====

delete from public.analyses where workspace_id = (select id from ws where name = 'a');
-- r1 had "Banca" at high priority; later r2 had it at low priority and discarded.
insert into public.analyses (id, workspace_id, research_id, period_start, feedback_count, status, created_at)
select v.id::uuid, (select id from ws where name = 'a'), (select id from rs where name = v.r), current_date, 2, 'done', v.at
from (values
  ('50000000-0000-0000-0000-000000000001', 'r1', now() - interval '2 days'),
  ('50000000-0000-0000-0000-000000000002', 'r2', now() - interval '1 day')
) as v (id, r, at);
insert into public.themes (workspace_id, research_id, analysis_id, kind, title, summary, sentiment, priority, status)
select (select id from ws where name = 'a'), a.research_id, a.id, 'problem', 'Banca', 'Sintesi', 'negative',
  case a.id when '50000000-0000-0000-0000-000000000001' then 'high' else 'low' end::public.theme_priority,
  case a.id when '50000000-0000-0000-0000-000000000001' then 'roadmap' else 'discarded' end::public.theme_status
from public.analyses a where a.id in ('50000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002');

create temporary table third on commit drop as
select * from public.start_analysis((select id from ws where name = 'a'), (select id from rs where name = 'r1'), 'm',
  array['themes']::public.analysis_kind[], current_date, 2, '{}');
select is(
  public.finish_analysis((select analysis_id from third), jsonb_build_array(jsonb_build_object(
    'title', ' banca ', 'summary', 'Sintesi', 'kind', 'problem', 'sentiment', 'negative',
    'feedback', jsonb_build_array('40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002'),
    'quotes', jsonb_build_array(jsonb_build_object('feedback_id', '40000000-0000-0000-0000-000000000001', 'text', 'si scollega'))
  )), '{}'),
  1,
  'finish_analysis returns the number of verified quotes it saved'
);
select results_eq(
  $$select t.title, t.priority::text, t.status::text, t.research_id = (select id from rs where name = 'r1')
    from public.themes t where t.analysis_id = (select analysis_id from third)$$,
  $$values ('banca', 'high', 'roadmap', true)$$,
  'finish_analysis inherits priority and status only from the same Research, and saves its research_id'
);

-- A verdict row never counts as the previous themes analysis. Pro: the quota is not what this checks.
update public.subscriptions set plan = 'pro' where workspace_id = (select id from ws where name = 'a');
insert into public.analyses (workspace_id, research_id, period_start, feedback_count, status, kind)
select id, (select id from rs where name = 'r1'), current_date, 2, 'done', 'verdict' from ws where name = 'a';
create temporary table fourth on commit drop as
select * from public.start_analysis((select id from ws where name = 'a'), (select id from rs where name = 'r1'), 'm',
  array['themes']::public.analysis_kind[], current_date, 2, '{}');
select lives_ok(
  $$select public.finish_analysis((select analysis_id from fourth), jsonb_build_array(jsonb_build_object(
    'title', 'Banca', 'summary', 'Sintesi', 'kind', 'problem', 'sentiment', 'negative',
    'feedback', jsonb_build_array('40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002'),
    'quotes', '[]'::jsonb)), '{}')$$,
  'a second themes analysis finishes'
);
select results_eq(
  $$select t.priority::text, t.status::text from public.themes t where t.analysis_id = (select analysis_id from fourth)$$,
  $$values ('high', 'roadmap')$$,
  'the previous themes analysis is the last done themes one, not a verdict'
);

-- ===== The themes of a Research carry it =====

reset role;
select throws_ok(
  $$insert into public.themes (workspace_id, analysis_id, kind, title, summary, sentiment)
    values ((select id from ws where name = 'a'), (select analysis_id from fourth), 'problem', 'Senza', 'S', 'negative')$$,
  '23502', null, 'a theme without research_id violates not null'
);
select throws_ok(
  $$insert into public.themes (workspace_id, research_id, analysis_id, kind, title, summary, sentiment)
    values ((select id from ws where name = 'a'), (select id from rs where name = 'rb'), (select analysis_id from fourth),
      'problem', 'Altrui', 'S', 'negative')$$,
  '23503', null, 'a theme with A''s workspace and B''s Research is refused'
);

select * from finish();
rollback;
