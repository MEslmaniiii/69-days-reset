// Deterministic, rule-based plan generator.
// Used (a) in demo mode and (b) as a safety fallback when the AI API is
// unavailable, so plan generation NEVER hard-fails.

import type {
  GeneratedPlan,
  HabitCategory,
  ProposedHabit,
  ProposedMilestone,
  Schedule,
  TimeOfDay,
  Weekday,
} from '../types'

export interface PlanInput {
  bio?: string
  goals: { title: string; category: HabitCategory; details?: Record<string, string> }[]
  schedule?: Partial<Schedule>
  campaignEnd: string // yyyy-mm-dd
  today: string // yyyy-mm-dd
}

type Template = { daily: ProposedHabit[]; weekly: ProposedHabit[] }

function t(daily: ProposedHabit[], weekly: ProposedHabit[]): Template {
  return { daily, weekly }
}

const CATEGORY_TEMPLATES: Partial<Record<HabitCategory, Template>> = {
  health: t(
    [{ name: 'Steps', category: 'fitness', frequency: 'daily', measurable: true, targetValue: 8000, unit: 'steps' }],
    [{ name: 'Workout', category: 'fitness', frequency: 'weekly', weeklyTarget: 3 }]
  ),
  fitness: t(
    [{ name: 'Steps', category: 'fitness', frequency: 'daily', measurable: true, targetValue: 8000, unit: 'steps' }],
    [{ name: 'Strength workout', category: 'fitness', frequency: 'weekly', weeklyTarget: 4 }]
  ),
  nutrition: t(
    [
      { name: 'Protein target', category: 'nutrition', frequency: 'daily', measurable: true, targetValue: 120, unit: 'g' },
      { name: 'Water', category: 'nutrition', frequency: 'daily', measurable: true, targetValue: 2.5, unit: 'L' },
    ],
    []
  ),
  sleep: t([{ name: 'Sleep 7h+', category: 'sleep', frequency: 'daily', recommendedTime: 'evening' }], []),
  spirituality: t(
    [
      { name: 'Prayer on time', category: 'spirituality', frequency: 'daily', recommendedTime: 'morning' },
      { name: 'Quran — 1 page', category: 'spirituality', frequency: 'daily', measurable: true, targetValue: 1, unit: 'page' },
    ],
    [{ name: 'Revision', category: 'spirituality', frequency: 'weekly', weeklyTarget: 2 }]
  ),
  learning: t(
    [{ name: 'Focused study', category: 'learning', frequency: 'daily', measurable: true, targetValue: 30, unit: 'min' }],
    [{ name: 'Weekly review', category: 'learning', frequency: 'weekly', weeklyTarget: 1 }]
  ),
  language: t(
    [
      { name: 'Vocabulary', category: 'language', frequency: 'daily', measurable: true, targetValue: 20, unit: 'min' },
      { name: 'Listening', category: 'language', frequency: 'daily', measurable: true, targetValue: 20, unit: 'min' },
    ],
    [{ name: 'Speaking practice', category: 'language', frequency: 'weekly', weeklyTarget: 3 }]
  ),
  career: t(
    [{ name: 'Deep work', category: 'career', frequency: 'custom', days: [1, 2, 3, 4, 5], measurable: true, targetValue: 60, unit: 'min', recommendedTime: 'morning' }],
    [{ name: 'Weekly planning', category: 'productivity', frequency: 'weekly', weeklyTarget: 1 }]
  ),
  business: t(
    [
      { name: 'Deep work', category: 'business', frequency: 'custom', days: [1, 2, 3, 4, 5], measurable: true, targetValue: 60, unit: 'min', recommendedTime: 'morning' },
      { name: 'Outreach', category: 'business', frequency: 'custom', days: [1, 2, 3, 4, 5], measurable: true, targetValue: 5, unit: 'contacts' },
    ],
    [{ name: 'KPI review', category: 'business', frequency: 'weekly', weeklyTarget: 1 }]
  ),
  money: t([], [{ name: 'Financial review', category: 'money', frequency: 'weekly', weeklyTarget: 1 }]),
  content: t([], [{ name: 'Publish content', category: 'content', frequency: 'weekly', weeklyTarget: 2 }]),
  reading: t([{ name: 'Read', category: 'reading', frequency: 'daily', measurable: true, targetValue: 10, unit: 'pages' }], []),
  productivity: t(
    [{ name: 'Daily shutdown / plan tomorrow', category: 'productivity', frequency: 'daily', recommendedTime: 'evening' }],
    [{ name: 'Weekly planning', category: 'productivity', frequency: 'weekly', weeklyTarget: 1 }]
  ),
  relationships: t([], [{ name: 'Quality time with family', category: 'relationships', frequency: 'weekly', weeklyTarget: 2 }]),
  other: t([{ name: 'Daily habit', category: 'other', frequency: 'daily' }], []),
}

