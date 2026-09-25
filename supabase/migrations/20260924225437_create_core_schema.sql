-- Core schema: workspaces, members, billing, feedback, analyses, themes.
-- Every table gets RLS and explicit grants in this same migration, before it holds data.
-- anon and authenticated start with no privileges; each grant below is deliberate.

create schema if not exists private;
revoke all on schema private from public;

-- New objects in public get no rights for anon and authenticated: every later grant is written on purpose.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, public;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;

create type public.plan as enum ('free', 'pro');
create type public.member_role as enum ('owner', 'member');
create type public.theme_kind as enum ('problem', 'opportunity', 'praise');
create type public.theme_priority as enum ('high', 'medium', 'low');
create type public.theme_status as enum ('to_review', 'roadmap', 'done', 'discarded');

-- ===== Tables =====

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  form_slug text not null unique check (form_slug ~ '^[a-z0-9-]{3,60}$'),
  form_enabled boolean not null default true,
  -- Chosen by the PM. Null means the default question.
  form_question text check (char_length(btrim(form_question)) between 1 and 140),
  created_at timestamptz not null default now()
);

-- Today every workspace has one owner. The table is ready for teams.
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_id_idx on public.workspace_members (user_id);

-- Written only by the server (the Stripe webhook). Users can read it, never write it.
create table public.subscriptions (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  plan public.plan not null default 'free',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_status text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  text text not null check (char_length(btrim(text)) between 1 and 2000),
  -- Free text: "Supporto", "Call vendita", "Modulo pubblico", or whatever a CSV says.
  channel text not null check (char_length(btrim(channel)) between 1 and 60),
  customer text check (char_length(customer) <= 200),
  email text check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  -- Dated on the Italian calendar, like the quotas.
  received_at date not null default (now() at time zone 'Europe/Rome')::date,
  created_at timestamptz not null default now(),
  unique (workspace_id, id)
);
create index feedback_workspace_received_idx on public.feedback (workspace_id, received_at desc);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  -- First day of the analysed window.
  period_start date not null,
  feedback_count integer not null check (feedback_count >= 0),
  created_at timestamptz not null default now(),
  unique (workspace_id, id)
);
create index analyses_workspace_created_idx on public.analyses (workspace_id, created_at desc);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  analysis_id uuid not null,
  kind public.theme_kind not null,
  title text not null check (char_length(btrim(title)) > 0),
  summary text not null,
  priority public.theme_priority,
  status public.theme_status not null default 'to_review',
  created_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, analysis_id) references public.analyses (workspace_id, id) on delete cascade
);
create index themes_workspace_analysis_idx on public.themes (workspace_id, analysis_id);

-- A feedback linked to a theme. The composite keys keep both ends in the same workspace.
create table public.theme_feedback (
  theme_id uuid not null,
  feedback_id uuid not null,
  workspace_id uuid not null,
  -- Set on the quotes the AI picked to represent the theme.
  quote_rank smallint check (quote_rank > 0),
  -- Exact substring of the feedback text to highlight. Only on quotes.
  highlight text,
  primary key (theme_id, feedback_id),
  foreign key (workspace_id, theme_id) references public.themes (workspace_id, id) on delete cascade,
  foreign key (workspace_id, feedback_id) references public.feedback (workspace_id, id) on delete cascade
);
create index theme_feedback_workspace_theme_idx on public.theme_feedback (workspace_id, theme_id);
create index theme_feedback_workspace_feedback_idx on public.theme_feedback (workspace_id, feedback_id);

-- Aggregates the app needs, so it never downloads every row. security_invoker keeps RLS in force.
create view public.feedback_channels with (security_invoker = true) as
  select workspace_id, channel, count(*)::integer as feedback_count
  from public.feedback
  group by workspace_id, channel;

create view public.theme_stats with (security_invoker = true) as
  select tf.workspace_id, tf.theme_id, count(*)::integer as feedback_count,
    array_agg(f.received_at) as received_dates
  from public.theme_feedback tf
  join public.feedback f on f.workspace_id = tf.workspace_id and f.id = tf.feedback_id
  group by tf.workspace_id, tf.theme_id;

-- ===== Access helpers (private schema, not exposed by the API) =====

-- Workspaces of the signed-in user. Security definer so policies on workspace_members
-- can use it without recursion.
create function private.my_workspace_ids()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select workspace_id from public.workspace_members where user_id = (select auth.uid())
$$;

-- Mirrors PLAN_LIMITS in src/lib/plans.ts. Null means unlimited.
create function private.feedback_limit(ws uuid)
returns integer
language sql stable security definer set search_path = ''
as $$
  select case
    when coalesce((select plan from public.subscriptions where workspace_id = ws), 'free') = 'pro' then null
    else 100
  end
$$;

