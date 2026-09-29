-- Each public form response looked up its workspace twice, counted the Research's feedback and tried two
-- milestone inserts: 5 calls to the database after the submission, even once both milestones were sent.
-- In a full room (100 responses in 5 seconds, measured on production) they saturated the CPU of the
-- database. Now one call claims the milestones a response makes due and returns the ones it claimed.
-- 5 is COLLECTED_FEEDBACK in src/lib/supabase/admin.ts: the feedback that make a Research collected.

create function public.claim_form_milestones(slug text)
returns table (workspace_id uuid, event text)
language sql volatile security definer set search_path = ''
as $$
  with form as (
    select r.id, r.workspace_id from public.research r where r.form_slug = claim_form_milestones.slug
  ),
  due as (
    select form.workspace_id, 'first_feedback_added' as event from form
    union all
    select form.workspace_id, 'first_research_collected' from form
    where not exists (
        select 1 from public.analytics_milestones m
        where m.workspace_id = form.workspace_id and m.event = 'first_research_collected'
      )
      and (select count(*) from public.feedback f where f.workspace_id = form.workspace_id and f.research_id = form.id) >= 5
  )
  insert into public.analytics_milestones (workspace_id, event)
  select due.workspace_id, due.event from due
  on conflict do nothing
  returning analytics_milestones.workspace_id, analytics_milestones.event
$$;

revoke all on function public.claim_form_milestones(text) from public, anon, authenticated;
grant execute on function public.claim_form_milestones(text) to service_role;
