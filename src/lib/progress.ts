// Generic progress calculations over a dynamic set of habits + logs.
//
// Tracking rules honored here:
//  - `optional` habits are shown and loggable, but NEVER count toward the day's
//    %, streaks, or weekly consistency (skipping them is not a "miss").
//  - `weekly` habits are a week-level target, not a daily obligation, so they
//    don't drag a single day's % down when not done that day.
//  - On a "light day" only light-day habits are expected; everything else is
//    deferred — shown but not counted, and never a miss.

import type { Habit, HabitLog, Weekday } from '../types'
import { addDays, diffDays, fromKey, todayKey, weekStart } from './dates'

export function logMapKey(habitId: string, date: string): string {
  return `${habitId}|${date}`
}

export function buildLogMap(logs: HabitLog[]): Map<string, HabitLog> {
  const m = new Map<string, HabitLog>()
  for (const l of logs) m.set(logMapKey(l.habitId, l.date), l)
  return m
}

export function isActive(h: Habit): boolean {
  return h.isActive && !h.isPaused
}

/** Is this habit "due" (expected / available) on the given date? Used for DISPLAY. */
export function isHabitDueOn(h: Habit, dateKey: string): boolean {
  if (!isActive(h)) return false
  const wd = fromKey(dateKey).getDay() as Weekday
  switch (h.frequency) {
    case 'daily':
      return true
    case 'custom':
      return h.days.includes(wd)
    case 'weekly':
      // weekly-target habits can be done any day; always "available".
      return true
    default:
      return true
  }
}

