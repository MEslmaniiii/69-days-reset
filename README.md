# 69 Days Reset

A calm, minimal personal habit tracker for a 69-day morning-routine reset
(**October 24 → December 31, 2026**), built around Fajr in the mosque, Quran,
exercise, and consistency.

Everything runs locally in your browser. No account, no backend — your data is
stored in `localStorage` and never leaves your machine.

---

## Run it

```bash
npm install
npm run dev
```

Then open the URL it prints (default **http://localhost:5173**).

Other commands:

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build
```

> Tip: it works great in Safari on both your MacBook and iPhone (same Wi‑Fi:
> run `npm run dev -- --host` and open the Network URL on your phone).

---

## What's inside

**Daily dashboard** — greeting, `Day N / 69`, today's checklist, today's workout,
today's Quran target, current streak, and weekly completion — all on one screen.

**Core habits** (the only ones that affect your score):
- Fajr prayer in mosque
- Morning Adhkar
- Quran Wird
- Workout — *only counts on workout days*
- Quran Hifz (memorization)
- Muraja'ah (revision)

**Bonus habit** — "Wrote a script / content idea." Tracked, celebrated, but
**never** counts against your percentage.

**Progress** — Today / This week / This month / Overall 69‑day bars, plus current
streak, best streak, days completed, days remaining, and Fajr / Workout / Quran
completion rates.

**Calendar heatmap** — every day from Oct 24 → Dec 31, colored Completed /
Partial / Missed / Today / Upcoming. Tap any day to open its checklist and notes.

**Workout** — a 4‑day split (Upper A / Lower A / Upper B / Lower‑Full B) designed
for a Walking Pad, ~5 kg dumbbells, and bodyweight. Each exercise shows sets,
reps, rest, target muscle, equipment, a light‑dumbbell technique cue, and a
tutorial link. 30–45 min sessions, every one finishes with a walk.

**Walking** — conservative Walking Pad progression (15→35 min over the weeks) with
minutes / distance / steps logging.

**Quran** — current surah & ayah, surah progress bar, ayat memorized, surahs
completed, hifz & revision streaks, the three activities (Wird / Hifz /
Muraja'ah), a gentle 7‑step memorization method, and listening guidance. Starts
in Juz Amma (An‑Naba) and is fully configurable.

**Nutrition** — a simple, sustainable system (not calorie counting). A 7-item
daily checklist (Breakfast, Work Snack, Balanced Lunch, Dinner, Protein, Water,
No Sugary Drinks) scored as its own **Nutrition %**, separate from the core
routine. Includes a meal guide with tappable suggestions, the lunch plate method,
a water tracker (+250 / +500 ml quick buttons), simple **or** detailed protein
tracking, calm food rules, per-item adherence, a nutrition streak, and optional
weight / waist / body-fat tracking with a trend line and weekly average.

**Three separate scores** — Core Routine %, Nutrition %, and a weighted **Overall
Lifestyle %** (default Core 70% / Nutrition 30%, editable in Settings). A bad
nutrition day never resets your challenge, and script-writing stays a bonus that
lowers no score.

**Weekly review** (Fridays) — your week's Fajr / Workout / Wird / Hifz / Revision
/ Overall percentages, a nutrition adherence breakdown, plus reflection questions
for both the routine and nutrition (hardest meal, hunger, energy, discomfort).

**Settings** — edit name, dates, workout days, starting surah / ayah, daily ayah
target, walking minutes, theme, plus nutrition: protein target, water target,
simple/detailed protein mode, the Core/Nutrition lifestyle weighting, and your
own editable meal suggestions.

**Your data** — export to **JSON** or **CSV**, import a JSON backup, or reset.
Refreshing the page never loses anything.

---

## Design & philosophy

- Minimal, premium, calm; Islamic‑inspired but modern. Light & dark mode.
- **Not punishing.** Missing a day is marked, not catastrophic — the app simply
  reminds you: *don't miss twice.* Streak stats are kept, not wiped.
- Quiet milestone markers (7 / 14 / 21 / 30 / 45 / 60 / 69 days). No coins, no
  badges, no popups.
- **Rest days don't hurt your score** — workout is only counted on scheduled
  workout days.

---

## Tech

React + TypeScript + Vite + Tailwind CSS. All state is in a single
`localStorage` document (`src/lib/storage.ts`). No network calls at runtime.

```
src/
  App.tsx                 # shell, navigation, theme
  types.ts                # data model
  state/AppContext.tsx    # app state + actions (auto-persists)
  lib/
    dates.ts              # date helpers (Saturday-start weeks)
    progress.ts           # all percentage / streak calculations
    quran.ts              # 114-surah metadata
    defaults.ts           # settings, workout program, walking plan, milestones
    storage.ts            # load/save + JSON/CSV export + import
  components/             # Dashboard, Calendar, Workout, Walking, Quran, Nutrition, Review, Settings …
```

---

## Ideas for later

- PWA / "Add to Home Screen" so it opens like a native iPhone app offline.
- Optional prayer-time API to show today's Fajr time.
- Reciter audio embeds for the surah you're memorizing.
- iCloud / file-based sync between your Mac and iPhone (currently per-device).
- A simple end-of-challenge summary export.

> The workout "Watch tutorial" links are YouTube **search** links for the exact
> exercise (reputable channels like Jeff Nippard, Jeremy Ethier, ATHLEAN‑X, RP,
> HASfit), so they never point to a dead or wrong video. Swap in specific videos
> you like any time in `src/lib/defaults.ts`.
