-- Hypotheses of a Research and their verdicts: access rules, the maximum of 5, position and written_at,
-- and a changed text that removes the verdict.
begin;
create extension if not exists pgtap with schema extensions;
select plan(34);

-- ===== AC 1 (rest): RLS on in the migration that creates the tables =====

select ok((select relrowsecurity from pg_class where oid = 'public.research_hypotheses'::regclass),
  'RLS is enabled on research_hypotheses');
select ok((select relrowsecurity from pg_class where oid = 'public.hypothesis_verdicts'::regclass),
  'RLS is enabled on hypothesis_verdicts');
select ok((select relrowsecurity from pg_class where oid = 'public.verdict_feedback'::regclass),
  'RLS is enabled on verdict_feedback');

-- Two users: the signup trigger gives each one a workspace.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a5', 'hypotheses-a@test.voce', '{"workspace_name": "A"}'),
  ('00000000-0000-0000-0000-0000000000b5', 'hypotheses-b@test.voce', '{"workspace_name": "B"}');

create temporary table ws on commit drop as
select case m.user_id when '00000000-0000-0000-0000-0000000000a5' then 'a' else 'b' end as name, m.workspace_id as id
from public.workspace_members m
where m.user_id in ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000b5');

-- One Research each (ra, rb), with a feedback and an analysis the verdicts can point to.
create temporary table rs on commit drop as
select v.name, v.id::uuid, (select id from ws where ws.name = v.ws) as workspace_id
from (values
  ('ra', 'a', '50000000-0000-0000-0000-000000000001'),
  ('rb', 'b', '50000000-0000-0000-0000-000000000002')
) as v (name, ws, id);
insert into public.research (id, workspace_id, question, form_slug)
select id, workspace_id, 'Domanda ' || name || '?', 'ipotesi-' || name from rs;
insert into public.feedback (id, workspace_id, research_id, text, channel)
select ('60000000-0000-0000-0000-00000000000' || n)::uuid, r.workspace_id, r.id, 'Il prezzo per utente pesa ' || n, 'Supporto'
from rs r join (values ('ra', 1), ('rb', 2)) as f (name, n) on f.name = r.name;
insert into public.analyses (id, workspace_id, research_id, kind, period_start, feedback_count, status)
select ('70000000-0000-0000-0000-00000000000' || n)::uuid, r.workspace_id, r.id, 'verdict', current_date, 1, 'done'
from rs r join (values ('ra', 1), ('rb', 2)) as a (name, n) on a.name = r.name;

-- B's hypothesis with its verdict and link, written by the database as finish_verdict will.
insert into public.research_hypotheses (id, workspace_id, research_id, text)
select '80000000-0000-0000-0000-000000000002', workspace_id, id, 'Ipotesi di B' from rs where name = 'rb';
insert into public.hypothesis_verdicts (hypothesis_id, workspace_id, research_id, analysis_id, verdict, reasoning,
  feedback_read, arrived_after)
select '80000000-0000-0000-0000-000000000002', workspace_id, id, '70000000-0000-0000-0000-000000000002', 'confirmed',
  'Lo dicono.', 1, 0
from rs where name = 'rb';
insert into public.verdict_feedback (hypothesis_id, feedback_id, workspace_id, stance, quote_rank, highlight)
select '80000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', workspace_id, 'for', 1, 'prezzo'
from rs where name = 'rb';

grant select on ws, rs to authenticated, anon;

-- ===== AC 18, 19 (database part): position, written_at, at most 5 =====

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a5", "role": "authenticated"}';

insert into public.research_hypotheses (workspace_id, research_id, text)
select workspace_id, id, 'Ipotesi ' || n from rs, generate_series(1, 3) n where name = 'ra';

select results_eq(
  $$select text, position::integer, written_at = now() from public.research_hypotheses
    where research_id = (select id from rs where name = 'ra') order by position$$,
  $$values ('Ipotesi 1', 1, true), ('Ipotesi 2', 2, true), ('Ipotesi 3', 3, true)$$,
  'written_at is the insert time and position is the maximum plus 1'
);