export function habitsDueOn(habits: Habit[], dateKey: string): Habit[] {
  return habits
    .filter((h) => isHabitDueOn(h, dateKey))
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * Habits that COUNT toward the day's completion on `dateKey`.
 * Excludes optional habits, weekly-target habits (scored per-week instead), and
 * — on a light day — any habit not marked for light days.
 */
export function countingHabitsOn(
  habits: Habit[],
  dateKey: string,
  isLightDay = false
): Habit[] {
  return habitsDueOn(habits, dateKey).filter((h) => {
    if (h.optional) return false
    if (h.frequency === 'weekly') return false
    if (isLightDay && !h.lightDay) return false
    return true
  })
}

/** Effective target for a measurable habit (reduced target on a light day). */
export function effectiveTarget(h: Habit, useLightTarget: boolean): number | undefined {
  if (useLightTarget && h.lightTargetValue && h.lightTargetValue > 0) {
    return h.lightTargetValue
  }
  return h.targetValue
}

/** Completion fraction (0..1) for one habit on one day. */
export function habitDayFraction(
  h: Habit,
  log: HabitLog | undefined,
  useLightTarget = false
): number {
  if (!log) return 0
  const target = effectiveTarget(h, useLightTarget)
  if (h.measurable && target && target > 0) {
    if (typeof log.value === 'number') {
      return Math.max(0, Math.min(1, log.value / target))
    }
    return log.completed ? 1 : 0
  }
  return log.completed ? 1 : 0
}

/** Overall day progress 0..100 across the habits that count that day. */
export function dayProgressPct(
  habits: Habit[],
  logMap: Map<string, HabitLog>,
  dateKey: string,
  lightDays?: Set<string>
): number {
  const isLight = lightDays?.has(dateKey) ?? false
  const counting = countingHabitsOn(habits, dateKey, isLight)
  if (counting.length === 0) return 0
  let sum = 0
  for (const h of counting) {
    sum += habitDayFraction(h, logMap.get(logMapKey(h.id, dateKey)), isLight && !!h.lightDay)
  }
  return Math.round((sum / counting.length) * 100)
}

/** A day "counts" as complete when progress >= threshold (default 80%). */
export function dayCounts(
  habits: Habit[],
  logMap: Map<string, HabitLog>,
  dateKey: string,
  threshold = 80,
  lightDays?: Set<string>
): boolean {
  const isLight = lightDays?.has(dateKey) ?? false
  const counting = countingHabitsOn(habits, dateKey, isLight)
  if (counting.length === 0) return false
  return dayProgressPct(habits, logMap, dateKey, lightDays) >= threshold
}

/** Current streak: consecutive completed days counting back from today (or yesterday). */
export function currentStreak(
  habits: Habit[],
  logMap: Map<string, HabitLog>,
  today = todayKey(),
  lightDays?: Set<string>
): number {
  let streak = 0
  // Allow today to be incomplete without breaking the streak until end of day.
  let cursor = dayCounts(habits, logMap, today, 80, lightDays) ? today : addDays(today, -1)
  while (dayCounts(habits, logMap, cursor, 80, lightDays)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Best streak over [start, today]. */
export function bestStreak(
  habits: Habit[],
  logMap: Map<string, HabitLog>,
  start: string,
  today = todayKey(),
  lightDays?: Set<string>
): number {
  let best = 0
  let run = 0
  const total = Math.max(0, diffDays(start, today)) + 1
  let cursor = start
  for (let i = 0; i < total; i++) {
    if (dayCounts(habits, logMap, cursor, 80, lightDays)) {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
    cursor = addDays(cursor, 1)
  }
  return best
}

export function daysCompleted(
  habits: Habit[],
  logMap: Map<string, HabitLog>,
  start: string,
  today = todayKey(),
  lightDays?: Set<string>
): number {
  let count = 0
  const total = Math.max(0, diffDays(start, today)) + 1
  let cursor = start
  for (let i = 0; i < total; i++) {
    if (dayCounts(habits, logMap, cursor, 80, lightDays)) count++
    cursor = addDays(cursor, 1)
  }
  return count
}

/** Average day progress across elapsed days in [start, today]. */
export function overallProgressPct(
  habits: Habit[],
  logMap: Map<string, HabitLog>,
  start: string,
  today = todayKey(),
  lightDays?: Set<string>
): number {
  const total = Math.max(0, diffDays(start, today)) + 1
  if (total <= 0) return 0
  let sum = 0
  let cursor = start
  for (let i = 0; i < total; i++) {
    sum += dayProgressPct(habits, logMap, cursor, lightDays)
    cursor = addDays(cursor, 1)
  }
  return Math.round(sum / total)
}

/** Average day progress for the current week up to `today`. */
export function weekProgressPct(
  habits: Habit[],
  logMap: Map<string, HabitLog>,
  today = todayKey(),
  lightDays?: Set<string>
): number {
  const start = weekStart(today)
  const days = diffDays(start, today) + 1
  let sum = 0
  let cursor = start
  for (let i = 0; i < days; i++) {
    sum += dayProgressPct(habits, logMap, cursor, lightDays)
    cursor = addDays(cursor, 1)
  }
  return Math.round(sum / days)
}

export interface WeekStats {
  weekStart: string
  consistencyPct: number
  bestHabit?: { id: string; name: string; pct: number }
  mostMissed?: { id: string; name: string; pct: number }
  perHabit: { id: string; name: string; pct: number }[]
}

/**
 * Per-habit completion across a given week [weekStartKey .. +6], bounded by today.
 * Optional habits are excluded (never scored / never "missed"). Weekly habits are
 * scored against their weekly target. Light-day deferrals don't count as due.
 */
export function weekStats(
  habits: Habit[],
  logMap: Map<string, HabitLog>,
  weekStartKey: string,
  today = todayKey(),
  lightDays?: Set<string>
): WeekStats {
  const perHabit: { id: string; name: string; pct: number }[] = []
  for (const h of habits) {
    if (!isActive(h) || h.optional) continue

    if (h.frequency === 'weekly') {
      const target = Math.max(1, h.weeklyTarget ?? 1)
      let done = 0
      let cursor = weekStartKey
      for (let i = 0; i < 7; i++) {
        if (cursor <= today) {
          const log = logMap.get(logMapKey(h.id, cursor))
          if (log?.completed) done++
        }
        cursor = addDays(cursor, 1)
      }
      perHabit.push({ id: h.id, name: h.name, pct: Math.round(Math.min(1, done / target) * 100) })
      continue
    }

    let due = 0
    let done = 0
    let cursor = weekStartKey
    for (let i = 0; i < 7; i++) {
      const isLight = lightDays?.has(cursor) ?? false
      const deferred = isLight && !h.lightDay
      if (cursor <= today && isHabitDueOn(h, cursor) && !deferred) {
        due++
        done += habitDayFraction(h, logMap.get(logMapKey(h.id, cursor)), isLight && !!h.lightDay)
      }
      cursor = addDays(cursor, 1)
    }
    if (due > 0) {
      perHabit.push({ id: h.id, name: h.name, pct: Math.round((done / due) * 100) })
    }
  }
  const consistencyPct =
    perHabit.length === 0
      ? 0
      : Math.round(perHabit.reduce((a, b) => a + b.pct, 0) / perHabit.length)
  const sorted = [...perHabit].sort((a, b) => b.pct - a.pct)
  return {
    weekStart: weekStartKey,
    consistencyPct,
    bestHabit: sorted[0],
    mostMissed: sorted[sorted.length - 1],
    perHabit,
  }
}
