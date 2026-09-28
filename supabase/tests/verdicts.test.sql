-- finish_verdict: only for the server, saves the checked verdicts of a verdict row, checks every quote again
-- against the saved text, skips feedback deleted meanwhile, and saves a confirmed or refuted left without
-- quotes of its side as to_review.
begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a6', 'verdicts-a@test.voce', '{"workspace_name": "A"}');

create temporary table ws on commit drop as
select m.workspace_id as id from public.workspace_members m where m.user_id = '00000000-0000-0000-0000-0000000000a6';

grant select on ws to service_role;

-- Two Research of A: r1 with four feedback and three hypotheses, r2 with one hypothesis.
insert into public.research (id, workspace_id, question, form_slug) values
  ('90000000-0000-0000-0000-000000000001', (select id from ws), 'Domanda uno?', 'verdetti-uno'),
  ('90000000-0000-0000-0000-000000000002', (select id from ws), 'Domanda due?', 'verdetti-due');
insert into public.feedback (id, workspace_id, research_id, text, channel) values
  ('91000000-0000-0000-0000-000000000001', (select id from ws), '90000000-0000-0000-0000-000000000001',
    'Il prezzo per utente pesa sui team piccoli.', 'Supporto'),
  ('91000000-0000-0000-0000-000000000002', (select id from ws), '90000000-0000-0000-0000-000000000001',
    'Siamo in tre e Pro costa troppo per noi.', 'Supporto'),
  ('91000000-0000-0000-0000-000000000003', (select id from ws), '90000000-0000-0000-0000-000000000001',
    'Il prezzo va benissimo, lo paghiamo volentieri.', 'Intervista'),
  ('91000000-0000-0000-0000-000000000004', (select id from ws), '90000000-0000-0000-0000-000000000001',
    'Esportare in PDF sarebbe utile.', 'Modulo pubblico');
insert into public.research_hypotheses (id, workspace_id, research_id, text) values
  ('92000000-0000-0000-0000-000000000001', (select id from ws), '90000000-0000-0000-0000-000000000001', 'Il prezzo frena i team piccoli'),
  ('92000000-0000-0000-0000-000000000002', (select id from ws), '90000000-0000-0000-0000-000000000001', 'Nessuno vuole il PDF'),
  ('92000000-0000-0000-0000-000000000003', (select id from ws), '90000000-0000-0000-0000-000000000001', 'I clienti vogliono WhatsApp'),
  ('92000000-0000-0000-0000-000000000004', (select id from ws), '90000000-0000-0000-0000-000000000002', 'Di un''altra Research');

-- Verdict rows as start_analysis leaves them: running, with their run log. One themes row too.
insert into public.analyses (id, workspace_id, research_id, kind, period_start, feedback_count, status)
select ('93000000-0000-0000-0000-00000000000' || n)::uuid, (select id from ws), '90000000-0000-0000-0000-000000000001',
  (case when n = 9 then 'themes' else 'verdict' end)::public.analysis_kind, current_date, 4, 'running'
from generate_series(1, 9) n;
insert into public.analysis_runs (analysis_id, workspace_id, model, input)
select id, workspace_id, 'm', '{}' from public.analyses where workspace_id = (select id from ws);

-- ===== AC 10 (rest): finish_verdict runs only as service_role =====

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a6", "role": "authenticated"}';
select throws_ok($$select public.finish_verdict('93000000-0000-0000-0000-000000000001', '[]', '{}')$$, '42501', null,
  'authenticated cannot call finish_verdict');
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok($$select public.finish_verdict('93000000-0000-0000-0000-000000000001', '[]', '{}')$$, '42501', null,
  'anon cannot call finish_verdict');
reset role;

set local role service_role;

-- ===== Saving a verdict =====

