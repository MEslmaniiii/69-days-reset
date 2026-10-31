import type { AppData, MealSuggestions, Settings } from '../types'
import { CHALLENGE_NAME, END_DATE, START_DATE } from './config'

// v2 adds the Nutrition system (per-day nutrition, weights, nutrition settings).
// v3 drops Quran memorization (hifz/muraja'ah + the quran tracker) and the 69-day
// window in favour of a fixed 60-day run, adding the French & Learn AI habits.
export const DATA_VERSION = 3

export const DEFAULT_MEAL_SUGGESTIONS: MealSuggestions = {
  breakfast: [
    '3 eggs + small baladi bread (or 2 slices toast) + cottage/light cheese + vegetables',
    'Greek yogurt + oats + banana or berries',
    'Tuna sandwich + vegetables',
    'Eggs + cottage cheese + fruit',
  ],
  snack: [
    'Greek yogurt',
    'Fruit + a small amount of nuts',
    'Cottage cheese',
    'Tuna sandwich',
    'Turkey sandwich',
    'Protein yogurt',
    'Boiled eggs',
  ],
  dinner: [
    'Tuna + salad',
    'Eggs + cottage cheese',
    'Grilled chicken + vegetables',
    'Greek yogurt + fruit',
    'Cottage cheese + vegetables',
  ],
}

export const DEFAULT_SETTINGS: Settings = {
  name: 'Mohamed',
  challengeName: CHALLENGE_NAME,
  startDate: START_DATE,
  endDate: END_DATE,
  // Mon, Tue, Thu, Fri — 4 training days with Wed + weekend lighter
  workoutDays: [1, 2, 4, 5],
  walkingBaseMinutes: 18,
  // Nutrition
  proteinTargetMin: 130,
  proteinTargetMax: 160,
  waterTargetMl: 2500,
  nutritionMode: 'simple',
  coreWeight: 70,
  nutritionWeight: 30,
  mealSuggestions: DEFAULT_MEAL_SUGGESTIONS,
  theme: 'system',
}

export function freshData(settings: Settings = DEFAULT_SETTINGS): AppData {
  return {
    version: DATA_VERSION,
    settings,
    days: {},
    reviews: {},
    weights: {},
  }
}

// ---------------- Nutrition guidance ----------------

export const FOOD_RULES: string[] = [
  'Every main meal should contain a clear protein source.',
  'Avoid sugary drinks.',
  'Prefer fruit or protein-based snacks over random snacking.',
  'Desserts are allowed 1–2 times per week.',
  'Do not punish one bad meal.',
  'Return to the plan at the next meal.',
]

export const PLATE_METHOD: string[] = [
  '½ plate — vegetables / salad',
  '¼ plate — protein',
  '¼ plate — rice / pasta / potatoes / bread',
]

/** Quick-add water button sizes in ml. */
export const WATER_STEPS = [250, 500]

// ---------------- Workout program ----------------

export interface Exercise {
  name: string
  sets: string // "3" or "3 × 12"
  reps: string
  rest: string
  target: string
  equipment: string
  /** YouTube search URL for the exact exercise (safe, never a fake link) */
  youtube: string
  /** light-dumbbell technique cue */
  cue?: string
}

export interface WorkoutDay {
  id: string
  title: string
  focus: string
  warmup: string
  exercises: Exercise[]
  finisher: string
}

