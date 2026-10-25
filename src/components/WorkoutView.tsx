import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { WORKOUTS } from '../lib/defaults'
import type { Exercise, WorkoutDay } from '../lib/defaults'
import { isWorkoutDay } from '../lib/progress'
import { weekdayShort } from '../lib/dates'
import type { Weekday } from '../types'
import { SectionTitle } from './ui'

/** Which workout template applies to a given date, by position within workoutDays. */
export function workoutForDate(dateKey: string, workoutDays: Weekday[]): WorkoutDay | null {
  const sorted = [...workoutDays].sort((a, b) => a - b)
  const wd = new Date(
    Number(dateKey.slice(0, 4)),
    Number(dateKey.slice(5, 7)) - 1,
    Number(dateKey.slice(8, 10)),
  ).getDay() as Weekday
  const idx = sorted.indexOf(wd)
  if (idx === -1) return null
  return WORKOUTS[idx % WORKOUTS.length]
}

export function WorkoutView() {
  const { settings, today } = useApp()
  const todaysWorkout = workoutForDate(today, settings.workoutDays)
  const [openId, setOpenId] = useState<string>(todaysWorkout?.id ?? WORKOUTS[0].id)

  return (
    <div className="space-y-6">
      {/* Today */}
      <section className="card p-5">
        <SectionTitle sub={isWorkoutDay(today, settings) ? 'Keep it 30–45 min. Finish with your walk.' : undefined}>
          Today's Workout
        </SectionTitle>
        {todaysWorkout ? (
          <WorkoutCard workout={todaysWorkout} highlight />
        ) : (
          <div className="rounded-xl border border-dashed border-sage-300 dark:border-white/15 p-6 text-center">
            <p className="text-sage-700 dark:text-sage-200 font-medium">Rest day</p>
            <p className="text-sm text-sage-500 dark:text-sage-400 mt-1">
              Optional light walking on the pad. Recovery matters as much as training.
            </p>
          </div>
        )}
      </section>

      {/* Home setup */}
      <section className="card p-5">
        <h3 className="font-semibold text-sage-900 dark:text-white">Home setup — no gym needed</h3>
        <p className="text-sm text-sage-600 dark:text-sage-300 mt-2 leading-relaxed">
          Every session is designed for your living room. All you need is:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-sage-600 dark:text-sage-300">
          <li>• A pair of dumbbells (even light ones)</li>
          <li>• A chair, couch, or bed (split squats, step-ups, incline push-ups)</li>
          <li>• A mat or soft floor (core work, floor press, glute bridge)</li>
          <li>• Your walking pad for warm-ups and the finisher</li>
        </ul>
        <p className="text-sm text-sage-600 dark:text-sage-300 mt-2 leading-relaxed">
          No machines, no barbell, no bench — just swap in furniture where a gym would use equipment.
        </p>
      </section>

      {/* Technique note */}
      <section className="card p-5">
        <h3 className="font-semibold text-sage-900 dark:text-white">Making light dumbbells work</h3>
        <p className="text-sm text-sage-600 dark:text-sage-300 mt-2 leading-relaxed">
          With ~5 kg dumbbells you build the stimulus through <strong>technique</strong>, not load.
          Use higher reps, a slow 3-second lowering phase (eccentric), pauses at the hardest point,
          and single-arm / single-leg variations so each limb carries the full weight. Controlled
          tempo &gt; heavier weight.
        </p>
      </section>

      {/* Full program */}
      <section className="card p-5">
        <SectionTitle sub="Your 4-day split. Each session covers the whole body across the week.">
          Weekly Program
        </SectionTitle>
        <div className="mb-4 flex flex-wrap gap-2">
          {WORKOUTS.map((w, i) => {
            const sorted = [...settings.workoutDays].sort((a, b) => a - b)
            const dayLabel = sorted[i] !== undefined ? weekdayShort(dayKeyForWeekday(sorted[i])) : ''
            return (
              <button
                key={w.id}
                onClick={() => setOpenId(w.id)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                  openId === w.id
                    ? 'bg-sage-600 text-white'
                    : 'bg-sage-100 dark:bg-white/5 text-sage-700 dark:text-sage-200 hover:bg-sage-200 dark:hover:bg-white/10'
                }`}
              >
                {dayLabel && <span className="opacity-70 mr-1">{dayLabel}</span>}
                {w.title}
              </button>
            )
          })}
        </div>
        {WORKOUTS.filter((w) => w.id === openId).map((w) => (
          <WorkoutCard key={w.id} workout={w} />
        ))}
      </section>
    </div>
  )
}

// Build a date key for an arbitrary weekday just to render its short name
function dayKeyForWeekday(wd: Weekday): string {
  // 2026-10-24 is a Saturday (getDay 6). Find the matching weekday in that week.
  const base = new Date(2026, 9, 24) // Sat
  const diff = wd - 6
  const d = new Date(base)
  d.setDate(d.getDate() + diff)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function WorkoutCard({ workout, highlight }: { workout: WorkoutDay; highlight?: boolean }) {
  return (
    <div className={highlight ? '' : ''}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-sage-900 dark:text-white">{workout.title}</h3>
        <span className="text-xs text-sage-500 dark:text-sage-400">{workout.focus}</span>
      </div>
      <p className="mt-2 rounded-lg bg-sage-50 dark:bg-white/5 px-3 py-2 text-sm text-sage-600 dark:text-sage-300">
        <span className="font-medium">Warm-up: </span>
        {workout.warmup}
      </p>

      <div className="mt-3 divide-y divide-sage-100 dark:divide-white/5">
        {workout.exercises.map((ex) => (
          <ExerciseRow key={ex.name} ex={ex} />
        ))}
      </div>

      <p className="mt-3 rounded-lg bg-sage-50 dark:bg-white/5 px-3 py-2 text-sm text-sage-600 dark:text-sage-300">
        <span className="font-medium">Finish: </span>
        {workout.finisher}
      </p>
    </div>
  )
}

function ExerciseRow({ ex }: { ex: Exercise }) {
  return (
    <div className="py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-medium text-sage-900 dark:text-white">{ex.name}</span>
        <a
          href={ex.youtube}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-sage-600 dark:text-sage-300 hover:underline inline-flex items-center gap-1"
        >
          Watch tutorial
          <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
            <path d="M12 3h5v5h-2V6.4l-6.3 6.3-1.4-1.4L13.6 5H12V3zM5 5h3v2H6v8h8v-2h2v3a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
          </svg>
        </a>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-sage-500 dark:text-sage-400">
        <span>
          <span className="font-semibold text-sage-700 dark:text-sage-300">{ex.sets}</span> ×{' '}
          {ex.reps}
        </span>
        <span>{ex.rest} rest</span>
        <span>{ex.target}</span>
        <span>{ex.equipment}</span>
      </div>
      {ex.cue && (
        <p className="mt-1 text-xs italic text-sage-400 dark:text-sage-500">{ex.cue}</p>
      )}
    </div>
  )
}