create function private.accepts_feedback(ws uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.feedback_limit(ws) is null
    or (select count(*) from public.feedback where workspace_id = ws) < private.feedback_limit(ws)
$$;

-- ===== Row Level Security =====

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.feedback enable row level security;
alter table public.analyses enable row level security;
alter table public.themes enable row level security;
alter table public.theme_feedback enable row level security;

create policy "Members read their workspace" on public.workspaces
  for select to authenticated using (id in (select private.my_workspace_ids()));
create policy "Members update their workspace" on public.workspaces
  for update to authenticated
  using (id in (select private.my_workspace_ids()))
  with check (id in (select private.my_workspace_ids()));

create policy "Members read their workspace members" on public.workspace_members
  for select to authenticated using (workspace_id in (select private.my_workspace_ids()));

create policy "Members read their subscription" on public.subscriptions
  for select to authenticated using (workspace_id in (select private.my_workspace_ids()));

create policy "Members read their feedback" on public.feedback
  for select to authenticated using (workspace_id in (select private.my_workspace_ids()));
create policy "Members add feedback to their workspace" on public.feedback
  for insert to authenticated with check (workspace_id in (select private.my_workspace_ids()));

create policy "Members read their analyses" on public.analyses
  for select to authenticated using (workspace_id in (select private.my_workspace_ids()));

create policy "Members read their themes" on public.themes
  for select to authenticated using (workspace_id in (select private.my_workspace_ids()));
create policy "Members update their themes" on public.themes
  for update to authenticated
  using (workspace_id in (select private.my_workspace_ids()))
  with check (workspace_id in (select private.my_workspace_ids()));

create policy "Members read their theme links" on public.theme_feedback
  for select to authenticated using (workspace_id in (select private.my_workspace_ids()));

-- ===== Grants: nothing by default, then only what each role needs =====

revoke all on all tables in schema public from anon, authenticated;

grant select on public.workspaces to authenticated;
grant update (name, form_enabled, form_question) on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.feedback to authenticated;
grant insert (workspace_id, text, channel, customer, email, received_at) on public.feedback to authenticated;
grant select on public.analyses to authenticated;
grant select on public.themes to authenticated;
grant update (priority, status) on public.themes to authenticated;
grant select on public.theme_feedback to authenticated;
grant select on public.feedback_channels to authenticated;
grant select on public.theme_stats to authenticated;

-- ===== Free plan feedback limit, enforced on every insert =====

create function private.enforce_feedback_limit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- Serialize inserts on the same workspace, so two cannot both take the last slot.
  perform 1 from public.workspaces where id = new.workspace_id for no key update;
  if not private.accepts_feedback(new.workspace_id) then
    raise exception 'feedback_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end
$$;

create trigger enforce_feedback_limit
  before insert on public.feedback
  for each row execute function private.enforce_feedback_limit();

-- ===== A workspace for every new user =====

-- "Fatturino Srl" → "fatturino-srl-3f9a1c2e". The random part keeps links unguessable.
create function private.new_form_slug(workspace_name text)
returns text
language sql volatile set search_path = ''
as $$
  select coalesce(
    nullif(left(btrim(regexp_replace(
      translate(lower(workspace_name), 'àáâäèéêëìíîïòóôöùúûü', 'aaaaeeeeiiiioooouuuu'),
      '[^a-z0-9]+', '-', 'g'), '-'), 40), ''),
    'voce'
  ) || '-' || left(replace(gen_random_uuid()::text, '-', ''), 8)
$$;

create function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  workspace_name text;
  workspace_id uuid;
begin
  -- The signup form sends the product name. Google sign-ups have none: use the email name.
  workspace_name := left(btrim(coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'workspace_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Il mio prodotto'
  )), 60);

  insert into public.workspaces (name, form_slug)
  values (workspace_name, private.new_form_slug(workspace_name))
  returning id into workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (workspace_id, new.id, 'owner');

  insert into public.subscriptions (workspace_id) values (workspace_id);
  return new;
end
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Policies call my_workspace_ids() as the signed-in user; every other private function stays closed.
revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.my_workspace_ids() to authenticated;

-- ===== Public form: the only things an anonymous visitor can do =====

-- Returns only what the form shows. Nothing when the link is disabled or unknown.
create function public.get_public_form(slug text)
returns table (workspace_name text, question text, accepting boolean)
language sql stable security definer set search_path = ''
as $$
  select w.name,
    coalesce(w.form_question, 'Cosa vuoi dire al team di ' || w.name || '?'),
    private.accepts_feedback(w.id)
  from public.workspaces w
  where w.form_slug = get_public_form.slug and w.form_enabled
$$;

-- The channel is fixed here, not chosen by the caller. Returns 'ok', 'invalid' or 'unavailable'.
create function public.submit_public_feedback(slug text, feedback_text text, email text default null)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  ws uuid;
  clean_email text := nullif(btrim(email), '');
begin
  if feedback_text is null or char_length(btrim(feedback_text)) not between 1 and 2000 then
    return 'invalid';
  end if;
  if clean_email is not null
    and (char_length(clean_email) > 254 or clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    return 'invalid';
  end if;

  select w.id into ws from public.workspaces w
  where w.form_slug = submit_public_feedback.slug and w.form_enabled;
  if ws is null or not private.accepts_feedback(ws) then
    return 'unavailable';
  end if;

  insert into public.feedback (workspace_id, text, channel, email)
  values (ws, btrim(feedback_text), 'Modulo pubblico', clean_email);
  return 'ok';
exception
  -- Another submission took the last Free slot in the meantime.
  when raise_exception then
    if sqlerrm = 'feedback_limit_reached' then
      return 'unavailable';
    end if;
    raise;
end
$$;

revoke all on function public.get_public_form(text) from public, anon, authenticated;
revoke all on function public.submit_public_feedback(text, text, text) from public, anon, authenticated;
grant execute on function public.get_public_form(text) to anon, authenticated;
grant execute on function public.submit_public_feedback(text, text, text) to anon, authenticated;