select is(
  (select quotes_saved from public.finish_verdict('93000000-0000-0000-0000-000000000001', $$[
    {"hypothesis_id": "92000000-0000-0000-0000-000000000001", "text": "Il prezzo frena i team piccoli", "verdict": "confirmed", "reasoning": "I team piccoli lo dicono.",
     "feedback_read": 4, "arrived_after": 1,
     "links": [{"feedback_id": "91000000-0000-0000-0000-000000000001", "stance": "for"},
               {"feedback_id": "91000000-0000-0000-0000-000000000002", "stance": "for"},
               {"feedback_id": "91000000-0000-0000-0000-000000000003", "stance": "against"}],
     "quotes": [{"feedback_id": "91000000-0000-0000-0000-000000000002", "stance": "for", "text": "Pro costa troppo"},
                {"feedback_id": "91000000-0000-0000-0000-000000000001", "stance": "for", "text": "pesa sui team piccoli"},
                {"feedback_id": "91000000-0000-0000-0000-000000000003", "stance": "against", "text": "va benissimo"}]},
    {"hypothesis_id": "92000000-0000-0000-0000-000000000003", "text": "I clienti vogliono WhatsApp", "verdict": "to_review", "reasoning": "Nessuno ne parla.",
     "feedback_read": 4, "arrived_after": 0, "links": [], "quotes": []}
  ]$$::jsonb, '{"output": {"hypotheses": []}, "issues": [], "input_tokens": 100, "output_tokens": 20, "duration_ms": 5, "cost_usd": 0.1}')),
  3,
  'finish_verdict returns the number of verified quotes it saved'
);
select results_eq(
  $$select hypothesis_id::text, workspace_id = (select id from ws), research_id::text, analysis_id::text, verdict::text,
      reasoning, feedback_read, arrived_after
    from public.hypothesis_verdicts where workspace_id = (select id from ws) order by hypothesis_id$$,
  $$values
    ('92000000-0000-0000-0000-000000000001', true, '90000000-0000-0000-0000-000000000001', '93000000-0000-0000-0000-000000000001',
      'confirmed', 'I team piccoli lo dicono.', 4, 1),
    ('92000000-0000-0000-0000-000000000003', true, '90000000-0000-0000-0000-000000000001', '93000000-0000-0000-0000-000000000001',
      'to_review', 'Nessuno ne parla.', 4, 0)$$,
  'one verdict per hypothesis, with its analysis, counts and reasoning'
);
select results_eq(
  $$select feedback_id::text, stance::text, quote_rank::integer, highlight from public.verdict_feedback
    where hypothesis_id = '92000000-0000-0000-0000-000000000001' order by stance desc, quote_rank nulls last, feedback_id$$,
  $$values
    ('91000000-0000-0000-0000-000000000002', 'for', 1, 'Pro costa troppo'),
    ('91000000-0000-0000-0000-000000000001', 'for', 2, 'pesa sui team piccoli'),
    ('91000000-0000-0000-0000-000000000003', 'against', 1, 'va benissimo')$$,
  'links carry their side, and quotes their rank per side and the highlight'
);
select results_eq(
  $$select a.status::text, r.input_tokens, r.output_tokens, r.cost_usd, r.output, r.finished_at is not null
    from public.analyses a join public.analysis_runs r on r.analysis_id = a.id
    where a.id = '93000000-0000-0000-0000-000000000001'$$,
  $$values ('done', 100, 20, 0.1::numeric, '{"hypotheses": []}'::jsonb, true)$$,
  'the verdict row is done and its run log closed'
);

-- A later verdict replaces the previous one of the same hypothesis, with its links.
select is(
  (select quotes_saved from public.finish_verdict('93000000-0000-0000-0000-000000000002', $$[
    {"hypothesis_id": "92000000-0000-0000-0000-000000000001", "text": "Il prezzo frena i team piccoli", "verdict": "refuted", "reasoning": "Il prezzo piace.",
     "feedback_read": 4, "arrived_after": 0,
     "links": [{"feedback_id": "91000000-0000-0000-0000-000000000003", "stance": "against"}],
     "quotes": [{"feedback_id": "91000000-0000-0000-0000-000000000003", "stance": "against", "text": "lo paghiamo volentieri"}]}
  ]$$::jsonb, '{}')),
  1,
  'a second verdict saves its quote'
);
select results_eq(
  $$select v.verdict::text, v.analysis_id::text, (select count(*)::integer from public.verdict_feedback f where f.hypothesis_id = v.hypothesis_id)
    from public.hypothesis_verdicts v where v.hypothesis_id = '92000000-0000-0000-0000-000000000001'$$,
  $$values ('refuted', '93000000-0000-0000-0000-000000000002', 1)$$,
  'a later verdict replaces the previous one and its links'
);
select is((select verdict::text from public.hypothesis_verdicts where hypothesis_id = '92000000-0000-0000-0000-000000000003'),
  'to_review', 'a hypothesis the later verdict does not name keeps its verdict');

