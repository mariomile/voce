-- The data of research_before.sql after 20261001090000_research.sql: one initial Research per
-- workspace, carrying the form and the feedback, so /f/phc26 keeps working.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

create temporary table ws on commit drop as
select case m.user_id
    when '00000000-0000-0000-0000-0000000000f1' then 'phc'
    when '00000000-0000-0000-0000-0000000000f2' then 'orto'
    when '00000000-0000-0000-0000-0000000000f5' then 'cinque'
    else 'quattro'
  end as name,
  m.workspace_id as id
from public.workspace_members m
where m.user_id in ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2',
                    '00000000-0000-0000-0000-0000000000f5', '00000000-0000-0000-0000-0000000000f4');

-- ===== AC 3 (part) =====

select results_eq(
  $$select count(*)::integer, min(r.form_slug), bool_and(r.form_enabled), bool_and(r.form_question is null)
    from public.research r where r.workspace_id = (select id from ws where name = 'phc')$$,
  $$values (1, 'phc26', true, true)$$,
  'one initial Research per workspace with slug phc26, enabled and null form question'
);
select results_eq(
  $$select r.question from public.research r where r.workspace_id = (select id from ws where name = 'phc')$$,
  $$values ('Cosa dicono i clienti di PHC?')$$,
  'the default question names the workspace'
);
select results_eq(
  $$select count(*)::integer from public.feedback f
    join public.research r on r.id = f.research_id and r.workspace_id = f.workspace_id
    where f.workspace_id = (select id from ws where name = 'phc')$$,
  $$values (3)$$,
  'the 3 feedback carry its research_id'
);
select ok(
  (select r.created_at = w.created_at from public.research r join public.workspaces w on w.id = r.workspace_id
   where w.id = (select id from ws where name = 'phc')),
  'the initial Research is as old as its workspace'
);

select results_eq(
  $$select a.kind::text, a.research_id = r.id, (select count(*)::integer from public.themes t
      where t.analysis_id = a.id and t.research_id = r.id)
    from public.analyses a join public.research r on r.workspace_id = a.workspace_id
    where a.workspace_id = (select id from ws where name = 'phc')$$,
  $$values ('themes', true, 2)$$,
  'the analysis and its 2 themes carry its research_id, and the analysis is a themes one'
);
select results_eq(
  $$select q.research_id = r.id from public.questions q join public.research r on r.workspace_id = q.workspace_id
    where q.workspace_id = (select id from ws where name = 'phc')$$,
  $$values (true)$$,
  'the question carries its research_id'
);

-- ===== AC 4 =====

select results_eq(
  $$select r.question, r.form_question, r.form_slug, r.form_enabled from public.research r
    where r.workspace_id = (select id from ws where name = 'orto')$$,
  $$values ('Come va?', 'Come va?', 'orto-p2x8', false)$$,
  'a form question becomes the Research question and stays the form question'
);
select is(
  (select count(*)::integer from public.feedback f where f.workspace_id = (select id from ws where name = 'orto')
     and f.research_id = (select r.id from public.research r where r.workspace_id = f.workspace_id)),
  1,
  'the other workspace''s feedback goes to its own initial Research'
);

-- ===== AC 6 =====

select results_eq(
  $$select workspace_name, question, accepting from public.get_public_form('phc26')$$,
  $$values ('PHC', 'Cosa vuoi dire al team di PHC?', true)$$,
  'get_public_form(''phc26'') returns the workspace name, the form question and accepting'
);
select is(
  public.submit_public_feedback('phc26', 'Dopo la migrazione.', null, 'hash-ip'),
  'ok',
  'submit_public_feedback(''phc26'') accepts a response'
);
select results_eq(
  $$select f.channel, f.research_id = (select r.id from public.research r where r.form_slug = 'phc26')
    from public.feedback f where f.text = 'Dopo la migrazione.'$$,
  $$values ('Modulo pubblico', true)$$,
  'submit_public_feedback(''phc26'') lands in the initial Research as Modulo pubblico'
);

-- ===== AC 7 =====

select results_eq(
  $$select w.name from ws w join public.analytics_milestones m on m.workspace_id = w.id
    where m.event = 'first_research_collected' order by w.name$$,
  $$values ('cinque')$$,
  'first_research_collected is claimed for a workspace with 5 feedback and not for one with 4'
);

select * from finish();
rollback;
