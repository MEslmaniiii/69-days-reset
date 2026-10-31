import type { AppData, DayRecord, MealSuggestions, Settings } from '../types'
import { CORE_HABIT_KEYS, NUTRITION_CHECK_KEYS } from '../types'
import {
  DATA_VERSION,
  DEFAULT_MEAL_SUGGESTIONS,
  DEFAULT_SETTINGS,
  freshData,
} from './defaults'
import { CHALLENGE_NAME, END_DATE, START_DATE } from './config'

// NOTE: the storage key is intentionally frozen at the original value so the
// user's existing browser data survives the rebrand. Do not change it.
const KEY = 'sixtynine-reset-data'

/** Habit keys removed in v3 — stripped from every day record on migration. */
const REMOVED_HABIT_KEYS = ['hifz', 'murajaah']
/** Settings fields removed in v3 (the old Quran memorization plan). */
const REMOVED_SETTINGS_KEYS = ['startingSurah', 'startingAyah', 'dailyAyahTarget']

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return freshData()
    const parsed = JSON.parse(raw) as AppData
    return migrate(parsed)
  } catch (e) {
    console.error('Failed to load data, starting fresh', e)
    return freshData()
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save data', e)
  }
}

/**
 * Fill in any missing fields from older/partial saves and bring legacy data up
 * to the current schema. Two migration concerns are handled here, both
 * idempotent and tolerant of partial/legacy input (this must never throw):
 *
 *  - v1 → v2: v1 saves have no `weights`, no nutrition settings, and day records
 *    without a `nutrition` field — filled with safe defaults.
 *  - < v3: drop the Quran-memorization plan. Rebrand "69 Days Reset" → the new
 *    name, reset the window to the fixed 60-day run, remove the `hifz`/`murajaah`
 *    habits from every day, drop the startingSurah/startingAyah/dailyAyahTarget
 *    settings and the top-level `quran` object. All other day data is preserved
 *    (out-of-window days simply never count toward stats or the calendar).
 */
export function migrate(data: Partial<AppData> & { quran?: unknown }): AppData {
  const incomingVersion = typeof data.version === 'number' ? data.version : 1
  const savedSettings: Record<string, unknown> = { ...(data.settings ?? {}) }

  if (incomingVersion < 3) {
    for (const k of REMOVED_SETTINGS_KEYS) delete savedSettings[k]
    savedSettings.startDate = START_DATE
    savedSettings.endDate = END_DATE
    // Only rebrand the auto-generated name, never a name the user customised.
    if (savedSettings.challengeName === '69 Days Reset') {
      savedSettings.challengeName = CHALLENGE_NAME
    }
  }

  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...(savedSettings as Partial<Settings>),
    // Deep-merge meal suggestions so a partial/old object keeps defaults.
    mealSuggestions: {
      ...DEFAULT_MEAL_SUGGESTIONS,
      ...((savedSettings.mealSuggestions as Partial<MealSuggestions>) ?? {}),
    },
  }

  // Strip removed habit keys from every day record (safe to run on any version).
  const days: Record<string, DayRecord> = {}
  for (const [key, rec] of Object.entries(data.days ?? {})) {
    if (!rec || typeof rec !== 'object') continue
    const habits = { ...(rec as DayRecord).habits } as Record<string, unknown>
    for (const k of REMOVED_HABIT_KEYS) delete habits[k]
    days[key] = { ...(rec as DayRecord), habits: habits as DayRecord['habits'] }
  }

  // The top-level `quran` object is intentionally dropped by omission.
  return {
    version: DATA_VERSION,
    settings,
    days,
    reviews: data.reviews ?? {},
    weights: data.weights ?? {},
  }
}

export function emptyDay(date: string): DayRecord {
  return {
    date,
    habits: {},
    bonus: {},
    note: '',
    walking: { minutes: 0 },
    listening: {},
    nutrition: { checklist: {}, waterMl: 0, meals: [] },
  }
}

// ---------------- Export / Import ----------------

export function exportJSON(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  download(blob, `60-days-reset-backup-${todayStamp()}.json`)
}

export function exportCSV(data: AppData): void {
  const headers = [
    'date',
    ...CORE_HABIT_KEYS,
    'script_bonus',
    ...NUTRITION_CHECK_KEYS.map((k) => `nutrition_${k}`),
    'water_ml',
    'protein_grams',
    'walking_minutes',
    'walking_km',
    'walking_steps',
    'listening_surah',
    'listening_reciter',
    'listening_minutes',
    'weight_kg',
    'note',
  ]
  const rows = Object.values(data.days)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => {
      const nut = d.nutrition
      const cells = [
        d.date,
        ...CORE_HABIT_KEYS.map((k) => (d.habits[k] ? '1' : '0')),
        d.bonus.script ? '1' : '0',
        ...NUTRITION_CHECK_KEYS.map((k) => (nut?.checklist?.[k] ? '1' : '0')),
        String(nut?.waterMl ?? ''),
        String(nut?.proteinGrams ?? ''),
        String(d.walking?.minutes ?? ''),
        String(d.walking?.distanceKm ?? ''),
        String(d.walking?.steps ?? ''),
        csvEscape(d.listening?.surah ?? ''),
        csvEscape(d.listening?.reciter ?? ''),
        String(d.listening?.minutes ?? ''),
        String(data.weights?.[d.date]?.weightKg ?? ''),
        csvEscape(d.note ?? ''),
      ]
      return cells.join(',')
    })
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  download(blob, `60-days-reset-${todayStamp()}.csv`)
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function importJSON(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        resolve(migrate(parsed))
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function todayStamp(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}
