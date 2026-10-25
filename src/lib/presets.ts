// Example "starter systems" — including the original Mohamed spiritual+health
// routine, now just one preset among many. Used as inspiration and as an
// offline fallback if AI generation is unavailable.

import type { GeneratedPlan, ProposedHabit } from '../types'

export interface Preset {
  id: string
  title: string
  emoji: string
  description: string
  plan: GeneratedPlan
}

const h = (p: ProposedHabit): ProposedHabit => p

export const PRESETS: Preset[] = [
  {
    id: 'spiritual-health',
    title: 'Faith & Health',
    emoji: '🕌',
    description: 'Prayer, Quran, movement and clean eating — the original 69 Days Reset.',
    plan: {
      summary: 'A calm, consistent routine balancing worship, fitness and nutrition.',
      mainGoals: ['Consistent prayer & Quran', 'Improve fitness', 'Eat cleaner'],
      dailyHabits: [
        h({ name: 'Fajr on time', category: 'spirituality', frequency: 'daily', recommendedTime: 'morning', rationale: 'Anchors the whole day.' }),
        h({ name: 'Morning Adhkar', category: 'spirituality', frequency: 'daily', recommendedTime: 'morning' }),
        h({ name: 'Quran — 1 page', category: 'spirituality', frequency: 'daily', measurable: true, targetValue: 1, unit: 'page' }),
        h({ name: 'Walk', category: 'fitness', frequency: 'daily', measurable: true, targetValue: 8000, unit: 'steps' }),
        h({ name: 'Water', category: 'nutrition', frequency: 'daily', measurable: true, targetValue: 2.5, unit: 'L' }),
      ],
      weeklyHabits: [
        h({ name: 'Workout', category: 'fitness', frequency: 'weekly', weeklyTarget: 4 }),
        h({ name: 'Weekly weight check', category: 'health', frequency: 'weekly', weeklyTarget: 1, measurable: true, targetValue: 1, unit: 'check' }),
      ],
      milestones: [],
    },
  },
  {
    id: 'weight-loss',
    title: 'Lose Weight',
    emoji: '🏃',
    description: 'Steps, strength, protein and sleep — sustainable fat loss.',
    plan: {
      summary: 'Move more, eat enough protein, sleep well. Consistency over intensity.',
      mainGoals: ['Lose weight sustainably', 'Build a movement habit'],
      dailyHabits: [
        h({ name: 'Steps', category: 'fitness', frequency: 'daily', measurable: true, targetValue: 8000, unit: 'steps' }),
        h({ name: 'Protein target', category: 'nutrition', frequency: 'daily', measurable: true, targetValue: 120, unit: 'g' }),
        h({ name: 'Water', category: 'nutrition', frequency: 'daily', measurable: true, targetValue: 2.5, unit: 'L' }),
        h({ name: 'Sleep 7h+', category: 'sleep', frequency: 'daily', recommendedTime: 'evening' }),
      ],
      weeklyHabits: [
        h({ name: 'Strength workout', category: 'fitness', frequency: 'weekly', weeklyTarget: 4 }),
        h({ name: 'Weigh-in', category: 'health', frequency: 'weekly', weeklyTarget: 1, measurable: true, targetValue: 1, unit: 'check' }),
      ],
      milestones: [],
    },
  },
  {
    id: 'learn-language',
    title: 'Learn a Language',
    emoji: '🗣️',
    description: 'Daily vocabulary, listening and weekly speaking practice.',
    plan: {
      summary: 'Small daily reps beat cramming. Speak early and often.',
      mainGoals: ['Reach conversational level'],
      dailyHabits: [
        h({ name: 'Vocabulary', category: 'language', frequency: 'daily', measurable: true, targetValue: 20, unit: 'min' }),
        h({ name: 'Listening', category: 'language', frequency: 'daily', measurable: true, targetValue: 20, unit: 'min' }),
      ],
      weeklyHabits: [
        h({ name: 'Speaking practice', category: 'language', frequency: 'weekly', weeklyTarget: 3 }),
        h({ name: 'Weekly review', category: 'learning', frequency: 'weekly', weeklyTarget: 1 }),
      ],
      milestones: [],
    },
  },
  {
    id: 'build-business',
    title: 'Build a Business',
    emoji: '🚀',
    description: 'Deep work, outreach, content and a weekly KPI review.',
    plan: {
      summary: 'Protect deep work, show up daily, review the numbers weekly.',
      mainGoals: ['Grow revenue', 'Build an audience'],
      dailyHabits: [
        h({ name: 'Deep work', category: 'business', frequency: 'custom', days: [0, 1, 2, 3, 4], measurable: true, targetValue: 60, unit: 'min', recommendedTime: 'morning' }),
        h({ name: 'Outreach', category: 'business', frequency: 'custom', days: [0, 1, 2, 3, 4], measurable: true, targetValue: 5, unit: 'contacts' }),
      ],
      weeklyHabits: [
        h({ name: 'Publish content', category: 'content', frequency: 'weekly', weeklyTarget: 2 }),
        h({ name: 'KPI review', category: 'business', frequency: 'weekly', weeklyTarget: 1 }),
      ],
      milestones: [],
    },
  },
]

export function presetById(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id)
}