-- ===== AC 41: quotes checked again, deleted feedback, to_review without quotes of its side =====

select throws_ok(
  $$select public.finish_verdict('93000000-0000-0000-0000-000000000003', '[
    {"hypothesis_id": "92000000-0000-0000-0000-000000000002", "text": "Nessuno vuole il PDF", "verdict": "refuted", "reasoning": "x", "feedback_read": 4, "arrived_after": 0,
     "links": [{"feedback_id": "91000000-0000-0000-0000-000000000004", "stance": "against"}],
     "quotes": [{"feedback_id": "91000000-0000-0000-0000-000000000004", "stance": "against", "text": "Esportare in Excel"}]}
  ]'::jsonb, '{}')$$,
  '22023', 'quote_not_in_feedback', 'a quote not in the saved text raises quote_not_in_feedback'
);
select throws_ok(
  $$select public.finish_verdict('93000000-0000-0000-0000-000000000003', '[
    {"hypothesis_id": "92000000-0000-0000-0000-000000000002", "text": "Nessuno vuole il PDF", "verdict": "refuted", "reasoning": "x", "feedback_read": 4, "arrived_after": 0,
     "links": [{"feedback_id": "91000000-0000-0000-0000-000000000004", "stance": "against"}],
     "quotes": [{"feedback_id": "91000000-0000-0000-0000-000000000004", "stance": "against", "text": ""}]}
  ]'::jsonb, '{}')$$,
  '22023', 'quote_not_in_feedback', 'an empty quote raises quote_not_in_feedback'
);
select is((select status::text from public.analyses where id = '93000000-0000-0000-0000-000000000003'), 'running',
  'a refused verdict saves nothing and leaves the row running');

-- A feedback deleted while the verdict ran: its link and quote go, the rest stays.
reset role;
delete from public.feedback where id = '91000000-0000-0000-0000-000000000002';
set local role service_role;
select is(
  (select quotes_saved from public.finish_verdict('93000000-0000-0000-0000-000000000003', $$[
    {"hypothesis_id": "92000000-0000-0000-0000-000000000001", "text": "Il prezzo frena i team piccoli", "verdict": "confirmed", "reasoning": "Lo dicono.",
     "feedback_read": 4, "arrived_after": 0,
     "links": [{"feedback_id": "91000000-0000-0000-0000-000000000002", "stance": "for"},
               {"feedback_id": "91000000-0000-0000-0000-000000000001", "stance": "for"}],
     "quotes": [{"feedback_id": "91000000-0000-0000-0000-000000000002", "stance": "for", "text": "Pro costa troppo"},
                {"feedback_id": "91000000-0000-0000-0000-000000000001", "stance": "for", "text": "pesa sui team piccoli"}]},
    {"hypothesis_id": "92000000-0000-0000-0000-000000000002", "text": "Nessuno vuole il PDF", "verdict": "refuted", "reasoning": "Il PDF lo chiedono.",
     "feedback_read": 4, "arrived_after": 0,
     "links": [{"feedback_id": "91000000-0000-0000-0000-000000000002", "stance": "against"},
               {"feedback_id": "91000000-0000-0000-0000-000000000004", "stance": "for"}],
     "quotes": [{"feedback_id": "91000000-0000-0000-0000-000000000002", "stance": "against", "text": "Siamo in tre"}]}
  ]$$::jsonb, '{}')),
  1,
  'quotes of a deleted feedback are not saved nor counted'
);
select results_eq(
  $$select feedback_id::text, stance::text, quote_rank::integer, highlight from public.verdict_feedback
    where hypothesis_id = '92000000-0000-0000-0000-000000000001'$$,
  $$values ('91000000-0000-0000-0000-000000000001', 'for', 1, 'pesa sui team piccoli')$$,
  'links and quotes of deleted feedback are dropped, and the ranks close the gap'
);
select is((select verdict::text from public.hypothesis_verdicts where hypothesis_id = '92000000-0000-0000-0000-000000000001'),
  'confirmed', 'a confirmed that keeps a quote of its side stays confirmed');
