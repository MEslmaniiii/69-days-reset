import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type {
  GeneratedPlan,
  Goal,
  Habit,
  HabitLog,
  Measurement,
  Milestone,
  ProposedHabit,
  Profile,
  UserData,
  WeeklyReviewEntry,
} from '../types'
import { repo, newId } from '../data/repo'
import { useAuth } from './AuthContext'

interface DataContextValue {
  data: UserData | null
  loading: boolean
  refresh: () => Promise<void>
  createProfile: (p: Profile) => Promise<void>
  saveProfile: (patch: Partial<Profile>) => Promise<void>
  setGoals: (goals: Goal[]) => Promise<void>
  acceptPlan: (plan: GeneratedPlan) => Promise<void>
  setHabits: (habits: Habit[]) => Promise<void>
  upsertHabit: (habit: Habit) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  setLog: (log: HabitLog) => Promise<void>
  setMilestones: (m: Milestone[]) => Promise<void>
  addMeasurement: (m: Measurement) => Promise<void>
  saveReview: (r: WeeklyReviewEntry) => Promise<void>
  deleteAccount: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function proposedToHabit(p: ProposedHabit, sortOrder: number, createdAt: string): Habit {
  return {
    id: newId(),
    name: p.name,
    category: p.category,
    frequency: p.frequency,
    days: p.days ?? [],
    weeklyTarget: p.weeklyTarget,
    measurable: Boolean(p.measurable),
    targetValue: p.targetValue,
    unit: p.unit,
    recommendedTime: p.recommendedTime,
    description: p.rationale,
    optional: p.optional ?? false,
    lightDay: p.lightDay ?? false,
    lightTargetValue: p.lightTargetValue,
    isActive: true,
    isPaused: false,
    sortOrder,
    createdAt,
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [data, setData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const d = await repo.getUserData(user.id)
      setData(d)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createProfile = useCallback(async (p: Profile) => {
    await repo.saveProfile(p)
    setData((prev) =>
      prev
        ? { ...prev, profile: p }
        : { profile: p, goals: [], habits: [], logs: [], milestones: [], measurements: [], reviews: [] }
    )
  }, [])

  const saveProfile = useCallback(
    async (patch: Partial<Profile>) => {
      setData((prev) => {
        if (!prev) return prev
        const next = { ...prev, profile: { ...prev.profile, ...patch } }
        void repo.saveProfile(next.profile)
        return next
      })
    },
    []
  )

  const setGoals = useCallback(
    async (goals: Goal[]) => {
      if (!user) return
      await repo.saveGoals(user.id, goals)
      setData((prev) => (prev ? { ...prev, goals } : prev))
    },
    [user]
  )

  const setHabits = useCallback(
    async (habits: Habit[]) => {
      if (!user) return
      await repo.saveHabits(user.id, habits)
      setData((prev) => (prev ? { ...prev, habits } : prev))
    },
    [user]
  )

  const upsertHabit = useCallback(
    async (habit: Habit) => {
      if (!user || !data) return
      const exists = data.habits.some((h) => h.id === habit.id)
      const habits = exists
        ? data.habits.map((h) => (h.id === habit.id ? habit : h))
        : [...data.habits, habit]
      await repo.saveHabits(user.id, habits)
      setData((prev) => (prev ? { ...prev, habits } : prev))
    },
    [user, data]
  )

  const deleteHabit = useCallback(
    async (id: string) => {
      if (!user || !data) return
      const habits = data.habits.filter((h) => h.id !== id)
      const logs = data.logs.filter((l) => l.habitId !== id)
      await repo.saveHabits(user.id, habits)
      setData((prev) => (prev ? { ...prev, habits, logs } : prev))
    },
    [user, data]
  )

  const acceptPlan = useCallback(
    async (plan: GeneratedPlan) => {
      if (!user || !data) return
      const createdAt = new Date(data.profile.campaignStart + 'T00:00:00').toISOString()
      let i = 0
      const habits: Habit[] = [
        ...plan.dailyHabits.map((p) => proposedToHabit(p, i++, createdAt)),
        ...plan.weeklyHabits.map((p) => proposedToHabit(p, i++, createdAt)),
      ]
      const milestones: Milestone[] = plan.milestones.map((m) => ({
        id: newId(),
        title: m.title,
        targetDate: m.targetDate,
        measurable: Boolean(m.measurable),
        targetValue: m.targetValue,
        unit: m.unit,
        achieved: false,
      }))
      await repo.saveHabits(user.id, habits)
      await repo.saveMilestones(user.id, milestones)
      const profile = { ...data.profile, onboardingComplete: true }
      await repo.saveProfile(profile)
      setData((prev) => (prev ? { ...prev, habits, milestones, profile } : prev))
    },
    [user, data]
  )

  const setLog = useCallback(
    async (log: HabitLog) => {
      if (!user) return
      await repo.setLog(user.id, log)
      setData((prev) => {
        if (!prev) return prev
        const others = prev.logs.filter(
          (l) => !(l.habitId === log.habitId && l.date === log.date)
        )
        return { ...prev, logs: [...others, log] }
      })
    },
    [user]
  )

  const setMilestones = useCallback(
    async (m: Milestone[]) => {
      if (!user) return
      await repo.saveMilestones(user.id, m)
      setData((prev) => (prev ? { ...prev, milestones: m } : prev))
    },
    [user]
  )

  const addMeasurement = useCallback(
    async (m: Measurement) => {
      if (!user) return
      await repo.addMeasurement(user.id, m)
      setData((prev) => (prev ? { ...prev, measurements: [...prev.measurements, m] } : prev))
    },
    [user]
  )

  const saveReview = useCallback(
    async (r: WeeklyReviewEntry) => {
      if (!user) return
      await repo.saveReview(user.id, r)
      setData((prev) => {
        if (!prev) return prev
        const others = prev.reviews.filter((x) => x.weekStart !== r.weekStart)
        return { ...prev, reviews: [...others, r] }
      })
    },
    [user]
  )

  const deleteAccount = useCallback(async () => {
    if (!user) return
    await repo.deleteAccount(user.id)
    setData(null)
  }, [user])

  return (
    <DataContext.Provider
      value={{
        data,
        loading,
        refresh,
        createProfile,
        saveProfile,
        setGoals,
        acceptPlan,
        setHabits,
        upsertHabit,
        deleteHabit,
        setLog,
        setMilestones,
        addMeasurement,
        saveReview,
        deleteAccount,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
