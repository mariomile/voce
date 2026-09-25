-- Analytics: which activation events a workspace has already sent to PostHog.
-- The server inserts with "on conflict do nothing": only the insert that lands sends the event,
-- so each event leaves once per workspace even when many requests race. No text, no personal data.

-- RLS on and no grants for anon or authenticated: only the server reads and writes it.
create table public.analytics_milestones (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  event text not null check (event in ('signed_up', 'first_feedback_added', 'first_analysis_completed', 'upgraded_to_pro')),
  sent_at timestamptz not null default now(),
  primary key (workspace_id, event)
);
alter table public.analytics_milestones enable row level security;
revoke all on public.analytics_milestones from public, anon, authenticated;
