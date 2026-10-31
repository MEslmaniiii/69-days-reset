import type { AppData, DayNutrition, Habits, Settings, Weekday } from '../types'
import { CORE_HABIT_KEYS } from '../types'
import {
  addDays,
  clampKey,
  diffDays,
  fromKey,
  rangeKeys,
  weekEnd,
  weekStart,
} from './dates'

export type DayStatus = 'future' | 'complete' | 'partial' | 'missed' | 'today'

export function isWorkoutDay(key: string, settings: Settings): boolean {
  const wd = fromKey(key).getDay() as Weekday
  return settings.workoutDays.includes(wd)
}

/** Core habits that apply to a given date (workout only on workout days). */
export function applicableKeys(key: string, settings: Settings): (keyof Habits)[] {
  return CORE_HABIT_KEYS.filter((k) => {
    if (k === 'workout') return isWorkoutDay(key, settings)
    return true
  })
}

export interface Ratio {
  completed: number
  total: number
  ratio: number // 0..1
}

export function dayRatio(data: AppData, settings: Settings, key: string): Ratio {
  const keys = applicableKeys(key, settings)
  const rec = data.days[key]
  const completed = keys.filter((k) => rec?.habits?.[k]).length
  const total = keys.length
  return { completed, total, ratio: total === 0 ? 0 : completed / total }
}

export function isCompleteDay(data: AppData, settings: Settings, key: string): boolean {
  const r = dayRatio(data, settings, key)
  return r.total > 0 && r.completed === r.total
}

export function dayStatus(
  data: AppData,
  settings: Settings,
  key: string,
  today: string,
): DayStatus {
  if (key > today) return 'future'
  const r = dayRatio(data, settings, key)
  if (r.ratio >= 1) return 'complete'
  if (r.ratio > 0) return 'partial'
  // ratio === 0
  if (key === today) return 'today'
  return 'missed'
}

/** 1-based day number within the challenge for a given date (can be <1 or >60). */
export function dayNumber(settings: Settings, key: string): number {
  return diffDays(settings.startDate, key) + 1
}

export function totalDays(settings: Settings): number {
  return diffDays(settings.startDate, settings.endDate) + 1
}

/** Elapsed in-range date keys: from start to min(today, end). */
export function elapsedKeys(settings: Settings, today: string): string[] {
  if (today < settings.startDate) return []
  const end = today < settings.endDate ? today : settings.endDate
  return rangeKeys(settings.startDate, end)
}

interface Aggregate {
  completed: number
  applicable: number
  pct: number
}

function aggregate(data: AppData, settings: Settings, keys: string[]): Aggregate {
  let completed = 0
  let applicable = 0
  for (const key of keys) {
    const r = dayRatio(data, settings, key)
    completed += r.completed
    applicable += r.total
  }
  return {
    completed,
    applicable,
    pct: applicable === 0 ? 0 : Math.round((completed / applicable) * 100),
  }
}

/** Completion % for a single day. */
export function todayPct(data: AppData, settings: Settings, today: string): number {
  return Math.round(dayRatio(data, settings, today).ratio * 100)
}

export function weeklyPct(data: AppData, settings: Settings, today: string): number {
  const ws = clampKey(weekStart(today), settings.startDate, settings.endDate)
  const we = clampKey(weekEnd(today), settings.startDate, settings.endDate)
  const end = we < today ? we : today
  if (end < ws) return 0
  return aggregate(data, settings, rangeKeys(ws, end)).pct
}

export function monthlyPct(data: AppData, settings: Settings, today: string): number {
  const d = fromKey(today)
  const first = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  const ms = clampKey(first, settings.startDate, settings.endDate)
  const end = today < settings.endDate ? today : settings.endDate
  if (end < ms) return 0
  return aggregate(data, settings, rangeKeys(ms, end)).pct
}

export function overallPct(data: AppData, settings: Settings, today: string): number {
  return aggregate(data, settings, elapsedKeys(settings, today)).pct
}

/** Percentage for a specific habit over elapsed days (respecting applicability). */
export function habitPct(
  data: AppData,
  settings: Settings,
  today: string,
  habit: keyof Habits,
): number {
  let done = 0
  let applicable = 0
  for (const key of elapsedKeys(settings, today)) {
    if (habit === 'workout' && !isWorkoutDay(key, settings)) continue
    applicable++
    if (data.days[key]?.habits?.[habit]) done++
  }
  return applicable === 0 ? 0 : Math.round((done / applicable) * 100)
}

/** Quran Wird completion % over elapsed days. */
export function quranPct(data: AppData, settings: Settings, today: string): number {
  return habitPct(data, settings, today, 'quranWird')
}

