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
  const touched = useRef(false)

  const logMap = useMemo(() => buildLogMap(data?.logs ?? []), [data?.logs])
  const lightDays = useMemo(() => new Set(data?.profile.lightDays ?? []), [data?.profile.lightDays])

  // record last-active once per mount
  useEffect(() => {
    if (data?.profile && !touched.current) {
      touched.current = true
      void saveProfile({ lastActiveAt: new Date().toISOString() })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.profile?.id])

  if (!data) return null
  const { profile, habits } = data
  const today = todayKey(profile.schedule?.timezone)
  const isLightToday = lightDays.has(today)

  // Classify what's on today.
  const dueAll = habitsDueOn(habits, today)
  const counting = dueAll.filter(
    (h) => !h.optional && h.frequency !== 'weekly' && (!isLightToday || h.lightDay)
  )
  const deferred = isLightToday
    ? dueAll.filter((h) => !h.optional && h.frequency !== 'weekly' && !h.lightDay)
    : []
  const optional = dueAll.filter((h) => h.optional)
  const weekly = dueAll.filter((h) => !h.optional && h.frequency === 'weekly')

  const dayPct = dayProgressPct(habits, logMap, today, lightDays)
  const weekPct = weekProgressPct(habits, logMap, today, lightDays)
  const overallPct = overallProgressPct(habits, logMap, profile.campaignStart || today, today, lightDays)
  const streak = currentStreak(habits, logMap, today, lightDays)
  const best = bestStreak(habits, logMap, profile.campaignStart || today, today, lightDays)
  const done = daysCompleted(habits, logMap, profile.campaignStart || today, today, lightDays)
  const daysLeft = Math.max(0, daysBetweenInclusive(today, profile.campaignEnd) - 1)

  const firstName = profile.name.split(' ')[0] || 'there'

  const toggleLight = () => {
    const base = profile.lightDays ?? []
    const next = isLightToday ? base.filter((d) => d !== today) : [...base, today]
    void saveProfile({ lightDays: next })
    track('light_day_toggled', { on: !isLightToday }, user?.id)
  }

  const logHabit = (h: Habit) => (l: HabitLog) => {
    void setLog(l)
    if (l.completed) track('habit_completed', { category: h.category }, user?.id)
  }

  const effTarget = (h: Habit): number | undefined =>
    isLightToday && h.lightDay && h.lightTargetValue ? h.lightTargetValue : h.targetValue

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
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-sage-400 dark:text-sage-500">
            {isLightToday
              ? 'يوم خفيف — الأساسيات فقط تُحتسب، والباقي مؤجَّل بلا تقصير.'
              : 'يوم عادي'}
          </span>
          <button
            onClick={toggleLight}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              isLightToday
                ? 'bg-gold-500/15 text-gold-500'
                : 'bg-sage-100 text-sage-600 dark:bg-white/5 dark:text-sage-300'
            }`}
          >
            {isLightToday ? '✓ يوم خفيف' : 'تفعيل يوم خفيف'}
          </button>
        </div>
      </div>

      {/* Today's habits (counting) */}
      <section>
        <SectionTitle sub={counting.length ? `${counting.length} أساسية اليوم` : undefined}>
          Today
        </SectionTitle>
        {counting.length === 0 ? (
          <div className="card p-5 text-sm text-sage-500">
            No core habits scheduled today.{' '}
            <Link to="/app/habits" className="text-sage-700 underline dark:text-sage-200">
              Manage your habits
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-2.5">
            {counting.map((h) => (
              <HabitRow key={h.id} habit={h} target={effTarget(h)} log={logMap.get(logMapKey(h.id, today))} onLog={logHabit(h)} date={today} />
            ))}
          </div>
        )}
      </section>

      {/* Deferred on a light day — shown, never a miss */}
      {deferred.length > 0 && (
        <section>
          <SectionTitle sub="يوم خفيف: مؤجَّلة ولا تُحتسب فشلًا — سجّلها لو حبيت.">مؤجَّل اليوم</SectionTitle>
          <div className="space-y-2.5">
            {deferred.map((h) => (
              <HabitRow key={h.id} habit={h} target={h.targetValue} log={logMap.get(logMapKey(h.id, today))} onLog={logHabit(h)} date={today} bonus />
            ))}
          </div>
        </section>
      )}

      {/* Optional / protected — never counts toward %, streaks */}
      {optional.length > 0 && (
        <section>
          <SectionTitle sub="اختياري — لا يُحتسب فشلًا ولا يقطع سلسلتك.">اختياري ومحمي</SectionTitle>
          <div className="space-y-2.5">
            {optional.map((h) => (
              <HabitRow key={h.id} habit={h} target={h.targetValue} log={logMap.get(logMapKey(h.id, today))} onLog={logHabit(h)} date={today} bonus />
            ))}
          </div>
        </section>
      )}

      {/* Weekly — a week-level target, not a daily obligation */}
      {weekly.length > 0 && (
        <section>
          <SectionTitle sub="هدف أسبوعي — نفّذه في أي يوم مناسب.">هذا الأسبوع</SectionTitle>
          <div className="space-y-2.5">
            {weekly.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                target={h.targetValue}
                log={logMap.get(logMapKey(h.id, today))}
                onLog={logHabit(h)}
                date={today}
                hintOverride={`${h.weeklyTarget ?? 1}× / أسبوع`}
              />
            ))}
          </div>
        </section>
      )}

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
  target,
  bonus,
  hintOverride,
}: {
  habit: Habit
  log: HabitLog | undefined
  onLog: (log: HabitLog) => void
  date: string
  target?: number
  bonus?: boolean
  hintOverride?: string
}) {
  const hint = hintOverride ?? CATEGORY_LABELS[habit.category]
  if (habit.measurable && target) {
    const value = log?.value ?? 0
    const pct = Math.min(100, Math.round((value / target) * 100))
    return (
      <div className="card p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div dir="auto" className="text-sm font-medium text-sage-800 dark:text-sage-100">{habit.name}</div>
            <div className="text-xs text-sage-400">{hint}</div>
          </div>
          <div className="flex items-center gap-1 text-sm tabular-nums text-sage-600 dark:text-sage-300">
            <input
              type="number"
              className="field w-20 text-right"
              value={value || ''}
              placeholder="0"
              onChange={(e) => {
                const v = e.target.value === '' ? 0 : Number(e.target.value)
                onLog({ habitId: habit.id, date, value: v, completed: v >= target })
              }}
            />
            <span className="text-sage-400">/ {target} {habit.unit}</span>
          </div>
        </div>
        <ProgressBar pct={pct} tone={bonus ? 'gold' : 'sage'} />
      </div>
    )
  }
  return (
    <Checkbox
      checked={Boolean(log?.completed)}
      label={habit.name}
      hint={hint}
      bonus={bonus}
      onChange={() => onLog({ habitId: habit.id, date, completed: !log?.completed })}
    />
  )
}