delete from public.research_hypotheses where research_id = (select id from rs where name = 'ra') and position = 2;
insert into public.research_hypotheses (workspace_id, research_id, text)
select workspace_id, id, 'Ipotesi 4' from rs where name = 'ra';
select is(
  (select position::integer from public.research_hypotheses where text = 'Ipotesi 4'),
  4,
  'after a delete, a new hypothesis still goes after the last one'
);

select throws_ok(
  $$insert into public.research_hypotheses (workspace_id, research_id, position)
    select workspace_id, id, 1 from rs where name = 'ra'$$,
  '42501', null, 'the position is not the user''s to choose'
);
select throws_ok(
  $$insert into public.research_hypotheses (workspace_id, research_id, text) select workspace_id, id, '   ' from rs where name = 'ra'$$,
  '23514', null, 'a blank hypothesis violates the check'
);
select throws_ok(
  $$insert into public.research_hypotheses (workspace_id, research_id, text)
    select workspace_id, id, repeat('i', 201) from rs where name = 'ra'$$,
  '23514', null, 'a hypothesis over 200 characters violates the check'
);

insert into public.research_hypotheses (workspace_id, research_id, text)
select workspace_id, id, 'Ipotesi ' || n from rs, generate_series(5, 6) n where name = 'ra';
select is(
  (select count(*)::integer from public.research_hypotheses where research_id = (select id from rs where name = 'ra')),
  5, 'a Research holds 5 hypotheses'
);
select throws_ok(
  $$insert into public.research_hypotheses (workspace_id, research_id, text)
    select workspace_id, id, 'La sesta' from rs where name = 'ra'$$,
  'P0001', 'max_hypotheses', 'the trigger refuses a sixth hypothesis with max_hypotheses'
);

-- ===== AC 8 (rest): A reads nothing of B =====

select is((select count(*)::integer from public.research_hypotheses where workspace_id <> (select id from ws where name = 'a')),
  0, 'A reads no research_hypotheses of B, unfiltered');
select is((select count(*)::integer from public.research_hypotheses where id = '80000000-0000-0000-0000-000000000002'),
  0, 'A reads no research_hypotheses of B, by id');
select is((select count(*)::integer from public.hypothesis_verdicts), 0, 'A reads no hypothesis_verdicts of B, unfiltered');
select is((select count(*)::integer from public.hypothesis_verdicts where hypothesis_id = '80000000-0000-0000-0000-000000000002'),
  0, 'A reads no hypothesis_verdicts of B, by id');
select is((select count(*)::integer from public.verdict_feedback), 0, 'A reads no verdict_feedback of B, unfiltered');
select is((select count(*)::integer from public.verdict_feedback where hypothesis_id = '80000000-0000-0000-0000-000000000002'),
  0, 'A reads no verdict_feedback of B, by id');

-- ===== AC 9 (rest): A cannot change B's hypotheses =====

select is_empty(
  $$update public.research_hypotheses set text = 'Presa' where id = '80000000-0000-0000-0000-000000000002' returning id$$,
  'A cannot update a hypothesis of B'
);
select is_empty(
  $$delete from public.research_hypotheses where id = '80000000-0000-0000-0000-000000000002' returning id$$,
  'A cannot delete a hypothesis of B'
);
select throws_ok(
  $$insert into public.research_hypotheses (workspace_id, research_id, text)
    select (select id from ws where name = 'a'), (select id from rs where name = 'rb'), 'Intrusa'$$,
  '23503', null, 'a hypothesis with A''s workspace and B''s research is refused'
);
select throws_ok(
  $$insert into public.research_hypotheses (workspace_id, research_id, text)
    select workspace_id, id, 'Intrusa' from rs where name = 'rb'$$,
  '42501', null, 'a hypothesis in B''s workspace is refused'
);

-- ===== AC 10 (part): nobody but the database writes verdicts and links =====