/** Current streak of complete days ending at today (or yesterday if today isn't done yet). */
export function currentStreak(data: AppData, settings: Settings, today: string): number {
  if (today < settings.startDate) return 0
  let cursor = today > settings.endDate ? settings.endDate : today
  // Don't penalize an in-progress today: if today isn't complete, start at yesterday.
  if (!isCompleteDay(data, settings, cursor)) {
    cursor = addDays(cursor, -1)
  }
  let streak = 0
  while (cursor >= settings.startDate && isCompleteDay(data, settings, cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function bestStreak(data: AppData, settings: Settings, today: string): number {
  let best = 0
  let run = 0
  for (const key of elapsedKeys(settings, today)) {
    if (isCompleteDay(data, settings, key)) {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  return best
}

export function daysCompleted(data: AppData, settings: Settings, today: string): number {
  return elapsedKeys(settings, today).filter((k) => isCompleteDay(data, settings, k)).length
}

export function daysRemaining(settings: Settings, today: string): number {
  if (today >= settings.endDate) return 0
  if (today < settings.startDate) return totalDays(settings)
  return diffDays(today, settings.endDate)
}

/** Was yesterday missed (0 completion, in range)? Used for the gentle "don't miss twice" nudge. */
export function missedYesterday(data: AppData, settings: Settings, today: string): boolean {
  const y = addDays(today, -1)
  if (y < settings.startDate || y > settings.endDate) return false
  const r = dayRatio(data, settings, y)
  return r.total > 0 && r.completed === 0
}

/** Consecutive-day streak for a single habit (workout days skip-aware). */
export function habitStreak(
  data: AppData,
  settings: Settings,
  today: string,
  habit: keyof Habits,
): number {
  if (today < settings.startDate) return 0
  let cursor = today > settings.endDate ? settings.endDate : today
  const done = (k: string) => !!data.days[k]?.habits?.[habit]
  // Workout streak: only count workout days; a non-workout day neither breaks nor extends.
  if (habit === 'workout') {
    let streak = 0
    while (cursor >= settings.startDate) {
      if (isWorkoutDay(cursor, settings)) {
        if (done(cursor)) streak++
        else break
      }
      cursor = addDays(cursor, -1)
    }
    return streak
  }
  if (!done(cursor)) cursor = addDays(cursor, -1)
  let streak = 0
  while (cursor >= settings.startDate && done(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Count of elapsed days where a habit was done. */
export function habitDays(
  data: AppData,
  settings: Settings,
  today: string,
  habit: keyof Habits,
): number {
  return elapsedKeys(settings, today).filter((k) => data.days[k]?.habits?.[habit]).length
}

export interface WeekRangeStats {
  fajr: number
  workout: number
  wird: number
  french: number
  aiLearning: number
  overall: number
}

/** Stats for the week containing `today` (clamped to challenge & elapsed). */
export function weekStats(data: AppData, settings: Settings, today: string): WeekRangeStats {
  const ws = clampKey(weekStart(today), settings.startDate, settings.endDate)
  const weEnd = clampKey(weekEnd(today), settings.startDate, settings.endDate)
  const end = weEnd < today ? weEnd : today
  const keys = end < ws ? [] : rangeKeys(ws, end)

  function pct(habit: keyof Habits): number {
    let done = 0
    let app = 0
    for (const k of keys) {
      if (habit === 'workout' && !isWorkoutDay(k, settings)) continue
      app++
      if (data.days[k]?.habits?.[habit]) done++
    }
    return app === 0 ? 0 : Math.round((done / app) * 100)
  }

  return {
    fajr: pct('fajrMosque'),
    workout: pct('workout'),
    wird: pct('quranWird'),
    french: pct('french'),
    aiLearning: pct('aiLearning'),
    overall: aggregate(data, settings, keys).pct,
  }
}

// ============================================================
//                        NUTRITION
// ============================================================

/** A "good nutrition day" for streak purposes = at least 70% of items done. */
export const NUTRITION_GOOD_RATIO = 0.7

/** The seven scored nutrition items for a given day. */
export type NutritionItemKey =
  | 'breakfast'
  | 'snack'
  | 'lunch'
  | 'dinner'
  | 'protein'
  | 'water'
  | 'noSugaryDrinks'

export const NUTRITION_ITEM_KEYS: NutritionItemKey[] = [
  'breakfast',
  'snack',
  'lunch',
  'dinner',
  'protein',
  'water',
  'noSugaryDrinks',
]

export const NUTRITION_ITEM_LABELS: Record<NutritionItemKey, string> = {
  breakfast: 'Healthy Breakfast',
  snack: 'Healthy Work Snack',
  lunch: 'Balanced Lunch',
  dinner: 'Healthy Dinner',
  protein: 'Protein Target',
  water: 'Water Target',
  noSugaryDrinks: 'No Sugary Drinks',
}

export function waterDone(nut: DayNutrition | undefined, settings: Settings): boolean {
  return (nut?.waterMl ?? 0) >= settings.waterTargetMl
}

export function proteinDone(nut: DayNutrition | undefined, settings: Settings): boolean {
  if (settings.nutritionMode === 'detailed') {
    return (nut?.proteinGrams ?? 0) >= settings.proteinTargetMin
  }
  return !!nut?.checklist?.protein
}

/** Whether a single scored nutrition item is satisfied for a day. */
export function nutritionItemDone(
  nut: DayNutrition | undefined,
  settings: Settings,
  item: NutritionItemKey,
): boolean {
  if (item === 'water') return waterDone(nut, settings)
  if (item === 'protein') return proteinDone(nut, settings)
  return !!nut?.checklist?.[item]
}

export function nutritionDayRatio(data: AppData, settings: Settings, key: string): Ratio {
  const nut = data.days[key]?.nutrition
  const completed = NUTRITION_ITEM_KEYS.filter((k) => nutritionItemDone(nut, settings, k)).length
  const total = NUTRITION_ITEM_KEYS.length
  return { completed, total, ratio: completed / total }
}

export function isGoodNutritionDay(data: AppData, settings: Settings, key: string): boolean {
  return nutritionDayRatio(data, settings, key).ratio >= NUTRITION_GOOD_RATIO
}

function nutritionAggregate(data: AppData, settings: Settings, keys: string[]): number {
  let completed = 0
  let total = 0
  for (const key of keys) {
    const r = nutritionDayRatio(data, settings, key)
    completed += r.completed
    total += r.total
  }
  return total === 0 ? 0 : Math.round((completed / total) * 100)
}

export function nutritionTodayPct(data: AppData, settings: Settings, today: string): number {
  return Math.round(nutritionDayRatio(data, settings, today).ratio * 100)
}

export function nutritionWeeklyPct(data: AppData, settings: Settings, today: string): number {
  const ws = clampKey(weekStart(today), settings.startDate, settings.endDate)
  const we = clampKey(weekEnd(today), settings.startDate, settings.endDate)
  const end = we < today ? we : today
  if (end < ws) return 0
  return nutritionAggregate(data, settings, rangeKeys(ws, end))
}

export function nutritionMonthlyPct(data: AppData, settings: Settings, today: string): number {
  const d = fromKey(today)
  const first = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  const ms = clampKey(first, settings.startDate, settings.endDate)
  const end = today < settings.endDate ? today : settings.endDate
  if (end < ms) return 0
  return nutritionAggregate(data, settings, rangeKeys(ms, end))
}

export function nutritionOverallPct(data: AppData, settings: Settings, today: string): number {
  return nutritionAggregate(data, settings, elapsedKeys(settings, today))
}

/** Adherence % for a single nutrition item over elapsed days. */
export function nutritionItemPct(
  data: AppData,
  settings: Settings,
  today: string,
  item: NutritionItemKey,
): number {
  const keys = elapsedKeys(settings, today)
  if (keys.length === 0) return 0
  let done = 0
  for (const key of keys) {
    if (nutritionItemDone(data.days[key]?.nutrition, settings, item)) done++
  }
  return Math.round((done / keys.length) * 100)
}

export function nutritionCurrentStreak(data: AppData, settings: Settings, today: string): number {
  if (today < settings.startDate) return 0
  let cursor = today > settings.endDate ? settings.endDate : today
  if (!isGoodNutritionDay(data, settings, cursor)) cursor = addDays(cursor, -1)
  let streak = 0
  while (cursor >= settings.startDate && isGoodNutritionDay(data, settings, cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function nutritionBestStreak(data: AppData, settings: Settings, today: string): number {
  let best = 0
  let run = 0
  for (const key of elapsedKeys(settings, today)) {
    if (isGoodNutritionDay(data, settings, key)) {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  return best
}

/** Weighted Overall Lifestyle % from already-computed core & nutrition pcts. */
export function lifestylePct(corePct: number, nutritionPct: number, settings: Settings): number {
  const cw = Math.max(0, settings.coreWeight)
  const nw = Math.max(0, settings.nutritionWeight)
  const tot = cw + nw
  if (tot === 0) return Math.round((corePct + nutritionPct) / 2)
  return Math.round((corePct * cw + nutritionPct * nw) / tot)
}

export interface NutritionWeekStats {
  breakfast: number
  snack: number
  dinner: number
  protein: number
  water: number
  overall: number
}

export function nutritionWeekStats(
  data: AppData,
  settings: Settings,
  today: string,
): NutritionWeekStats {
  const ws = clampKey(weekStart(today), settings.startDate, settings.endDate)
  const weEnd = clampKey(weekEnd(today), settings.startDate, settings.endDate)
  const end = weEnd < today ? weEnd : today
  const keys = end < ws ? [] : rangeKeys(ws, end)

  function pct(item: NutritionItemKey): number {
    if (keys.length === 0) return 0
    let done = 0
    for (const k of keys) {
      if (nutritionItemDone(data.days[k]?.nutrition, settings, item)) done++
    }
    return Math.round((done / keys.length) * 100)
  }

  return {
    breakfast: pct('breakfast'),
    snack: pct('snack'),
    dinner: pct('dinner'),
    protein: pct('protein'),
    water: pct('water'),
    overall: nutritionAggregate(data, settings, keys),
  }
}
