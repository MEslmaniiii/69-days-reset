import type { AppData, DayRecord } from '../types'
import { CORE_HABIT_KEYS, NUTRITION_CHECK_KEYS } from '../types'
import {
  DATA_VERSION,
  DEFAULT_MEAL_SUGGESTIONS,
  DEFAULT_SETTINGS,
  freshData,
} from './defaults'

const KEY = 'sixtynine-reset-data'

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
 * Fill in any missing fields from older/partial saves. This is the v1 → v2
 * migration path: v1 saves have no `weights`, no nutrition settings, and day
 * records without a `nutrition` field — all of which are filled with safe
 * defaults here while every existing habit / quran / review record is preserved.
 */
function migrate(data: Partial<AppData>): AppData {
  const base = freshData()
  const savedSettings: Partial<typeof base.settings> = data.settings ?? {}
  return {
    version: DATA_VERSION,
    settings: {
      ...DEFAULT_SETTINGS,
      ...savedSettings,
      // Deep-merge meal suggestions so a partial/old object keeps defaults.
      mealSuggestions: {
        ...DEFAULT_MEAL_SUGGESTIONS,
        ...(savedSettings.mealSuggestions ?? {}),
      },
    },
    days: data.days ?? {},
    quran: { ...base.quran, ...(data.quran ?? {}) },
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
  download(blob, `69-days-reset-backup-${todayStamp()}.json`)
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
  download(blob, `69-days-reset-${todayStamp()}.csv`)
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