function applyPreferredTime(h: ProposedHabit, pref?: TimeOfDay): ProposedHabit {
  if (h.recommendedTime || !pref || pref === 'flexible') return h
  return { ...h, recommendedTime: pref }
}

function constrainDays(h: ProposedHabit, available?: Weekday[]): ProposedHabit {
  if (!available || available.length === 0 || available.length === 7) return h
  if (h.frequency === 'custom' && h.days) {
    const filtered = h.days.filter((d) => available.includes(d))
    return { ...h, days: filtered.length ? filtered : available }
  }
  return h
}

function milestonesUntil(today: string, end: string): ProposedMilestone[] {
  // Evenly spaced checkpoints (roughly monthly), capped at 4.
  const start = new Date(today + 'T00:00:00')
  const endD = new Date(end + 'T00:00:00')
  const spanMs = endD.getTime() - start.getTime()
  if (spanMs <= 0) return []
  const count = Math.max(1, Math.min(4, Math.round(spanMs / (1000 * 60 * 60 * 24 * 30))))
  const out: ProposedMilestone[] = []
  for (let i = 1; i <= count; i++) {
    const d = new Date(start.getTime() + (spanMs * i) / count)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    out.push({
      title: i === count ? 'Finish strong — reach your end-of-campaign goal' : `Checkpoint ${i}: stay consistent`,
      targetDate: key,
    })
  }
  return out
}

export function generatePlanLocally(input: PlanInput): GeneratedPlan {
  const pref = input.schedule?.preferredTime
  const available = input.schedule?.availableDays
  const seenDaily = new Set<string>()
  const seenWeekly = new Set<string>()
  const dailyHabits: ProposedHabit[] = []
  const weeklyHabits: ProposedHabit[] = []

  for (const g of input.goals) {
    const tmpl = CATEGORY_TEMPLATES[g.category] ?? CATEGORY_TEMPLATES.other!
    for (const d of tmpl.daily) {
      if (seenDaily.has(d.name)) continue
      seenDaily.add(d.name)
      dailyHabits.push(constrainDays(applyPreferredTime({ ...d }, pref), available))
    }
    for (const w of tmpl.weekly) {
      if (seenWeekly.has(w.name)) continue
      seenWeekly.add(w.name)
      weeklyHabits.push({ ...w })
    }
  }

  // Keep it realistic: 3–6 daily habits max.
  const trimmedDaily = dailyHabits.slice(0, 6)
  const trimmedWeekly = weeklyHabits.slice(0, 4)

  const mainGoals = input.goals.map((g) => g.title).slice(0, 5)

  return {
    summary:
      'A realistic starter system built from your goals. Consistency beats intensity — you can edit anything before you begin.',
    mainGoals: mainGoals.length ? mainGoals : ['Build consistent habits'],
    dailyHabits: trimmedDaily.length
      ? trimmedDaily
      : [{ name: 'One small daily habit', category: 'other', frequency: 'daily' }],
    weeklyHabits: trimmedWeekly,
    milestones: milestonesUntil(input.today, input.campaignEnd),
  }
}
