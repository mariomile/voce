-- The report of a Research is one more kind of analysis: a row of analyses reserves it with start_analysis,
-- so it counts as 1 analysis of the plan, runs one at a time per workspace and keeps its log in
-- analysis_runs. On its own: Postgres cannot use a new enum value in the transaction that adds it.
alter type public.analysis_kind add value 'report';