function yt(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

export const WORKOUTS: WorkoutDay[] = [
  {
    id: 'upperA',
    title: 'Upper Body A',
    focus: 'Chest · Back · Shoulders · Arms',
    warmup: '3–4 min easy walk on the pad + arm circles and band/bodyweight scap pulls.',
    exercises: [
      {
        name: 'Dumbbell Floor Press',
        sets: '3',
        reps: '12–15',
        rest: '60 sec',
        target: 'Chest / Triceps',
        equipment: 'Dumbbells',
        youtube: yt('dumbbell floor press form'),
        cue: '3-sec lowering (slow eccentric), pause 1 sec at the bottom.',
      },
      {
        name: 'Push-ups (feet or knees)',
        sets: '3',
        reps: 'AMRAP −2 reps',
        rest: '60 sec',
        target: 'Chest / Triceps',
        equipment: 'Bodyweight',
        youtube: yt('perfect push up technique'),
        cue: 'Stop 2 reps before failure; slow 3-sec descent.',
      },
      {
        name: 'Single-arm Dumbbell Row',
        sets: '3 / side',
        reps: '12–15',
        rest: '45 sec',
        target: 'Back / Biceps',
        equipment: 'Dumbbell',
        youtube: yt('single arm dumbbell row proper form'),
        cue: 'Pause and squeeze 1 sec at the top of each rep.',
      },
      {
        name: 'Dumbbell Shoulder Press',
        sets: '3',
        reps: '12–15',
        rest: '60 sec',
        target: 'Shoulders',
        equipment: 'Dumbbells',
        youtube: yt('seated dumbbell shoulder press form'),
        cue: 'Controlled tempo, no bouncing out of the bottom.',
      },
      {
        name: 'Dumbbell Lateral Raise',
        sets: '3',
        reps: '15–20',
        rest: '45 sec',
        target: 'Side delts',
        equipment: 'Dumbbells',
        youtube: yt('dumbbell lateral raise jeff nippard'),
        cue: 'Light weight is ideal here — slow up, slow down.',
      },
      {
        name: 'Dumbbell Curl + Overhead Triceps Extension (superset)',
        sets: '3',
        reps: '12–15 each',
        rest: '60 sec',
        target: 'Biceps / Triceps',
        equipment: 'Dumbbells',
        youtube: yt('dumbbell curl and overhead triceps extension'),
        cue: 'Slow negatives; back-to-back with no rest between the two.',
      },
    ],
    finisher: 'Walking Pad: finish with your target walk for this week (see Walking Plan).',
  },
  {
    id: 'lowerA',
    title: 'Lower Body + Core A',
    focus: 'Quads · Glutes · Hamstrings · Calves · Core',
    warmup: '3–4 min easy walk + leg swings, bodyweight squats, glute bridges.',
    exercises: [
      {
        name: 'Goblet Squat',
        sets: '3',
        reps: '12–15',
        rest: '60 sec',
        target: 'Quads / Glutes',
        equipment: 'Dumbbell',
        youtube: yt('goblet squat form'),
        cue: '3-sec descent, 1-sec pause at the bottom.',
      },
      {
        name: 'Reverse Lunge',
        sets: '3 / side',
        reps: '10–12',
        rest: '60 sec',
        target: 'Quads / Glutes',
        equipment: 'Dumbbells / Bodyweight',
        youtube: yt('reverse lunge dumbbell technique'),
        cue: 'Single-leg work makes light weight feel heavy — stay controlled.',
      },
      {
        name: 'Romanian Deadlift (dumbbell)',
        sets: '3',
        reps: '12–15',
        rest: '60 sec',
        target: 'Hamstrings / Glutes',
        equipment: 'Dumbbells',
        youtube: yt('dumbbell romanian deadlift form'),
        cue: 'Slow stretch down, feel the hamstrings; soft knees.',
      },
      {
        name: 'Glute Bridge / Hip Thrust',
        sets: '3',
        reps: '15–20',
        rest: '45 sec',
        target: 'Glutes',
        equipment: 'Bodyweight / Dumbbell',
        youtube: yt('glute bridge hip thrust form'),
        cue: 'Pause and squeeze 2 sec at the top.',
      },
      {
        name: 'Standing Calf Raise',
        sets: '3',
        reps: '15–20',
        rest: '30 sec',
        target: 'Calves',
        equipment: 'Bodyweight / Dumbbells',
        youtube: yt('standing calf raise form'),
        cue: 'Full stretch at the bottom, pause at the top.',
      },
      {
        name: 'Plank + Dead Bug (core superset)',
        sets: '3',
        reps: '30–45 sec / 10 each',
        rest: '45 sec',
        target: 'Core',
        equipment: 'Bodyweight',
        youtube: yt('plank and dead bug core'),
        cue: 'Brace, breathe, no sagging hips.',
      },
    ],
    finisher: 'Walking Pad: finish with your target walk for this week (see Walking Plan).',
  },
  {
    id: 'upperB',
    title: 'Upper Body B',
    focus: 'Chest · Back · Shoulders · Arms (variation)',
    warmup: '3–4 min easy walk + band/bodyweight scap work and arm circles.',
    exercises: [
      {
        name: 'Incline Push-up (hands on couch/table)',
        sets: '3',
        reps: '12–20',
        rest: '60 sec',
        target: 'Chest',
        equipment: 'Bodyweight',
        youtube: yt('incline push up form'),
        cue: '3-sec descent; the higher the hands, the easier.',
      },
      {
        name: 'Dumbbell Chest Fly (floor)',
        sets: '3',
        reps: '12–15',
        rest: '60 sec',
        target: 'Chest',
        equipment: 'Dumbbells',
        youtube: yt('floor dumbbell fly chest'),
        cue: 'Wide slow stretch, squeeze at the top.',
      },
      {
        name: 'Dumbbell Pullover',
        sets: '3',
        reps: '12–15',
        rest: '60 sec',
        target: 'Back / Chest',
        equipment: 'Dumbbell',
        youtube: yt('dumbbell pullover form'),
        cue: 'Big controlled stretch overhead.',
      },
      {
        name: 'Dumbbell Rear-Delt Raise (bent over)',
        sets: '3',
        reps: '15–20',
        rest: '45 sec',
        target: 'Rear delts / upper back',
        equipment: 'Dumbbells',
        youtube: yt('bent over rear delt raise dumbbell'),
        cue: 'Light and slow; squeeze the shoulder blades.',
      },
      {
        name: 'Arnold Press',
        sets: '3',
        reps: '12–15',
        rest: '60 sec',
        target: 'Shoulders',
        equipment: 'Dumbbells',
        youtube: yt('arnold press dumbbell form'),
        cue: 'Controlled rotation, no momentum.',
      },
      {
        name: 'Hammer Curl + Triceps Kickback (superset)',
        sets: '3',
        reps: '12–15 each',
        rest: '60 sec',
        target: 'Biceps / Triceps',
        equipment: 'Dumbbells',
        youtube: yt('hammer curl and triceps kickback'),
        cue: 'Slow negatives, full squeeze on the kickback.',
      },
    ],
    finisher: 'Walking Pad: finish with your target walk for this week (see Walking Plan).',
  },
  {
    id: 'lowerB',
    title: 'Lower / Full Body B',
    focus: 'Legs · Glutes · Core · Full-body conditioning',
    warmup: '3–4 min easy walk + bodyweight squats and glute bridges.',
    exercises: [
      {
        name: 'Bulgarian Split Squat',
        sets: '3 / side',
        reps: '8–12',
        rest: '60 sec',
        target: 'Quads / Glutes',
        equipment: 'Dumbbells / Bodyweight',
        youtube: yt('bulgarian split squat at home couch form'),
        cue: 'Rest your back foot on a couch, chair, or bed — slow and controlled, light DBs plenty.',
      },
      {
        name: 'Dumbbell Sumo Squat',
        sets: '3',
        reps: '15–20',
        rest: '60 sec',
        target: 'Glutes / Quads / Adductors',
        equipment: 'Dumbbell',
        youtube: yt('dumbbell sumo squat form'),
        cue: 'Wide stance, 2-sec pause at the bottom.',
      },
      {
        name: 'Single-leg Romanian Deadlift',
        sets: '3 / side',
        reps: '10–12',
        rest: '60 sec',
        target: 'Hamstrings / Glutes / Balance',
        equipment: 'Dumbbell',
        youtube: yt('single leg romanian deadlift dumbbell'),
        cue: 'Slow, balance-focused; hinge from the hip.',
      },
      {
        name: 'Step-ups',
        sets: '3 / side',
        reps: '12–15',
        rest: '45 sec',
        target: 'Quads / Glutes',
        equipment: 'Bodyweight / Dumbbells',
        youtube: yt('dumbbell step up at home stairs chair form'),
        cue: 'Use a sturdy chair or the bottom stair — drive through the heel, control the way down.',
      },
      {
        name: 'Seated / Single-leg Calf Raise',
        sets: '3',
        reps: '15–20',
        rest: '30 sec',
        target: 'Calves',
        equipment: 'Bodyweight / Dumbbell',
        youtube: yt('single leg calf raise form'),
        cue: 'Full range, pause at the top.',
      },
      {
        name: 'Lying Leg Raise + Bicycle (core)',
        sets: '3',
        reps: '12–15 / 20',
        rest: '45 sec',
        target: 'Core',
        equipment: 'Bodyweight (floor/mat)',
        youtube: yt('lying leg raise and bicycle crunch core'),
        cue: 'On the floor — hands under your hips, slow and controlled, no swinging.',
      },
    ],
    finisher: 'Walking Pad: finish with a longer walk (this is your conditioning day).',
  },
]

/** Map the Nth workout of the week (0-based) to a workout template. */
export function workoutForIndex(i: number): WorkoutDay {
  return WORKOUTS[i % WORKOUTS.length]
}

// ---------------- Walking plan ----------------

export interface WalkingPhase {
  weeks: string
  minutes: string
  note: string
}

export const WALKING_PLAN: WalkingPhase[] = [
  { weeks: 'Weeks 1–2', minutes: '15–20 min', note: 'Easy pace. Build the habit first.' },
  { weeks: 'Weeks 3–5', minutes: '20–25 min', note: 'Add a gentle incline or slightly faster pace.' },
  { weeks: 'Weeks 6–8', minutes: '25–30 min', note: 'Comfortable brisk walk.' },
  { weeks: 'Weeks 9–10', minutes: '30–35 min', note: 'Hold here — consistency over intensity.' },
]

/** Recommended walking minutes based on how many days since the start. */
export function walkingTargetForDay(dayNumber: number, base: number): string {
  // dayNumber is 1-based day of the challenge
  const week = Math.ceil(dayNumber / 7)
  if (week <= 2) return `${base}–${base + 2} min`
  if (week <= 5) return `${base + 2}–${base + 7} min`
  if (week <= 8) return `${base + 7}–${base + 12} min`
  return `${base + 12}–${base + 17} min`
}

// ---------------- Milestones ----------------

export const MILESTONES: { day: number; message: string }[] = [
  { day: 7, message: '7 days of consistency.' },
  { day: 14, message: '14 days. The routine is taking shape.' },
  { day: 21, message: '21 days — the hardest part is behind you.' },
  { day: 30, message: '30 days — this is becoming part of your identity.' },
  { day: 45, message: '45 days. Steady and deliberate.' },
  { day: 60, message: '60 days. You completed the reset.' },
]
