-- The report of a Research: a memo generated from its last themes analysis, its hypotheses and their verdicts.
-- Each generation is a row of analyses of kind 'report' (reserved by start_analysis, so it counts as 1 analysis
-- of the plan, logged in analysis_runs) and, once checked, one row here. The latest row of a Research is the
-- report the Report tab shows. Only the server writes, through finish_report.
-- To remove the feature: drop finish_report and research_reports (the 'report' value of analysis_kind stays).

create table public.research_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  research_id uuid not null,
  -- The 'report' row of analyses that produced it: its quota, its log. One report per row.
  analysis_id uuid not null unique,
  -- The done themes analysis it was built from.
  source_analysis_id uuid not null,
  -- The language of the interface when it was generated: the report is written and shown in it.
  locale text not null check (locale in ('it', 'en')),
  -- The checked report (src/lib/report.ts): every number in it was written by the server, every quote is the
  -- id of a feedback and a highlight found in its text. The texts of the quoted feedback are read from the
  -- feedback when the report is shown, so a deleted feedback leaves the report.
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  -- Feedback in the Research when the report was generated.
  feedback_count integer not null check (feedback_count >= 0),
  model text not null,
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(12, 6),
  duration_ms integer,
  created_at timestamptz not null default now(),
  foreign key (workspace_id, research_id) references public.research (workspace_id, id) on delete cascade,
  -- Deleting a workspace deletes its analyses and its reports by two cascade paths: both must cascade.
  foreign key (workspace_id, analysis_id) references public.analyses (workspace_id, id) on delete cascade,
  foreign key (workspace_id, source_analysis_id) references public.analyses (workspace_id, id) on delete cascade
);
create index research_reports_research_idx on public.research_reports (research_id, created_at desc);
create index research_reports_workspace_idx on public.research_reports (workspace_id);
create index research_reports_source_idx on public.research_reports (workspace_id, source_analysis_id);

alter table public.research_reports enable row level security;

-- The members of the workspace read its reports: today its owner, the only member. No public link.
create policy "Members read their reports" on public.research_reports
  for select to authenticated using (workspace_id in (select private.my_workspace_ids()));

-- Read only: no writes for authenticated or anon.
revoke all on public.research_reports from public, anon, authenticated;
grant select on public.research_reports to authenticated;

-- ===== Save a report =====

-- On a 'report' row of analyses still running: fails with research_deleted when its Research is gone, with
-- invalid_source when source is not a done themes analysis of the same Research. content: the report already
-- checked by the server; its quotes ($.findings[*].quotes[*] and $.hypotheses[*].quotes[*], each
-- {"feedbackId", "highlight"}) are checked again against the saved feedback text: a quote without either key, not
-- in its feedback, or of a feedback of another Research, fails the save (quote_not_in_feedback). A feedback deleted meanwhile is
-- skipped: the report leaves it out when it is shown. run: {"output", "issues", "input_tokens",
-- "output_tokens", "duration_ms", "cost_usd"}. Returns the id of the report. One transaction.
create function public.finish_report(
  analysis uuid, source uuid, locale text, content jsonb, feedback_count integer, run jsonb
)
returns uuid
language plpgsql volatile security definer set search_path = ''
as $$
declare
  ws uuid;
  res uuid;
  new_id uuid;
begin
  select a.workspace_id, a.research_id into ws, res from public.analyses a
  where a.id = analysis and a.status = 'running' and a.kind = 'report';
  if ws is null then
    raise exception 'analysis_not_running' using errcode = '22023';
  end if;
  -- Deleting the Research empties research_id and keeps the row: nothing to save the report on. The lock
  -- waits for a deletion in progress, then finds no row.
  if res is null then
    raise exception 'research_deleted' using errcode = '22023';
  end if;
  perform 1 from public.research r where r.id = res for key share;
  if not found then
    raise exception 'research_deleted' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.analyses s
    where s.id = source and s.workspace_id = ws and s.research_id = res and s.kind = 'themes' and s.status = 'done'
  ) then
    raise exception 'invalid_source' using errcode = '22023';
  end if;

  -- Every quote names a feedback and a phrase.
  if exists (
    select 1
    from (
      select q.value from jsonb_path_query(content, '$.findings[*].quotes[*]') q(value)
      union all
      select q.value from jsonb_path_query(content, '$.hypotheses[*].quotes[*]') q(value)
    ) quote
    where jsonb_typeof(quote.value) <> 'object'
      or coalesce(quote.value ->> 'feedbackId', '') = ''
      or coalesce(quote.value ->> 'highlight', '') = ''
  ) then
    raise exception 'quote_not_in_feedback' using errcode = '22023';
  end if;

  -- The server checked the quotes against the texts it sent. Check again against the saved texts.
  if exists (
    select 1
    from (
      select q.value from jsonb_path_query(content, '$.findings[*].quotes[*]') q(value)
      union all
      select q.value from jsonb_path_query(content, '$.hypotheses[*].quotes[*]') q(value)
    ) quote
    join public.feedback f on f.workspace_id = ws and f.id = (quote.value ->> 'feedbackId')::uuid
    where f.research_id <> res
      or coalesce(quote.value ->> 'highlight', '') = ''
      or strpos(f.text, quote.value ->> 'highlight') = 0
  ) then
    raise exception 'quote_not_in_feedback' using errcode = '22023';
  end if;

  insert into public.research_reports (workspace_id, research_id, analysis_id, source_analysis_id, locale, content,
    feedback_count, model, input_tokens, output_tokens, cost_usd, duration_ms)
  select ws, res, analysis, source, finish_report.locale, finish_report.content, finish_report.feedback_count, r.model,
    (run ->> 'input_tokens')::integer, (run ->> 'output_tokens')::integer, (run ->> 'cost_usd')::numeric,
    (run ->> 'duration_ms')::integer
  from public.analysis_runs r where r.analysis_id = analysis
  returning id into new_id;
  if new_id is null then
    raise exception 'analysis_run_missing' using errcode = '22023';
  end if;

  update public.analyses set status = 'done' where id = analysis;
  update public.analysis_runs set
    output = run -> 'output',
    issues = run -> 'issues',
    input_tokens = (run ->> 'input_tokens')::integer,
    output_tokens = (run ->> 'output_tokens')::integer,
    duration_ms = (run ->> 'duration_ms')::integer,
    cost_usd = (run ->> 'cost_usd')::numeric,
    finished_at = now()
  where analysis_id = analysis;
  return new_id;
end
$$;

revoke all on function public.finish_report(uuid, uuid, text, jsonb, integer, jsonb) from public, anon, authenticated;
grant execute on function public.finish_report(uuid, uuid, text, jsonb, integer, jsonb) to service_role;
