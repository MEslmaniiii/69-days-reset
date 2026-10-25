import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../state/DataContext'
import { useAuth } from '../state/AuthContext'
import type { Habit, HabitLog } from '../types'
import { CATEGORY_LABELS } from '../types'
import { todayKey, prettyDate, daysBetweenInclusive } from '../lib/dates'
import {
  buildLogMap,
  dayProgressPct,
  habitsDueOn,
  logMapKey,
  overallProgressPct,
  weekProgressPct,
  currentStreak,
  bestStreak,
  daysCompleted,
} from '../lib/progress'
import { track } from '../lib/analytics'
import { Checkbox, LabeledBar, ProgressBar, SectionTitle, StatCard } from '../components/ui'

export default function Dashboard() {
  const { data, setLog, saveProfile } = useData()
  const { user } = useAuth()
  const today = todayKey()
  const touched = useRef(false)

  // record last-active once per mount
  useEffect(() => {
    if (data?.profile && !touched.current) {
      touched.current = true
      void saveProfile({ lastActiveAt: new Date().toISOString() })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.profile?.id])

  const logMap = useMemo(() => buildLogMap(data?.logs ?? []), [data?.logs])

  if (!data) return null
  const { profile, habits } = data

  const due = habitsDueOn(habits, today)
  const dayPct = dayProgressPct(habits, logMap, today)
  const weekPct = weekProgressPct(habits, logMap, today)
  const overallPct = overallProgressPct(habits, logMap, profile.campaignStart || today, today)
  const streak = currentStreak(habits, logMap, today)
  const best = bestStreak(habits, logMap, profile.campaignStart || today, today)
  const done = daysCompleted(habits, logMap, profile.campaignStart || today, today)
  const daysLeft = Math.max(0, daysBetweenInclusive(today, profile.campaignEnd) - 1)

  const firstName = profile.name.split(' ')[0] || 'there'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">Hello, {firstName}</h1>
        <p className="text-sm text-sage-500 dark:text-sage-400">
          {prettyDate(today)} · {daysLeft} days {profile.campaignName ? `left in your ${profile.campaignName}` : 'until 2027'}
        </p>
      </div>

      {/* Today's progress */}
      <div className="card p-5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-medium text-sage-700 dark:text-sage-200">Today’s progress</span>
          <span className="text-2xl font-semibold tabular-nums text-sage-700 dark:text-sage-200">{dayPct}%</span>
        </div>
        <ProgressBar pct={dayPct} size="lg" />
      </div>

      {/* Today's habits */}
      <section>
        <SectionTitle sub={due.length ? `${due.length} habit${due.length > 1 ? 's' : ''} today` : undefined}>
          Today
        </SectionTitle>
        {due.length === 0 ? (
          <div className="card p-5 text-sm text-sage-500">
            No habits scheduled today.{' '}
            <Link to="/app/habits" className="text-sage-700 underline dark:text-sage-200">
              Manage your habits
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-2.5">
            {due.map((h) => (
              <HabitRow key={h.id} habit={h} log={logMap.get(logMapKey(h.id, today))} onLog={(l) => {
                void setLog(l)
                if (l.completed) track('habit_completed', { category: h.category }, user?.id)
              }} date={today} />
            ))}
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Current streak" value={`${streak}🔥`} accent />
        <StatCard label="Best streak" value={best} />
        <StatCard label="Days completed" value={done} />
      </section>

      <section className="card space-y-4 p-5">
        <LabeledBar label="This week" pct={weekPct} />
        <LabeledBar label="Overall" pct={overallPct} tone="gold" />
      </section>

      {data.milestones.length > 0 && (
        <section>
          <SectionTitle>Milestones</SectionTitle>
          <div className="space-y-2">
            {[...data.milestones]
              .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
              .map((m) => (
                <div key={m.id} className="card flex items-center justify-between p-3 text-sm">
                  <span className={m.achieved ? 'text-sage-400 line-through' : 'text-sage-700 dark:text-sage-200'}>
                    {m.title}
                  </span>
                  <span className="tabular-nums text-sage-400">{m.targetDate}</span>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  )
}

function HabitRow({
  habit,
  log,
  onLog,
  date,
}: {
  habit: Habit
  log: HabitLog | undefined
  onLog: (log: HabitLog) => void
  date: string
}) {
  if (habit.measurable && habit.targetValue) {
    const value = log?.value ?? 0
    const pct = Math.min(100, Math.round((value / habit.targetValue) * 100))
    return (
      <div className="card p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-sage-800 dark:text-sage-100">{habit.name}</div>
            <div className="text-xs text-sage-400">{CATEGORY_LABELS[habit.category]}</div>
          </div>
          <div className="flex items-center gap-1 text-sm tabular-nums text-sage-600 dark:text-sage-300">
            <input
              type="number"
              className="field w-20 text-right"
              value={value || ''}
              placeholder="0"
              onChange={(e) => {
                const v = e.target.value === '' ? 0 : Number(e.target.value)
                onLog({ habitId: habit.id, date, value: v, completed: v >= (habit.targetValue ?? Infinity) })
              }}
            />
            <span className="text-sage-400">/ {habit.targetValue} {habit.unit}</span>
          </div>
        </div>
        <ProgressBar pct={pct} />
      </div>
    )
  }
  return (
    <Checkbox
      checked={Boolean(log?.completed)}
      label={habit.name}
      hint={CATEGORY_LABELS[habit.category]}
      onChange={() =>
        onLog({ habitId: habit.id, date, completed: !log?.completed })
      }
    />
  )
}
