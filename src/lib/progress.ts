// Generic progress calculations over a dynamic set of habits + logs.

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

/** Is this habit "due" (expected) on the given date? */
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

/** Completion fraction (0..1) for one habit on one day. */
export function habitDayFraction(
  h: Habit,
  log: HabitLog | undefined
): number {
  if (!log) return 0
  if (h.measurable && h.targetValue && h.targetValue > 0) {
    if (typeof log.value === 'number') {
      return Math.max(0, Math.min(1, log.value / h.targetValue))
    }
    return log.completed ? 1 : 0
  }
  return log.completed ? 1 : 0
}

/** Overall day progress 0..100 across the habits due that day. */
export function dayProgressPct(
  habits: Habit[],
  logMap: Map<string, HabitLog>,
  dateKey: string
): number {
  const due = habitsDueOn(habits, dateKey)
  if (due.length === 0) return 0
  let sum = 0
  for (const h of due) {
    sum += habitDayFraction(h, logMap.get(logMapKey(h.id, dateKey)))
  }
  return Math.round((sum / due.length) * 100)
}

/** A day "counts" as complete when progress >= threshold (default 80%). */
export function dayCounts(
  habits: Habit[],
  logMap: Map<string, HabitLog>,
  dateKey: string,
  threshold = 80
): boolean {
  const due = habitsDueOn(habits, dateKey)
  if (due.length === 0) return false
  return dayProgressPct(habits, logMap, dateKey) >= threshold
}

/** Current streak: consecutive completed days counting back from today (or yesterday). */
export function currentStreak(
  habits: Habit[],
  logMap: Map<string, HabitLog>,
  today = todayKey()
): number {
  let streak = 0
  // Allow today to be incomplete without breaking the streak until end of day.
  let cursor = dayCounts(habits, logMap, today) ? today : addDays(today, -1)
  while (dayCounts(habits, logMap, cursor)) {
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
  today = todayKey()
): number {
  let best = 0
  let run = 0
  const total = Math.max(0, diffDays(start, today)) + 1
  let cursor = start
  for (let i = 0; i < total; i++) {
    if (dayCounts(habits, logMap, cursor)) {
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
  today = todayKey()
): number {
  let count = 0
  const total = Math.max(0, diffDays(start, today)) + 1
  let cursor = start
  for (let i = 0; i < total; i++) {
    if (dayCounts(habits, logMap, cursor)) count++
    cursor = addDays(cursor, 1)
  }
  return count
}

/** Average day progress across elapsed days in [start, today]. */
export function overallProgressPct(
  habits: Habit[],
  logMap: Map<string, HabitLog>,
  start: string,
  today = todayKey()
): number {
  const total = Math.max(0, diffDays(start, today)) + 1
  if (total <= 0) return 0
  let sum = 0
  let cursor = start
  for (let i = 0; i < total; i++) {
    sum += dayProgressPct(habits, logMap, cursor)
    cursor = addDays(cursor, 1)
  }
  return Math.round(sum / total)
}

/** Average day progress for the current week up to `today`. */
export function weekProgressPct(
  habits: Habit[],
  logMap: Map<string, HabitLog>,
  today = todayKey()
): number {
  const start = weekStart(today)
  const days = diffDays(start, today) + 1
  let sum = 0
  let cursor = start
  for (let i = 0; i < days; i++) {
    sum += dayProgressPct(habits, logMap, cursor)
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

/** Per-habit completion across a given week [weekStartKey .. +6], bounded by today. */
export function weekStats(
  habits: Habit[],
  logMap: Map<string, HabitLog>,
  weekStartKey: string,
  today = todayKey()
): WeekStats {
  const perHabit: { id: string; name: string; pct: number }[] = []
  for (const h of habits) {
    if (!isActive(h)) continue
    let due = 0
    let done = 0
    let cursor = weekStartKey
    for (let i = 0; i < 7; i++) {
      if (cursor <= today && isHabitDueOn(h, cursor)) {
        due++
        done += habitDayFraction(h, logMap.get(logMapKey(h.id, cursor)))
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
