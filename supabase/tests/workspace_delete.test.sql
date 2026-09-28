-- Deleting a workspace (the operator's path for an account that leaves) takes everything with it,
-- verdicts included: they reference both their Research and the analysis that wrote them.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', 'workspace-delete@test.voce', '{"workspace_name": "D"}');

create temporary table ws on commit drop as
select m.workspace_id as id from public.workspace_members m where m.user_id = '00000000-0000-0000-0000-0000000000d1';

insert into public.research (id, workspace_id, question, form_slug) values
  ('d0000000-0000-0000-0000-000000000001', (select id from ws), 'Domanda?', 'elimina-workspace');
insert into public.research_hypotheses (id, workspace_id, research_id, text) values
  ('d1000000-0000-0000-0000-000000000001', (select id from ws), 'd0000000-0000-0000-0000-000000000001', 'Un''ipotesi');
insert into public.analyses (id, workspace_id, research_id, kind, period_start, feedback_count, status) values
  ('d2000000-0000-0000-0000-000000000001', (select id from ws), 'd0000000-0000-0000-0000-000000000001', 'verdict', current_date, 1, 'done');
insert into public.hypothesis_verdicts (hypothesis_id, workspace_id, research_id, analysis_id, verdict, reasoning, feedback_read, arrived_after) values
  ('d1000000-0000-0000-0000-000000000001', (select id from ws), 'd0000000-0000-0000-0000-000000000001',
   'd2000000-0000-0000-0000-000000000001', 'to_review', 'Pochi feedback.', 1, 0);

select lives_ok(
  $$delete from public.workspaces where id = (select id from ws)$$,
  'a workspace with a hypothesis verdict can be deleted'
);
select is((select count(*) from public.hypothesis_verdicts where workspace_id = (select id from ws))::int, 0,
  'its verdicts go with it');

select * from finish();
rollback;
