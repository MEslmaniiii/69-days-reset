# Build Your Reset

> Tell us where you are now and where you want to be by the end of the year — AI builds a personalized habit system to get you there.

**Build Your Reset** is a public, multi-user web app. A person describes their life and goals; AI generates a realistic system of daily/weekly habits, milestones, and tracking that runs from today until a campaign end date (default **Dec 31, 2026**). Users track progress, get weekly reviews, and an AI coach. It grew out of the single-user *69 Days Reset* tracker — that original routine now lives as one of several example presets.

---

## Product overview

- **Onboarding** — name → phone (country + validation) → bio → goals (multi-select + custom) → per-goal details → schedule → consent.
- **AI plan generation** — OpenAI builds 3–6 daily habits, weekly habits, and dated milestones from the user's goals + schedule. Always falls back to a deterministic rule-based generator so it never hard-fails.
- **Plan review** — the user edits / adds / deletes / re-schedules habits *before* activating. Nothing is forced.
- **Dashboard** — greeting, days-until-campaign-end countdown, today's progress %, habit checklist (checkbox + measurable targets like `5,200 / 8,000 steps`), streaks, weekly & overall progress, milestones.
- **Habit management** — add/edit/delete/pause anytime; "re-run AI suggestions" appends ideas without destroying history.
- **Weekly review** — weekly score, best/most-missed habit, per-habit consistency, reflection prompts, optional AI suggestions.
- **AI coach** — concise, practical advice from goals + aggregate stats (never personal data).
- **Admin dashboard** (`/admin`, owner-only) — user/retention/geo/goal stats + CSV exports (Users, Leads, Marketing Leads, Goals, Activity).
- **Privacy-first** — explicit consent, separate (unchecked) marketing opt-in, data export, account deletion, UTM attribution, PII-free analytics.
- **Mobile-first, premium-minimal** design (sage + gold palette, light/dark).

---

## Tech stack

| Layer | Choice |
|------|--------|
| Frontend | React 19 + Vite + TypeScript + Tailwind |
| Routing | react-router-dom |
| Auth & DB | Supabase (Postgres + Auth + Row Level Security) |
| Serverless | Vercel Functions (`/api/*`) — protect the OpenAI key + admin-only data |
| AI | OpenAI (server-side only; `gpt-4o-mini` by default) |
| Hosting | Vercel |

If Supabase env vars are **absent**, the app runs in a **device-only demo mode** (localStorage) so it's instantly previewable without a backend — but real accounts and data isolation require Supabase.

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values (optional for demo mode)
npm run dev                  # http://localhost:5173
```

- Without `.env.local` → demo mode (local device storage, fake auth).
- With Supabase + OpenAI keys → full backend. Run `vercel dev` instead of `npm run dev` to exercise the `/api` functions locally.

```bash
npm run build   # type-check + production build
npm run lint
```

---

## Environment variables

See `.env.example`. **Never commit real values** — `.env.local` and `.env*` are gitignored.

| Variable | Scope | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | public (browser) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | public (browser) | Supabase anon key (safe — RLS protects data) |
| `SUPABASE_URL` | server | same URL, for `/api` functions |
| `SUPABASE_SERVICE_ROLE_KEY` | **server secret** | bypasses RLS — admin stats/exports, account deletion. Never exposed to the browser. |
| `OPENAI_API_KEY` | **server secret** | AI plan + coach generation |
| `OPENAI_MODEL` | server | optional model override (default `gpt-4o-mini`) |

---

## Database setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → run `supabase/migrations/0001_init.sql`.
   This creates all tables (`profiles`, `goals`, `habits`, `habit_logs`, `milestones`, `measurements`, `weekly_reviews`, `ai_plans`, `marketing_preferences`, `analytics_events`), enables **Row Level Security**, and adds owner-only policies so each user can access **only their own rows**.
3. **Auth** → Providers → Email: for frictionless onboarding you may disable "Confirm email" (optional).
4. Copy **Project URL**, **anon key**, and **service_role key** into your env.
5. **Make yourself admin**: after signing up once, run in SQL Editor:
   ```sql
   update public.profiles set is_admin = true where email = 'YOUR_EMAIL';
   ```
   `is_admin` is protected by a trigger — it can only be set with the service_role (SQL editor), never from the client.

---

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new) (framework auto-detects Vite).
3. Add all env vars from the table above in **Project → Settings → Environment Variables** (mark the service-role and OpenAI keys for Production/Preview; they stay server-side).
4. Deploy. `vercel.json` already routes SPA paths to `index.html` and serves `/api/*` as functions.

---

## Project architecture

```
api/                      # Vercel serverless functions (server-only)
  _lib/supabaseAdmin.ts    # service-role client + JWT verify + admin gate
  _lib/openaiPlan.ts       # OpenAI plan generation + output sanitizing
  generate-plan.ts         # POST → personalized plan (AI, rule-based fallback)
  coach.ts                 # POST → coaching advice
  admin/stats.ts           # GET → aggregate stats (admin only)
  admin/export.ts          # GET → CSV export (admin only)
  account/delete.ts        # POST → delete auth user (cascades data)
supabase/migrations/       # SQL schema + RLS
src/
  types.ts                 # generic domain model (dynamic habits)
  lib/                     # config, dates, phone, analytics, progress, api, planTemplates, presets
  data/                    # repo interface + supabaseRepo + localRepo (demo)
  state/                   # AuthContext, DataContext
  components/              # ui primitives, AppLayout, HabitEditor
  pages/                   # Landing, Auth, Onboarding, Dashboard, Habits, WeeklyReview, Coach, Settings, Admin, Privacy, Terms
```

**Campaign system** is dynamic (stored per profile) so new challenges — 30-day, 90-day, Ramadan, 2027 Reset — can be added without re-architecting. Habits are fully generic (no hard-coded Mohamed/Quran/workout schema).

---

## Security model

- Every table has RLS: `user_id = auth.uid()`. User A can never read/write User B's data.
- Admin data (stats, lead exports) is served **only** by `/api/admin/*`, which verifies the caller's JWT **and** re-checks `is_admin` server-side using the service role. There is no frontend-trusted `isAdmin` flag.
- The service-role and OpenAI keys live only in server env — never shipped to the browser.
- `is_admin` cannot be self-granted (DB trigger blocks client writes).
- Analytics events and the AI coach never receive names, phone numbers, emails, or bios.
- CSV exports guard against formula injection and include a UTF-8 BOM for Excel.

---

## Roadmap (architecture-ready, not yet built)

WhatsApp/email/push reminders · AI weekly reports · premium subscriptions · multiple challenges · accountability groups · referrals.
