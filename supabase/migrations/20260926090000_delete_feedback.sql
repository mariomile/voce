-- Members can delete a feedback of their workspace. Its theme links go with it (on delete cascade),
-- so themes, quotes and counts change at once, without a new analysis.

create policy "Members delete their feedback" on public.feedback
  for delete to authenticated using (workspace_id in (select private.my_workspace_ids()));

grant delete on public.feedback to authenticated;
