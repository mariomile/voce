-- A member can delete a feedback while its analysis is running. finish_analysis now skips the links
-- to feedback that no longer exist instead of failing on them. Still one transaction: all or nothing.
-- Same function as in 20260925120000_ai_analysis.sql, only the link insert changed.

create or replace function public.finish_analysis(analysis uuid, themes jsonb, run jsonb)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
declare
  ws uuid;
  previous uuid;
  theme jsonb;
  theme_id uuid;
begin
  select a.workspace_id into ws from public.analyses a where a.id = analysis and a.status = 'running';
  if ws is null then
    raise exception 'analysis_not_running' using errcode = '22023';
  end if;
  perform 1 from public.workspaces w where w.id = ws for no key update;

  select a.id into previous from public.analyses a
  where a.workspace_id = ws and a.status = 'done'
  order by a.created_at desc limit 1;

  for theme in select t.value from jsonb_array_elements(themes) t loop
    insert into public.themes (workspace_id, analysis_id, kind, title, summary, sentiment, priority, status)
    select ws, analysis, (theme ->> 'kind')::public.theme_kind, btrim(theme ->> 'title'), btrim(theme ->> 'summary'),
      (theme ->> 'sentiment')::public.theme_sentiment, old.priority, coalesce(old.status, 'to_review')
    from (select 1) one
    left join lateral (
      select o.priority, o.status from public.themes o
      where o.workspace_id = ws and o.analysis_id = previous
        and lower(btrim(o.title)) = lower(btrim(theme ->> 'title'))
      limit 1
    ) old on true
    returning id into theme_id;

    insert into public.theme_feedback (theme_id, feedback_id, workspace_id, quote_rank, highlight)
    select theme_id, f.value::uuid, ws, q.rank, q.text
    from jsonb_array_elements_text(theme -> 'feedback') f
    -- Only feedback that still exist. The lock waits for a delete in progress, then skips the row it removed.
    join public.feedback kept on kept.workspace_id = ws and kept.id = f.value::uuid
    left join lateral (
      select (qq.ordinality)::smallint as rank, qq.value ->> 'text' as text
      from jsonb_array_elements(theme -> 'quotes') with ordinality qq
      where qq.value ->> 'feedback_id' = f.value
      limit 1
    ) q on true
    for key share of kept;
  end loop;

  -- The server checked the quotes against the texts it sent. Check again against the saved texts.
  if exists (
    select 1 from public.theme_feedback tf
    join public.themes t on t.id = tf.theme_id
    join public.feedback f on f.workspace_id = tf.workspace_id and f.id = tf.feedback_id
    where t.analysis_id = analysis and tf.highlight is not null
      and (tf.highlight = '' or strpos(f.text, tf.highlight) = 0)
  ) then
    raise exception 'quote_not_in_feedback' using errcode = '22023';
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
end
$$;
