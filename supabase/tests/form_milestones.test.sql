-- claim_form_milestones: one call per public form response claims the milestones it makes due, each once.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', 'form-milestones@test.voce', '{"workspace_name": "M"}');

create temporary table ws on commit drop as
select m.workspace_id as id from public.workspace_members m where m.user_id = '00000000-0000-0000-0000-0000000000e1';

insert into public.research (id, workspace_id, question, form_slug) values
  ('e0000000-0000-0000-0000-000000000001', (select id from ws), 'Domanda?', 'traguardi-modulo');
insert into public.feedback (workspace_id, research_id, text, channel) values
  ((select id from ws), 'e0000000-0000-0000-0000-000000000001', 'Uno.', 'Modulo pubblico');

select ok(
  not has_function_privilege('anon', 'public.claim_form_milestones(text)', 'execute')
    and not has_function_privilege('authenticated', 'public.claim_form_milestones(text)', 'execute'),
  'only the server can claim milestones'
);

select results_eq(
  $$select workspace_id, event from public.claim_form_milestones('traguardi-modulo')$$,
  $$values ((select id from ws), 'first_feedback_added')$$,
  'the first response claims first_feedback_added'
);
select is_empty(
  $$select * from public.claim_form_milestones('traguardi-modulo')$$,
  'the next one claims nothing'
);

insert into public.feedback (workspace_id, research_id, text, channel)
select (select id from ws), 'e0000000-0000-0000-0000-000000000001', 'Altro ' || g, 'Modulo pubblico'
from generate_series(2, 5) g;

select results_eq(
  $$select workspace_id, event from public.claim_form_milestones('traguardi-modulo')$$,
  $$values ((select id from ws), 'first_research_collected')$$,
  'the 5th feedback of the Research claims first_research_collected'
);
select is_empty(
  $$select * from public.claim_form_milestones('traguardi-modulo')$$,
  'then nothing more'
);
select is_empty(
  $$select * from public.claim_form_milestones('non-esiste')$$,
  'an unknown link claims nothing'
);

select * from finish();
rollback;
