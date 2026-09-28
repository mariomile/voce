-- A verdict points at the analysis that wrote it without an on-delete rule. Analyses outlive a deleted
-- Research (they count in the month's quota), so this never mattered there; but deleting a workspace
-- deletes its analyses and its verdicts by two cascade paths at once, and the check on this key fired
-- before the verdicts were gone: the delete failed. A verdict without its analysis has nothing to point
-- at, so it goes with it.
alter table public.hypothesis_verdicts
  drop constraint hypothesis_verdicts_workspace_id_analysis_id_fkey,
  add constraint hypothesis_verdicts_workspace_id_analysis_id_fkey
    foreign key (workspace_id, analysis_id) references public.analyses (workspace_id, id) on delete cascade;