select throws_ok(
  $$insert into public.hypothesis_verdicts (hypothesis_id, workspace_id, research_id, analysis_id, verdict, reasoning,
      feedback_read, arrived_after)
    select h.id, h.workspace_id, h.research_id, '70000000-0000-0000-0000-000000000001', 'confirmed', 'x', 1, 0
    from public.research_hypotheses h where h.text = 'Ipotesi 1'$$,
  '42501', null, 'authenticated cannot insert hypothesis_verdicts'
);
select throws_ok($$update public.hypothesis_verdicts set verdict = 'refuted'$$, '42501', null,
  'authenticated cannot update hypothesis_verdicts');
select throws_ok($$delete from public.hypothesis_verdicts$$, '42501', null,
  'authenticated cannot delete hypothesis_verdicts');
select throws_ok(
  $$insert into public.verdict_feedback (hypothesis_id, feedback_id, workspace_id, stance)
    select h.id, '60000000-0000-0000-0000-000000000001', h.workspace_id, 'for'
    from public.research_hypotheses h where h.text = 'Ipotesi 1'$$,
  '42501', null, 'authenticated cannot insert verdict_feedback'
);
select throws_ok($$update public.verdict_feedback set stance = 'against'$$, '42501', null,
  'authenticated cannot update verdict_feedback');
select throws_ok($$delete from public.verdict_feedback$$, '42501', null,
  'authenticated cannot delete verdict_feedback');
reset role;

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok($$select count(*) from public.research_hypotheses$$, '42501', null, 'anon cannot read research_hypotheses');
select throws_ok($$select count(*) from public.hypothesis_verdicts$$, '42501', null, 'anon cannot read hypothesis_verdicts');
select throws_ok($$select count(*) from public.verdict_feedback$$, '42501', null, 'anon cannot read verdict_feedback');
select throws_ok(
  $$insert into public.hypothesis_verdicts (hypothesis_id, workspace_id, research_id, analysis_id, verdict, reasoning,
      feedback_read, arrived_after)
    values ('80000000-0000-0000-0000-000000000002', gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'confirmed', 'x', 1, 0)$$,
  '42501', null, 'anon cannot insert hypothesis_verdicts'
);
select throws_ok(
  $$insert into public.verdict_feedback (hypothesis_id, feedback_id, workspace_id, stance)
    values ('80000000-0000-0000-0000-000000000002', gen_random_uuid(), gen_random_uuid(), 'for')$$,
  '42501', null, 'anon cannot insert verdict_feedback'
);
reset role;

-- ===== AC 20: a new text removes the verdict and moves written_at; the same text changes nothing =====

-- B's hypothesis, written long ago.
update public.research_hypotheses set written_at = '2026-01-01' where id = '80000000-0000-0000-0000-000000000002';

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000b5", "role": "authenticated"}';
update public.research_hypotheses set text = 'Ipotesi di B' where id = '80000000-0000-0000-0000-000000000002';
select results_eq(
  $$select h.written_at = '2026-01-01'::timestamptz, (select count(*)::integer from public.hypothesis_verdicts v
      where v.hypothesis_id = h.id), (select count(*)::integer from public.verdict_feedback f where f.hypothesis_id = h.id)
    from public.research_hypotheses h where h.id = '80000000-0000-0000-0000-000000000002'$$,
  $$values (true, 1, 1)$$,
  'the same text changes nothing'
);

update public.research_hypotheses set text = 'Ipotesi di B, riscritta' where id = '80000000-0000-0000-0000-000000000002';
select results_eq(
  $$select h.written_at = now(), (select count(*)::integer from public.hypothesis_verdicts v where v.hypothesis_id = h.id)
    from public.research_hypotheses h where h.id = '80000000-0000-0000-0000-000000000002'$$,
  $$values (true, 0)$$,
  'a new text deletes the verdict and moves written_at'
);
reset role;
select is(
  (select count(*)::integer from public.verdict_feedback where hypothesis_id = '80000000-0000-0000-0000-000000000002'),
  0, 'a new text deletes the links of the verdict too'
);

select * from finish();
rollback;
