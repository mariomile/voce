-- AI analysis: status of each analysis, sentiment of themes, a private log of every run,
-- and the three functions the server calls to reserve, save and fail an analysis.

create type public.analysis_status as enum ('running', 'done', 'failed');
create type public.theme_sentiment as enum ('positive', 'neutral', 'negative', 'mixed');

-- start_analysis always sets the status. Existing analyses (the seed) are finished ones.
alter table public.analyses add column status public.analysis_status not null default 'done';

alter table public.themes add column sentiment public.theme_sentiment not null;

-- ===== Log of every run: what went in, what came out, what it cost =====

-- RLS on and no grants for anon or authenticated: users never read it, only the server does.
-- Written only by the functions below.
create table public.analysis_runs (
  analysis_id uuid primary key references public.analyses (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  model text not null,
  -- Instructions, prompt and the feedback ids in the order the model saw them.
  input jsonb not null,
  -- The model's raw output, before the server checks it.
  output jsonb,
  -- What the checks dropped from the output, and why.
  issues jsonb,
  input_tokens integer,
  output_tokens integer,
  duration_ms integer,
  cost_usd numeric(12, 6),
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
alter table public.analysis_runs enable row level security;
revoke all on public.analysis_runs from public, anon, authenticated;
create index analysis_runs_workspace_idx on public.analysis_runs (workspace_id, created_at desc);

-- Mirrors PLAN_LIMITS in src/lib/plans.ts.
create function private.analyses_limit(ws uuid)
returns integer
language sql stable security definer set search_path = ''
as $$
  select case
    when coalesce((select plan from public.subscriptions where workspace_id = ws), 'free') = 'pro' then 100
    else 3
  end
$$;

-- ===== Reserve an analysis =====

-- Returns 'ok' with the new analysis id, 'busy' (another one is running) or 'limit' (monthly quota used,
-- or as many failed runs as the quota). Failed analyses do not use the quota: the user got no themes.
-- Running ones do, so parallel clicks cannot go over it.
create function public.start_analysis(ws uuid, model text, period_start date, feedback_count integer, input jsonb)
returns table (outcome text, analysis_id uuid)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  new_id uuid;
begin
  -- One analysis decision at a time on this workspace.
  perform 1 from public.workspaces w where w.id = ws for no key update;
  if not found then
    raise exception 'unknown_workspace' using errcode = '22023';
  end if;

  -- A run the server never finished (crash, killed function) must not block the workspace forever.
  with stale as (
    update public.analyses a set status = 'failed'
    where a.workspace_id = ws and a.status = 'running' and a.created_at < now() - interval '10 minutes'
    returning a.id
  )
  update public.analysis_runs r set error = 'stale', finished_at = now()
  from stale where r.analysis_id = stale.id;

  if exists (select 1 from public.analyses a where a.workspace_id = ws and a.status = 'running') then
    return query select 'busy', null::uuid;
    return;
  end if;

  -- Failed runs still cost tokens: they do not use the quota, but at most as many again per month.
  if (select count(*) filter (where a.status <> 'failed') >= private.analyses_limit(ws)
        or count(*) filter (where a.status = 'failed') >= private.analyses_limit(ws)
      from public.analyses a
      where a.workspace_id = ws
        and date_trunc('month', a.created_at at time zone 'Europe/Rome')
          = date_trunc('month', now() at time zone 'Europe/Rome')) then
    return query select 'limit', null::uuid;
    return;
  end if;

  insert into public.analyses (workspace_id, period_start, feedback_count, status)
  values (ws, start_analysis.period_start, start_analysis.feedback_count, 'running')
  returning id into new_id;
  insert into public.analysis_runs (analysis_id, workspace_id, model, input)
  values (new_id, ws, start_analysis.model, start_analysis.input);
  return query select 'ok', new_id;
end
$$;

-- ===== Save a finished analysis =====

-- themes: [{"title", "summary", "kind", "sentiment", "feedback": [uuid], "quotes": [{"feedback_id", "text"}]}],
-- already checked by the server. Quotes are in rank order. run: {"output", "issues", "input_tokens",
-- "output_tokens", "duration_ms", "cost_usd"}.
-- Priority and status come from the latest finished analysis, matching titles without case and outer spaces.
-- All in one transaction: either the whole analysis is there, or nothing changed.
create function public.finish_analysis(analysis uuid, themes jsonb, run jsonb)
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
    left join lateral (
      select (qq.ordinality)::smallint as rank, qq.value ->> 'text' as text
      from jsonb_array_elements(theme -> 'quotes') with ordinality qq
      where qq.value ->> 'feedback_id' = f.value
      limit 1
    ) q on true;
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

-- ===== Record a failed analysis =====

-- The themes of the previous analysis stay as they are. run: {"output", "duration_ms", ...} when known.
create function public.fail_analysis(analysis uuid, error text, run jsonb default '{}')
returns void
language plpgsql volatile security definer set search_path = ''
as $$
begin
  -- An analysis already closed as stale keeps its log as it is.
  update public.analyses set status = 'failed' where id = analysis and status = 'running';
  if not found then
    return;
  end if;
  update public.analysis_runs set
    error = fail_analysis.error,
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

revoke all on function private.analyses_limit(uuid) from public, anon, authenticated;
revoke all on function public.start_analysis(uuid, text, date, integer, jsonb) from public, anon, authenticated;
revoke all on function public.finish_analysis(uuid, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.fail_analysis(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.start_analysis(uuid, text, date, integer, jsonb) to service_role;
grant execute on function public.finish_analysis(uuid, jsonb, jsonb) to service_role;
grant execute on function public.fail_analysis(uuid, text, jsonb) to service_role;
