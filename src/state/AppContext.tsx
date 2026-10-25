import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type {
  AppData,
  BonusHabits,
  DayNutrition,
  DayRecord,
  Habits,
  NutritionChecklist,
  QuranProgress,
  Settings,
  WeeklyReview,
  WeightEntry,
} from '../types'
import { emptyDay, loadData, saveData } from '../lib/storage'

const EMPTY_NUTRITION: DayNutrition = { checklist: {}, waterMl: 0, meals: [] }

interface AppContextValue {
  data: AppData
  settings: Settings
  today: string
  getDay: (key: string) => DayRecord
  toggleHabit: (key: string, habit: keyof Habits) => void
  toggleBonus: (key: string, habit: keyof BonusHabits) => void
  updateDay: (key: string, patch: Partial<DayRecord>) => void
  updateSettings: (patch: Partial<Settings>) => void
  updateQuran: (patch: Partial<QuranProgress>) => void
  saveReview: (fridayKey: string, review: WeeklyReview) => void
  // Nutrition
  getNutrition: (key: string) => DayNutrition
  toggleNutrition: (key: string, item: keyof NutritionChecklist) => void
  updateNutrition: (key: string, patch: Partial<DayNutrition>) => void
  addWater: (key: string, deltaMl: number) => void
  // Weight
  setWeight: (entry: WeightEntry) => void
  removeWeight: (dateKey: string) => void
  replaceData: (data: AppData) => void
  setToday: (key: string) => void
}

const Ctx = createContext<AppContextValue | null>(null)

function computeToday(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())
  // `today` is stateful so the user can preview other days in dev, but defaults to real today.
  const [today, setToday] = useState<string>(() => computeToday())

  // Persist on every change
  useEffect(() => {
    saveData(data)
  }, [data])

  // Keep "today" fresh if the tab stays open across midnight / regains focus
  useEffect(() => {
    const refresh = () => setToday(computeToday())
    window.addEventListener('focus', refresh)
    const id = window.setInterval(refresh, 60_000)
    return () => {
      window.removeEventListener('focus', refresh)
      window.clearInterval(id)
    }
  }, [])

  const getDay = useCallback(
    (key: string): DayRecord => data.days[key] ?? emptyDay(key),
    [data.days],
  )

  const updateDay = useCallback((key: string, patch: Partial<DayRecord>) => {
    setData((prev) => {
      const existing = prev.days[key] ?? emptyDay(key)
      return {
        ...prev,
        days: { ...prev.days, [key]: { ...existing, ...patch } },
      }
    })
  }, [])

  const toggleHabit = useCallback((key: string, habit: keyof Habits) => {
    setData((prev) => {
      const existing = prev.days[key] ?? emptyDay(key)
      const habits = { ...existing.habits, [habit]: !existing.habits[habit] }
      return {
        ...prev,
        days: { ...prev.days, [key]: { ...existing, habits } },
      }
    })
  }, [])

  const toggleBonus = useCallback((key: string, habit: keyof BonusHabits) => {
    setData((prev) => {
      const existing = prev.days[key] ?? emptyDay(key)
      const bonus = { ...existing.bonus, [habit]: !existing.bonus[habit] }
      return {
        ...prev,
        days: { ...prev.days, [key]: { ...existing, bonus } },
      }
    })
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [])

  const updateQuran = useCallback((patch: Partial<QuranProgress>) => {
    setData((prev) => ({ ...prev, quran: { ...prev.quran, ...patch } }))
  }, [])

  const saveReview = useCallback((fridayKey: string, review: WeeklyReview) => {
    setData((prev) => ({
      ...prev,
      reviews: { ...prev.reviews, [fridayKey]: review },
    }))
  }, [])

  const getNutrition = useCallback(
    (key: string): DayNutrition => data.days[key]?.nutrition ?? EMPTY_NUTRITION,
    [data.days],
  )

  const updateNutrition = useCallback((key: string, patch: Partial<DayNutrition>) => {
    setData((prev) => {
      const existing = prev.days[key] ?? emptyDay(key)
      const nutrition = { ...EMPTY_NUTRITION, ...existing.nutrition, ...patch }
      return {
        ...prev,
        days: { ...prev.days, [key]: { ...existing, nutrition } },
      }
    })
  }, [])

  const toggleNutrition = useCallback((key: string, item: keyof NutritionChecklist) => {
    setData((prev) => {
      const existing = prev.days[key] ?? emptyDay(key)
      const base = existing.nutrition ?? EMPTY_NUTRITION
      const checklist = { ...base.checklist, [item]: !base.checklist[item] }
      return {
        ...prev,
        days: { ...prev.days, [key]: { ...existing, nutrition: { ...base, checklist } } },
      }
    })
  }, [])

  const addWater = useCallback((key: string, deltaMl: number) => {
    setData((prev) => {
      const existing = prev.days[key] ?? emptyDay(key)
      const base = existing.nutrition ?? EMPTY_NUTRITION
      const waterMl = Math.max(0, (base.waterMl ?? 0) + deltaMl)
      return {
        ...prev,
        days: { ...prev.days, [key]: { ...existing, nutrition: { ...base, waterMl } } },
      }
    })
  }, [])

  const setWeight = useCallback((entry: WeightEntry) => {
    setData((prev) => ({
      ...prev,
      weights: { ...prev.weights, [entry.date]: entry },
    }))
  }, [])

  const removeWeight = useCallback((dateKey: string) => {
    setData((prev) => {
      const next = { ...prev.weights }
      delete next[dateKey]
      return { ...prev, weights: next }
    })
  }, [])

  const replaceData = useCallback((next: AppData) => setData(next), [])

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      settings: data.settings,
      today,
      getDay,
      toggleHabit,
      toggleBonus,
      updateDay,
      updateSettings,
      updateQuran,
      saveReview,
      getNutrition,
      toggleNutrition,
      updateNutrition,
      addWater,
      setWeight,
      removeWeight,
      replaceData,
      setToday,
    }),
    [
      data,
      today,
      getDay,
      toggleHabit,
      toggleBonus,
      updateDay,
      updateSettings,
      updateQuran,
      saveReview,
      getNutrition,
      toggleNutrition,
      updateNutrition,
      addWater,
      setWeight,
      removeWeight,
      replaceData,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used within AppProvider')
  return v
}
