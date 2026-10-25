import { useApp } from '../state/AppContext'
import {
  currentStreak,
  bestStreak,
  dayNumber,
  daysCompleted,
  daysRemaining,
  habitPct,
  lifestylePct,
  missedYesterday,
  monthlyPct,
  nutritionDayRatio,
  nutritionTodayPct,
  overallPct,
  proteinDone,
  quranPct,
  todayPct,
  totalDays,
  waterDone,
  weeklyPct,
} from '../lib/progress'
import { getSurah } from '../lib/quran'
import { walkingTargetForDay } from '../lib/defaults'
import { prettyDate } from '../lib/dates'
import { DayChecklist } from './DayChecklist'
import { workoutForDate } from './WorkoutView'
import { Calendar } from './Calendar'
import { Milestones } from './Milestones'
import { LabeledBar, ProgressBar, SectionTitle, StatCard } from './ui'
import type { View } from '../App'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { data, settings, today } = useApp()
  const n = dayNumber(settings, today)
  const total = totalDays(settings)
  const started = n >= 1
  const beforeStart = n < 1
  const afterEnd = n > total

  const streak = currentStreak(data, settings, today)
  const showNudge = missedYesterday(data, settings, today) && n >= 1

  const q = data.quran
  const surah = getSurah(q.currentSurah)
  const todaysWorkout = workoutForDate(today, settings.workoutDays)
  const walkTarget = walkingTargetForDay(Math.max(1, n), settings.walkingBaseMinutes)

  const corePct = todayPct(data, settings, today)
  const nutriPct = nutritionTodayPct(data, settings, today)
  const lifePct = lifestylePct(corePct, nutriPct, settings)

  return (
    <div className="space-y-6">
      {/* Greeting header */}
      <header className="animate-fadein">
        <p className="text-sm text-sage-500 dark:text-sage-400">{prettyDate(today)}</p>
        <h1 className="mt-1 text-3xl font-semibold text-sage-900 dark:text-white">
          {greeting()}, {settings.name}
        </h1>
        <p className="mt-1 text-sage-500 dark:text-sage-400">
          {beforeStart && `${settings.challengeName} begins ${prettyDate(settings.startDate)}.`}
          {afterEnd && `${settings.challengeName} complete. Well done.`}
          {started && !afterEnd && (
            <>
              <span className="font-medium text-sage-700 dark:text-sage-200">
                Day {n} of {total}
              </span>{' '}
              · {settings.challengeName}
            </>
          )}
        </p>
      </header>

      {showNudge && (
        <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm text-sage-700 dark:text-sage-200 animate-fadein">
          You missed yesterday — that's okay. <strong>Don't miss twice.</strong> Start fresh today.
        </div>
      )}

      {/* Three headline scores */}
      <section className="grid grid-cols-3 gap-3">
        <ScoreCard label="Core Routine" pct={corePct} tone="sage" />
        <ScoreCard label="Nutrition" pct={nutriPct} tone="sage" onClick={() => onNavigate('nutrition')} />
        <ScoreCard label="Lifestyle" pct={lifePct} tone="gold" />
      </section>

      {/* Today's checklist */}
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle sub="Tap to check off. Workout only counts on workout days.">
            Today's Checklist
          </SectionTitle>
          <TodayRing pct={todayPct(data, settings, today)} />
        </div>
        <DayChecklist dateKey={today} detailed />
      </section>

      {/* Today's workout + quran */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <SectionTitle>Today's Workout</SectionTitle>
          {todaysWorkout ? (
            <div>
              <div className="font-semibold text-sage-900 dark:text-white">
                {todaysWorkout.title}
              </div>
              <p className="text-sm text-sage-500 dark:text-sage-400">{todaysWorkout.focus}</p>
              <ul className="mt-3 space-y-1 text-sm text-sage-600 dark:text-sage-300">
                {todaysWorkout.exercises.slice(0, 4).map((e) => (
                  <li key={e.name} className="flex justify-between gap-3">
                    <span>{e.name}</span>
                    <span className="flex-none tabular-nums text-sage-400">
                      {e.sets} × {e.reps}
                    </span>
                  </li>
                ))}
                <li className="text-sage-400">+ {todaysWorkout.exercises.length - 4} more · walk {walkTarget}</li>
              </ul>
              <button className="btn-ghost mt-3 px-0 text-sage-600 dark:text-sage-300" onClick={() => onNavigate('workout')}>
                See full workout →
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-sage-300 dark:border-white/15 p-5 text-center">
              <p className="font-medium text-sage-700 dark:text-sage-200">Rest day</p>
              <p className="text-sm text-sage-500 dark:text-sage-400 mt-1">
                Optional light walk — {walkTarget}.
              </p>
            </div>
          )}
        </section>

        <section className="card p-5">
          <SectionTitle>Today's Quran</SectionTitle>
          <div className="space-y-1">
            <div className="text-sm text-sage-500 dark:text-sage-400">Memorizing</div>
            <div className="font-semibold text-sage-900 dark:text-white">
              {surah.name}{' '}
              <span className="font-normal text-sage-400">· from ayah {surah.ayahCount >= q.currentAyah ? q.currentAyah : surah.ayahCount}</span>
            </div>
            <p className="text-sm text-sage-600 dark:text-sage-300 mt-1">
              Target: ~{settings.dailyAyahTarget} new ayat (15–20 min) + review previous (10–15 min).
            </p>
          </div>
          <button className="btn-ghost mt-3 px-0 text-sage-600 dark:text-sage-300" onClick={() => onNavigate('quran')}>
            Open Quran tracker →
          </button>
        </section>
      </div>

      {/* Nutrition card */}
      <NutritionDashCard onNavigate={onNavigate} />

      {/* Progress */}
      <section className="card p-5">
        <SectionTitle>Progress</SectionTitle>
        <div className="space-y-4">
          <LabeledBar label="Today" pct={todayPct(data, settings, today)} />
          <LabeledBar label="This week" pct={weeklyPct(data, settings, today)} />
          <LabeledBar label="This month" pct={monthlyPct(data, settings, today)} tone="muted" />
          <LabeledBar label={settings.challengeName} pct={overallPct(data, settings, today)} tone="gold" />
        </div>
      </section>

      {/* Stats grid */}
      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Current streak" value={`${streak}d`} accent sub={streak > 0 ? 'keep going' : 'start today'} />
          <StatCard label="Best streak" value={`${bestStreak(data, settings, today)}d`} />
          <StatCard label="Days completed" value={daysCompleted(data, settings, today)} />
          <StatCard label="Days remaining" value={daysRemaining(settings, today)} />
          <StatCard label="Fajr in mosque" value={`${habitPct(data, settings, today, 'fajrMosque')}%`} />
          <StatCard label="Workout" value={`${habitPct(data, settings, today, 'workout')}%`} />
          <StatCard label="Quran" value={`${quranPct(data, settings, today)}%`} />
          <StatCard label="Overall" value={`${overallPct(data, settings, today)}%`} />
        </div>
      </section>

      <Milestones />
      <Calendar />
    </div>
  )
}

