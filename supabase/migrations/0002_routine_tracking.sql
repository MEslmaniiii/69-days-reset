-- ---------------------------------------------------------------------------
-- 0002 — richer routine tracking (additive, backward-compatible)
--
-- Adds optional/light-day support used by the tracking engine. All columns are
-- nullable or defaulted, so existing rows and existing user plans are untouched.
-- Safe to run multiple times.
-- ---------------------------------------------------------------------------

-- Habits: optional ("bonus") habits never count toward %/streaks; light-day
-- habits are the only ones expected on a light day, with an optional reduced
-- target for measurable ones (e.g. a 10-minute walk instead of 25).
alter table public.habits
  add column if not exists optional boolean not null default false;
alter table public.habits
  add column if not exists light_day boolean not null default false;
alter table public.habits
  add column if not exists light_target_value numeric;

-- Profiles: the set of dates the user has marked as a "light day".
alter table public.profiles
  add column if not exists light_days text[] not null default '{}';

-- NOTE: timezone and the intermittent-fasting eating window live inside the
-- existing `schedule` jsonb column, so no schema change is needed for them.
