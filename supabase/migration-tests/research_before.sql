-- The state before 20261001090000_research.sql: loaded on a database reset to 20260927120000, then the
-- research migration runs on it (see run.sh). Two workspaces as production has them: the form lives on
-- the workspace row.
--   PHC: /f/phc26, enabled, default form question; 3 feedback, 1 analysis with 2 themes, 1 question.
--   Orto: its own form question "Come va?", disabled form, 1 feedback.
--   Cinque and Quattro: 5 and 4 feedback, for the first_research_collected milestone.

-- One DO block: `supabase db query` runs a single statement.
do $fixture$
begin
  insert into auth.users (id, email, raw_user_meta_data) values
    ('00000000-0000-0000-0000-0000000000f1', 'before-phc@test.voce', '{"workspace_name": "PHC"}'),
    ('00000000-0000-0000-0000-0000000000f2', 'before-orto@test.voce', '{"workspace_name": "Orto"}'),
    ('00000000-0000-0000-0000-0000000000f5', 'before-cinque@test.voce', '{"workspace_name": "Cinque"}'),
    ('00000000-0000-0000-0000-0000000000f4', 'before-quattro@test.voce', '{"workspace_name": "Quattro"}');

  update public.workspaces w set form_slug = 'phc26', form_enabled = true, form_question = null
  from public.workspace_members m
  where m.workspace_id = w.id and m.user_id = '00000000-0000-0000-0000-0000000000f1';

  update public.workspaces w set form_slug = 'orto-p2x8', form_enabled = false, form_question = 'Come va?'
  from public.workspace_members m
  where m.workspace_id = w.id and m.user_id = '00000000-0000-0000-0000-0000000000f2';

  insert into public.feedback (id, workspace_id, text, channel)
  select v.id::uuid, m.workspace_id, v.text, v.channel
  from public.workspace_members m, (values
    ('f0000000-0000-0000-0000-000000000001', 'Il report in PDF mi serve ogni mese.', 'Modulo pubblico'),
    ('f0000000-0000-0000-0000-000000000002', 'La banca si scollega ogni lunedì.', 'Modulo pubblico'),
    ('f0000000-0000-0000-0000-000000000003', 'Mi piace la sala.', 'Supporto')
  ) as v (id, text, channel)
  where m.user_id = '00000000-0000-0000-0000-0000000000f1';

  insert into public.feedback (id, workspace_id, text, channel)
  select 'f0000000-0000-0000-0000-000000000004', m.workspace_id, 'Troppi clic per un ordine.', 'Supporto'
  from public.workspace_members m where m.user_id = '00000000-0000-0000-0000-0000000000f2';

  insert into public.feedback (workspace_id, text, channel)
  select m.workspace_id, 'Feedback ' || n, 'Supporto'
  from public.workspace_members m, generate_series(1, 5) n
  where m.user_id = '00000000-0000-0000-0000-0000000000f5';

  insert into public.feedback (workspace_id, text, channel)
  select m.workspace_id, 'Feedback ' || n, 'Supporto'
  from public.workspace_members m, generate_series(1, 4) n
  where m.user_id = '00000000-0000-0000-0000-0000000000f4';

  insert into public.analyses (id, workspace_id, period_start, feedback_count, status)
  select 'a0000000-0000-0000-0000-000000000001', m.workspace_id, current_date - 89, 3, 'done'
  from public.workspace_members m where m.user_id = '00000000-0000-0000-0000-0000000000f1';

  insert into public.themes (id, workspace_id, analysis_id, kind, title, summary, sentiment)
  select v.id::uuid, m.workspace_id, 'a0000000-0000-0000-0000-000000000001', v.kind::public.theme_kind, v.title, 'Sintesi',
    v.sentiment::public.theme_sentiment
  from public.workspace_members m, (values
    ('70000000-0000-0000-0000-000000000001', 'opportunity', 'Report in PDF', 'neutral'),
    ('70000000-0000-0000-0000-000000000002', 'problem', 'Banca scollegata', 'negative')
  ) as v (id, kind, title, sentiment)
  where m.user_id = '00000000-0000-0000-0000-0000000000f1';

  insert into public.questions (id, workspace_id, status, outcome, feedback_considered, feedback_count, citation_count)
  select 'c0000000-0000-0000-0000-000000000001', m.workspace_id, 'done', 'answered', 3, 1, 1
  from public.workspace_members m where m.user_id = '00000000-0000-0000-0000-0000000000f1';
end
$fixture$;