function ScoreCard({
  label,
  pct,
  tone,
  onClick,
}: {
  label: string
  pct: number
  tone: 'sage' | 'gold'
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`card p-4 text-left ${onClick ? 'transition-colors hover:border-sage-300 dark:hover:border-white/20' : 'cursor-default'}`}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-sage-500 dark:text-sage-400">
        {label}
      </div>
      <div
        className={`mt-1 mb-2 text-2xl font-semibold tabular-nums ${
          tone === 'gold' ? 'text-gold-500' : 'text-sage-600 dark:text-sage-300'
        }`}
      >
        {pct}%
      </div>
      <ProgressBar pct={pct} size="sm" tone={tone} />
    </button>
  )
}

function NutritionDashCard({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { data, settings, today, getNutrition } = useApp()
  const nut = getNutrition(today)
  const pct = nutritionTodayPct(data, settings, today)
  const r = nutritionDayRatio(data, settings, today)
  const meals: { key: 'breakfast' | 'snack' | 'lunch' | 'dinner'; label: string }[] = [
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'snack', label: 'Snack' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' },
  ]
  const ml = nut.waterMl ?? 0

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle sub="Separate from your core score.">Nutrition</SectionTitle>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums text-sage-600 dark:text-sage-300">
            {pct}%
          </div>
          <div className="text-xs text-sage-400">{r.completed}/7 items</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {meals.map((m) => (
          <span
            key={m.key}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${
              nut.checklist[m.key]
                ? 'bg-sage-500 text-white'
                : 'bg-sage-50 dark:bg-white/5 text-sage-500 dark:text-sage-400'
            }`}
          >
            {nut.checklist[m.key] ? '✓' : '○'} {m.label}
          </span>
        ))}
        <span
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${
            proteinDone(nut, settings)
              ? 'bg-sage-500 text-white'
              : 'bg-sage-50 dark:bg-white/5 text-sage-500 dark:text-sage-400'
          }`}
        >
          {proteinDone(nut, settings) ? '✓' : '○'} Protein
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-sage-500 dark:text-sage-400">Water</span>
          <span className="font-medium tabular-nums text-sage-600 dark:text-sage-300">
            {(ml / 1000).toFixed(1)} / {(settings.waterTargetMl / 1000).toFixed(1)} L
          </span>
        </div>
        <ProgressBar
          pct={settings.waterTargetMl > 0 ? (ml / settings.waterTargetMl) * 100 : 0}
          tone={waterDone(nut, settings) ? 'sage' : 'muted'}
        />
      </div>

      <button
        className="btn-ghost mt-3 px-0 text-sage-600 dark:text-sage-300"
        onClick={() => onNavigate('nutrition')}
      >
        Open Nutrition →
      </button>
    </section>
  )
}

function TodayRing({ pct }: { pct: number }) {
  const r = 20
  const c = 2 * Math.PI * r
  const off = c - (Math.max(0, Math.min(100, pct)) / 100) * c
  return (
    <div className="relative h-14 w-14 flex-none">
      <svg viewBox="0 0 48 48" className="h-14 w-14 -rotate-90">
        <circle cx="24" cy="24" r={r} className="fill-none stroke-sage-100 dark:stroke-white/10" strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r={r}
          className="fill-none stroke-sage-500 transition-[stroke-dashoffset] duration-500"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums text-sage-700 dark:text-sage-200">
        {pct}%
      </span>
    </div>
  )
}
