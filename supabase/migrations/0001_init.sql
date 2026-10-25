-- Build Your Reset — initial schema with Row Level Security.
-- Run in Supabase SQL editor (or via `supabase db push`).
-- Every table is isolated per user: a user can only read/write rows where
-- user_id = auth.uid(). Admin access happens ONLY server-side via the
-- service_role key, which bypasses RLS.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text,
  phone text,
  country_code text,
  country text,
  bio text,
  schedule jsonb not null default '{"preferredTime":"flexible","availableDays":[0,1,2,3,4,5,6]}'::jsonb,
  campaign_name text not null default '2026 Reset',
  campaign_start date,
  campaign_end date not null default '2026-12-31',
  theme text not null default 'system',
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  privacy_policy_version text,
  is_admin boolean not null default false,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  last_active_at timestamptz,
  utm jsonb
);

-- Prevent clients from granting themselves admin. Only service_role may set it.
create or replace function public.protect_admin_flag()
returns trigger language plpgsql security definer as $$
begin
  if (coalesce(auth.role(), '') is distinct from 'service_role') then
    if (tg_op = 'INSERT') then
      new.is_admin := false;
    elsif (tg_op = 'UPDATE') then
      new.is_admin := old.is_admin;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_admin on public.profiles;
create trigger trg_protect_admin
  before insert or update on public.profiles
  for each row execute function public.protect_admin_flag();

-- ---------------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_goals_user on public.goals (user_id);

-- ---------------------------------------------------------------------------
-- habits
-- ---------------------------------------------------------------------------
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null,
  frequency text not null,
  days jsonb not null default '[]'::jsonb,
  weekly_target int,
  measurable boolean not null default false,
  target_value numeric,
  unit text,
  recommended_time text,
  description text,
  is_active boolean not null default true,
  is_paused boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_habits_user on public.habits (user_id);

-- ---------------------------------------------------------------------------
-- habit_logs
-- ---------------------------------------------------------------------------
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  value numeric,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, habit_id, date)
);
create index if not exists idx_logs_user_date on public.habit_logs (user_id, date);

-- ---------------------------------------------------------------------------
-- milestones
-- ---------------------------------------------------------------------------
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  target_date date not null,
  measurable boolean not null default false,
  target_value numeric,
  unit text,
  achieved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_milestones_user on public.milestones (user_id);

-- ---------------------------------------------------------------------------
-- measurements
-- ---------------------------------------------------------------------------
create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  type text not null,
  value numeric not null,
  unit text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_measurements_user on public.measurements (user_id);

-- ---------------------------------------------------------------------------
-- weekly_reviews
-- ---------------------------------------------------------------------------
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  score int not null default 0,
  best_habit text,
  most_missed_habit text,
  consistency_pct int not null default 0,
  went_well text,
  difficult text,
  changed text,
  ai_suggestions jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);
create index if not exists idx_reviews_user on public.weekly_reviews (user_id);

-- ---------------------------------------------------------------------------
-- ai_plans (snapshot of generated/accepted plans)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'proposed',
  plan jsonb not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create index if not exists idx_ai_plans_user on public.ai_plans (user_id);

-- ---------------------------------------------------------------------------
-- marketing_preferences
-- ---------------------------------------------------------------------------
create table if not exists public.marketing_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_opt_in boolean not null default false,
  whatsapp_opt_in boolean not null default false,
  consent_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- analytics_events (no PII — see app guard)
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event text not null,
  props jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_events_created on public.analytics_events (created_at);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.milestones enable row level security;
alter table public.measurements enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.ai_plans enable row level security;
alter table public.marketing_preferences enable row level security;
alter table public.analytics_events enable row level security;

-- profiles: id = auth.uid()
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles for delete using (id = auth.uid());

-- Helper: standard owner policies for a table keyed by user_id.
do $$
declare t text;
begin
  foreach t in array array[
    'goals','habits','habit_logs','milestones','measurements',
    'weekly_reviews','ai_plans','marketing_preferences'
  ] loop
    execute format('drop policy if exists "%1$s_all_own" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_all_own" on public.%1$s for all using (user_id = auth.uid()) with check (user_id = auth.uid());',
      t
    );
  end loop;
end $$;

-- analytics: anyone may INSERT their own (or anonymous) events; nobody may SELECT
-- via the anon/authenticated role (admin reads with service_role which bypasses RLS).
drop policy if exists "events_insert" on public.analytics_events;
create policy "events_insert" on public.analytics_events for insert
  with check (user_id is null or user_id = auth.uid());
