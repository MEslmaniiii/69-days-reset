// ---- Core domain types for 60 Days Reset ----

export type Theme = 'light' | 'dark' | 'system'

export type NutritionMode = 'simple' | 'detailed'

export type MealType = 'breakfast' | 'snack' | 'lunch' | 'dinner'

/** 0 = Sunday ... 6 = Saturday (matches JS Date.getDay) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface MealSuggestions {
  breakfast: string[]
  snack: string[]
  dinner: string[]
}

export interface Settings {
  name: string
  challengeName: string
  startDate: string // ISO yyyy-mm-dd
  endDate: string // ISO yyyy-mm-dd
  /** Which weekdays are workout days */
  workoutDays: Weekday[]
  // Walking
  walkingBaseMinutes: number
  // Nutrition
  proteinTargetMin: number
  proteinTargetMax: number
  waterTargetMl: number
  nutritionMode: NutritionMode
  /** Relative weights for the Overall Lifestyle score (normalized when combined). */
  coreWeight: number
  nutritionWeight: number
  mealSuggestions: MealSuggestions
  theme: Theme
}

/** The six core habits + bonus. Keys are stable ids. */
export interface Habits {
  fajrMosque: boolean
  adhkar: boolean
  quranWird: boolean
  workout: boolean
  french: boolean
  aiLearning: boolean
}

export interface BonusHabits {
  script: boolean
}

export interface Walking {
  minutes: number
  distanceKm?: number
  steps?: number
}

export interface Listening {
  surah?: string
  reciter?: string
  minutes?: number
}

/** The manually-checked nutrition items. Water is derived from waterMl vs target. */
export interface NutritionChecklist {
  breakfast: boolean
  snack: boolean
  lunch: boolean
  dinner: boolean
  protein: boolean // simple mode: protein target achieved
  noSugaryDrinks: boolean
}

export interface MealLog {
  id: string
  type: MealType
  description: string
  proteinGrams?: number
  notes?: string
  /** Reserved for a future photo feature (data URL / path). */
  photo?: string
}

export interface DayNutrition {
  checklist: Partial<NutritionChecklist>
  waterMl: number
  /** Detailed-mode estimated total protein for the day. */
  proteinGrams?: number
  meals: MealLog[]
}

export interface DayRecord {
  date: string // ISO yyyy-mm-dd
  habits: Partial<Habits>
  bonus: Partial<BonusHabits>
  note: string
  walking: Walking
  listening: Listening
  nutrition?: DayNutrition
}

export interface WeightEntry {
  date: string // ISO yyyy-mm-dd
  weightKg: number
  waistCm?: number
  bodyFatPct?: number
}

export interface WeeklyReview {
  wentWell: string
  difficult: string
  change: string
  // Nutrition reflection (all optional)
  hardestMeal?: string
  hungerChange?: string
  energyChange?: string
  discomfortFood?: string
}

export interface AppData {
  version: number
  settings: Settings
  /** keyed by ISO date */
  days: Record<string, DayRecord>
  /** keyed by ISO date of the Friday that week */
  reviews: Record<string, WeeklyReview>
  /** keyed by ISO date */
  weights: Record<string, WeightEntry>
}

// The set of core habit keys (order matters for display)
export const CORE_HABIT_KEYS: (keyof Habits)[] = [
  'fajrMosque',
  'adhkar',
  'quranWird',
  'workout',
  'french',
  'aiLearning',
]

export const HABIT_LABELS: Record<keyof Habits, string> = {
  fajrMosque: 'Fajr in mosque',
  adhkar: 'Morning Adhkar',
  quranWird: 'Quran Wird',
  workout: 'Workout',
  french: 'French',
  aiLearning: 'Learn AI',
}

// Manually-checked nutrition items (water is scored separately from waterMl)
export const NUTRITION_CHECK_KEYS: (keyof NutritionChecklist)[] = [
  'breakfast',
  'snack',
  'lunch',
  'dinner',
  'protein',
  'noSugaryDrinks',
]

export const NUTRITION_LABELS: Record<keyof NutritionChecklist, string> = {
  breakfast: 'Healthy Breakfast',
  snack: 'Healthy Work Snack',
  lunch: 'Balanced Lunch',
  dinner: 'Healthy Dinner',
  protein: 'Protein Target',
  noSugaryDrinks: 'No Sugary Drinks',
}

export const MEAL_TYPES: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'snack', label: 'Work Snack' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'dinner', label: 'Dinner' },
]