select is((select verdict::text from public.hypothesis_verdicts where hypothesis_id = '92000000-0000-0000-0000-000000000002'),
  'to_review', 'a refused left without quotes of its side is saved to_review');

-- The rule holds whatever the server sent: a confirmed with only quotes against is saved to_review.
select is(
  (select quotes_saved from public.finish_verdict('93000000-0000-0000-0000-000000000004', $$[
    {"hypothesis_id": "92000000-0000-0000-0000-000000000003", "text": "I clienti vogliono WhatsApp", "verdict": "confirmed", "reasoning": "x", "feedback_read": 3, "arrived_after": 0,
     "links": [{"feedback_id": "91000000-0000-0000-0000-000000000003", "stance": "against"}],
     "quotes": [{"feedback_id": "91000000-0000-0000-0000-000000000003", "stance": "against", "text": "Il prezzo"}]}
  ]$$::jsonb, '{}')),
  1,
  'a confirmed with a quote against saves the quote'
);
select is((select verdict::text from public.hypothesis_verdicts where hypothesis_id = '92000000-0000-0000-0000-000000000003'),
  'to_review', 'a confirmed left without quotes for is saved to_review');

-- ===== Only the verdict rows running, only the hypotheses of the Research =====

select is(
  (select quotes_saved from public.finish_verdict('93000000-0000-0000-0000-000000000005', $$[
    {"hypothesis_id": "92000000-0000-0000-0000-000000000004", "text": "Di un'altra Research", "verdict": "to_review", "reasoning": "x", "feedback_read": 3, "arrived_after": 0,
     "links": [], "quotes": []}
  ]$$::jsonb, '{}')),
  0,
  'a hypothesis of another Research is skipped'
);
select is((select count(*)::integer from public.hypothesis_verdicts where hypothesis_id = '92000000-0000-0000-0000-000000000004'), 0,
  'no verdict is saved on a hypothesis of another Research');
select throws_ok($$select public.finish_verdict('93000000-0000-0000-0000-000000000009', '[]', '{}')$$, '22023', 'analysis_not_running',
  'finish_verdict refuses a themes row');
select throws_ok($$select public.finish_verdict('93000000-0000-0000-0000-000000000001', '[]', '{}')$$, '22023', 'analysis_not_running',
  'finish_verdict refuses a row already done');

-- ===== The hypotheses as they were sent, and a Research deleted meanwhile =====

select results_eq(
  $$select * from public.finish_verdict('93000000-0000-0000-0000-000000000006', '[
    {"hypothesis_id": "92000000-0000-0000-0000-000000000003", "text": "Un testo di prima", "verdict": "refuted", "reasoning": "x",
     "feedback_read": 3, "arrived_after": 0, "links": [], "quotes": []},
    {"hypothesis_id": "92000000-0000-0000-0000-000000000001", "text": "Il prezzo frena i team piccoli", "verdict": "to_review",
     "reasoning": "x", "feedback_read": 3, "arrived_after": 0, "links": [], "quotes": []}
  ]'::jsonb, '{}')$$,
  $$values (0, 1)$$,
  'finish_verdict returns the quotes and the verdicts it saved'
);
select is((select analysis_id::text from public.hypothesis_verdicts where hypothesis_id = '92000000-0000-0000-0000-000000000003'),
  '93000000-0000-0000-0000-000000000004', 'a hypothesis whose text changed after the call keeps its verdict');

reset role;
update public.analyses set research_id = null where id = '93000000-0000-0000-0000-000000000007';
set local role service_role;
select throws_ok(
  $$select public.finish_verdict('93000000-0000-0000-0000-000000000007', '[]', '{}')$$,
  '22023', 'research_deleted', 'finish_verdict on a deleted Research fails with research_deleted'
);
select is((select status::text from public.analyses where id = '93000000-0000-0000-0000-000000000007'), 'running',
  'and saves nothing: the server then fails the row');
reset role;

select * from finish();
rollback;
