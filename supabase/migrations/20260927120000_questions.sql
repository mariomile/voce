-- "Chiedi ai tuoi feedback": one row per question for the quota and the outcome, a private log of
-- every run, and the four functions the server calls. Nobody but the server reads or writes these
-- tables: the answer reaches the browser from the server action and is never read back.
-- To remove the feature, drop the four functions, the two tables and the two types.

create type public.question_status as enum ('running', 'done', 'failed');
create type public.question_outcome as enum ('answered', 'no_evidence');

-- Numbers and states only: the question text and the quotes live in question_runs.
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  status public.question_status not null default 'running',
  outcome public.question_outcome,
  -- Feedback sent to the model.
  feedback_considered integer not null check (feedback_considered >= 1),
  -- Distinct existing feedback the model linked to the question, counted by the server.
  feedback_count integer check (feedback_count >= 0),
  -- Verified quotes kept by finish_question.
  citation_count smallint check (citation_count between 0 and 5),
  created_at timestamptz not null default now(),
  constraint questions_outcome_only_when_done check ((status = 'done') = (outcome is not null))
);
alter table public.questions enable row level security;
revoke all on public.questions from public, anon, authenticated;
create index questions_workspace_idx on public.questions (workspace_id, created_at desc);

-- The log, like analysis_runs.
create table public.question_runs (
  question_id uuid primary key references public.questions (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  model text not null,
  -- Instructions, prompt (with the question) and the feedback ids in the order the model saw them.
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
alter table public.question_runs enable row level security;
revoke all on public.question_runs from public, anon, authenticated;
create index question_runs_workspace_idx on public.question_runs (workspace_id, created_at desc);

-- Mirrors PLAN_LIMITS[plan].questionsPerMonth in src/lib/plans.ts.
create function private.questions_limit(ws uuid)
returns integer
language sql stable security definer set search_path = ''
as $$
  select case
    when coalesce((select plan from public.subscriptions where workspace_id = ws), 'free') = 'pro' then 100
    else 10
  end
$$;

-- ===== Reserve a question =====

-- Returns 'ok' with the new question id, 'busy' (another question is running) or 'limit' (the questions
-- of this Italian calendar month, in any state, reached the quota). Unlike analyses, failed questions
-- count: every question that reaches the model costs tokens.
create function public.start_question(ws uuid, model text, feedback_considered integer, input jsonb)
returns table (outcome text, question_id uuid)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  new_id uuid;
begin
  -- One question decision at a time on this workspace.
  perform 1 from public.workspaces w where w.id = ws for no key update;
  if not found then
    raise exception 'unknown_workspace' using errcode = '22023';
  end if;

  -- A question the server never finished (killed function) must not block the workspace forever.
  -- It still counts in the quota.
  with stale as (
    update public.questions q set status = 'failed'
    where q.workspace_id = ws and q.status = 'running' and q.created_at < now() - interval '5 minutes'
    returning q.id
  )
  update public.question_runs r set error = 'stale', finished_at = now()
  from stale where r.question_id = stale.id;

  if exists (select 1 from public.questions q where q.workspace_id = ws and q.status = 'running') then
    return query select 'busy', null::uuid;
    return;
  end if;

  if (select count(*) from public.questions q
      where q.workspace_id = ws
        and date_trunc('month', q.created_at at time zone 'Europe/Rome')
          = date_trunc('month', now() at time zone 'Europe/Rome')) >= private.questions_limit(ws) then
    return query select 'limit', null::uuid;
    return;
  end if;

  insert into public.questions (workspace_id, feedback_considered)
  values (ws, start_question.feedback_considered)
  returning id into new_id;
  insert into public.question_runs (question_id, workspace_id, model, input)
  values (new_id, ws, start_question.model, start_question.input);
  return query select 'ok', new_id;
end
$$;

-- ===== Close an answered question =====

-- quotes: [{"feedback_id", "text"}], already checked by the server against the texts it sent, in order.
-- Keeps the quotes of feedback that still exist, checks each again against the saved text, and returns
-- the kept ones. The outcome is 'answered' with at least one kept quote, otherwise 'no_evidence'.
-- run: {"output", "issues", "input_tokens", "output_tokens", "duration_ms", "cost_usd"}.
-- One transaction: when a quote is not in the saved text, nothing changes and the question stays running.
create function public.finish_question(question uuid, feedback_count integer, quotes jsonb, run jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  ws uuid;
  kept jsonb;
begin
  select q.workspace_id into ws from public.questions q where q.id = question and q.status = 'running';
  if ws is null then
    raise exception 'question_not_running' using errcode = '22023';
  end if;

  -- Only feedback that still exist. The lock waits for a delete in progress, then skips the row it removed.
  select coalesce(jsonb_agg(jsonb_build_object('feedback_id', k.feedback_id, 'text', k.text, 'saved', k.saved) order by k.rank), '[]')
  into kept
  from (
    select qq.ordinality as rank, qq.value ->> 'feedback_id' as feedback_id, qq.value ->> 'text' as text, f.text as saved
    from jsonb_array_elements(quotes) with ordinality qq
    join public.feedback f on f.workspace_id = ws and f.id = (qq.value ->> 'feedback_id')::uuid
    for key share of f
  ) k;

  -- The server checked the quotes against the texts it sent. Check again against the saved texts.
  if exists (
    select 1 from jsonb_array_elements(kept) k
    where k.value ->> 'text' = '' or strpos(k.value ->> 'saved', k.value ->> 'text') = 0
  ) then
    raise exception 'quote_not_in_feedback' using errcode = '22023';
  end if;
  kept := coalesce((select jsonb_agg(k.value - 'saved' order by k.ordinality) from jsonb_array_elements(kept) with ordinality k), '[]');

  update public.questions set
    status = 'done',
    outcome = case when jsonb_array_length(kept) > 0 then 'answered' else 'no_evidence' end::public.question_outcome,
    feedback_count = finish_question.feedback_count,
    citation_count = jsonb_array_length(kept)
  where id = question;
  update public.question_runs set
    output = run -> 'output',
    issues = run -> 'issues',
    input_tokens = (run ->> 'input_tokens')::integer,
    output_tokens = (run ->> 'output_tokens')::integer,
    duration_ms = (run ->> 'duration_ms')::integer,
    cost_usd = (run ->> 'cost_usd')::numeric,
    finished_at = now()
  where question_id = question;
  return kept;
end
$$;

-- ===== Record a failed question =====

-- It still counts in the quota. run: {"output", "duration_ms", ...} when known.
create function public.fail_question(question uuid, error text, run jsonb default '{}')
returns void
language plpgsql volatile security definer set search_path = ''
as $$
begin
  -- A question already closed as stale keeps its log as it is.
  update public.questions set status = 'failed' where id = question and status = 'running';
  if not found then
    return;
  end if;
  update public.question_runs set
    error = fail_question.error,
    output = run -> 'output',
    issues = run -> 'issues',
    input_tokens = (run ->> 'input_tokens')::integer,
    output_tokens = (run ->> 'output_tokens')::integer,
    duration_ms = (run ->> 'duration_ms')::integer,
    cost_usd = (run ->> 'cost_usd')::numeric,
    finished_at = now()
  where question_id = question;
end
$$;

-- ===== Questions used this month =====

-- Every state counts, as in start_question. Users cannot read questions: the server reads this for them.
create function public.question_usage(ws uuid)
returns table (used integer, quota integer)
language sql stable security definer set search_path = ''
as $$
  select
    (select count(*)::integer from public.questions q
     where q.workspace_id = ws
       and date_trunc('month', q.created_at at time zone 'Europe/Rome')
         = date_trunc('month', now() at time zone 'Europe/Rome')),
    private.questions_limit(ws)
$$;

revoke all on function private.questions_limit(uuid) from public, anon, authenticated;
revoke all on function public.start_question(uuid, text, integer, jsonb) from public, anon, authenticated;
revoke all on function public.finish_question(uuid, integer, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.fail_question(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.question_usage(uuid) from public, anon, authenticated;
grant execute on function public.start_question(uuid, text, integer, jsonb) to service_role;
grant execute on function public.finish_question(uuid, integer, jsonb, jsonb) to service_role;
grant execute on function public.fail_question(uuid, text, jsonb) to service_role;
grant execute on function public.question_usage(uuid) to service_role;
