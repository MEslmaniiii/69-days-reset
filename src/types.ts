// ---- Core domain types for "Build Your Reset" ----
// A fully generic, multi-user, AI-personalized habit system.
// (The previous Mohamed-specific model now lives as an example preset.)

export type Theme = 'light' | 'dark' | 'system'

/** 0 = Sunday ... 6 = Saturday (matches JS Date.getDay) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * daily  = every day
 * weekly = X times per week (weeklyTarget), any days
 * custom = specific weekdays (days[])
 */
export type HabitFrequency = 'daily' | 'weekly' | 'custom'

export type HabitCategory =
  | 'health'
  | 'fitness'
  | 'nutrition'
  | 'sleep'
  | 'spirituality'
  | 'learning'
  | 'language'
  | 'career'
  | 'business'
  | 'money'
  | 'content'
  | 'reading'
  | 'productivity'
  | 'relationships'
  | 'other'

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'flexible'

export const CATEGORY_LABELS: Record<HabitCategory, string> = {
  health: 'Health',
  fitness: 'Fitness',
  nutrition: 'Nutrition',
  sleep: 'Sleep',
  spirituality: 'Spirituality',
  learning: 'Learning',
  language: 'Language',
  career: 'Career',
  business: 'Business',
  money: 'Money',
  content: 'Content',
  reading: 'Reading',
  productivity: 'Productivity',
  relationships: 'Relationships',
  other: 'Other',
}

export const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as HabitCategory[]

/** Goal categories presented in onboarding (maps loosely to habit categories). */
export interface GoalCategoryOption {
  key: HabitCategory
  label: string
  emoji: string
}

export const GOAL_CATEGORIES: GoalCategoryOption[] = [
  { key: 'health', label: 'Health & Fitness', emoji: '🏃' },
  { key: 'fitness', label: 'Muscle Building', emoji: '💪' },
  { key: 'nutrition', label: 'Nutrition', emoji: '🥗' },
  { key: 'sleep', label: 'Sleep', emoji: '😴' },
  { key: 'spirituality', label: 'Quran / Spirituality', emoji: '🕌' },
  { key: 'learning', label: 'Learning', emoji: '📚' },
  { key: 'language', label: 'Languages', emoji: '🗣️' },
  { key: 'career', label: 'Career', emoji: '📈' },
  { key: 'business', label: 'Business', emoji: '🚀' },
  { key: 'money', label: 'Money', emoji: '💰' },
  { key: 'content', label: 'Content Creation', emoji: '🎥' },
  { key: 'reading', label: 'Reading', emoji: '📖' },
  { key: 'productivity', label: 'Productivity', emoji: '⚡' },
  { key: 'relationships', label: 'Relationships / Family', emoji: '❤️' },
  { key: 'other', label: 'Other', emoji: '✨' },
]

export interface Habit {
  id: string
  name: string
  category: HabitCategory
  frequency: HabitFrequency
  /** for custom frequency: specific weekdays it is due */
  days: Weekday[]
  /** for weekly frequency: target times per week */
  weeklyTarget?: number
  /** measurable habit (tracks a numeric value toward a target) */
  measurable: boolean
  targetValue?: number
  unit?: string
  recommendedTime?: TimeOfDay
  /** short description / why it matters */
  description?: string
  isActive: boolean
  isPaused: boolean
  sortOrder: number
  createdAt: string
}

export interface HabitLog {
  habitId: string
  date: string // yyyy-mm-dd
  completed: boolean
  /** measured value for measurable habits */
  value?: number
  note?: string
}

export interface Goal {
  id: string
  title: string
  category: HabitCategory
  /** free-form follow-up answers keyed by question id */
  details?: Record<string, string>
  createdAt: string
}

export interface Milestone {
  id: string
  title: string
  targetDate: string // yyyy-mm-dd
  measurable: boolean
  targetValue?: number
  unit?: string
  achieved: boolean
}

export interface Measurement {
  id: string
  date: string
  type: string // e.g. 'weight', 'waist'
  value: number
  unit: string
  note?: string
}

export interface WeeklyReviewEntry {
  weekStart: string // yyyy-mm-dd
  score: number // 0..100
  bestHabit?: string
  mostMissedHabit?: string
  consistencyPct: number
  wentWell: string
  difficult: string
  changed: string
  aiSuggestions?: string[]
  createdAt: string
}

export interface Schedule {
  wakeTime?: string // "06:30"
  sleepTime?: string
  workStart?: string
  workEnd?: string
  preferredTime: TimeOfDay
  availableDays: Weekday[]
}

export interface UtmData {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
  referrer?: string
}

export interface Profile {
  id: string
  name: string
  email?: string
  phone?: string
  countryCode?: string // e.g. '+20'
  country?: string // ISO alpha-2, e.g. 'EG'
  bio?: string
  schedule: Schedule
  campaignName: string
  campaignStart: string // yyyy-mm-dd
  campaignEnd: string // yyyy-mm-dd
  theme: Theme
  marketingConsent: boolean
  marketingConsentAt?: string
  privacyPolicyVersion?: string
  isAdmin: boolean
  onboardingComplete: boolean
  createdAt: string
  lastActiveAt?: string
  utm?: UtmData
}

export interface UserData {
  profile: Profile
  goals: Goal[]
  habits: Habit[]
  logs: HabitLog[]
  milestones: Milestone[]
  measurements: Measurement[]
  reviews: WeeklyReviewEntry[]
}

// ---- AI plan proposal shape (returned by /api/generate-plan) ----

export interface ProposedHabit {
  name: string
  category: HabitCategory
  frequency: HabitFrequency
  days?: Weekday[]
  weeklyTarget?: number
  measurable?: boolean
  targetValue?: number
  unit?: string
  recommendedTime?: TimeOfDay
  rationale?: string
}

export interface ProposedMilestone {
  title: string
  targetDate: string
  measurable?: boolean
  targetValue?: number
  unit?: string
}

export interface GeneratedPlan {
  summary: string
  mainGoals: string[]
  dailyHabits: ProposedHabit[]
  weeklyHabits: ProposedHabit[]
  milestones: ProposedMilestone[]
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
