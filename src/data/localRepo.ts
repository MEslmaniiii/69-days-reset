import type { UserData } from '../types'
import type { Repo } from './repo'
import { logMapKey } from '../lib/progress'

// Device-only demo backend. Not multi-user secure — used ONLY when Supabase is
// not configured, so the UI is previewable without a backend.

const KEY = 'byr_local_data_v1'

type Store = Record<string, UserData>

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

function write(store: Store): void {
  localStorage.setItem(KEY, JSON.stringify(store))
}

export const localRepo: Repo = {
  async getUserData(userId) {
    const store = read()
    return store[userId] ?? null
  },

  async saveProfile(profile) {
    const store = read()
    const existing = store[profile.id]
    store[profile.id] = existing
      ? { ...existing, profile }
      : {
          profile,
          goals: [],
          habits: [],
          logs: [],
          milestones: [],
          measurements: [],
          reviews: [],
        }
    write(store)
  },

  async saveGoals(userId, goals) {
    const store = read()
    if (store[userId]) {
      store[userId].goals = goals
      write(store)
    }
  },

  async saveHabits(userId, habits) {
    const store = read()
    if (store[userId]) {
      store[userId].habits = habits
      // prune logs for deleted habits
      const ids = new Set(habits.map((h) => h.id))
      store[userId].logs = store[userId].logs.filter((l) => ids.has(l.habitId))
      write(store)
    }
  },

  async setLog(userId, log) {
    const store = read()
    const data = store[userId]
    if (!data) return
    const key = logMapKey(log.habitId, log.date)
    const idx = data.logs.findIndex((l) => logMapKey(l.habitId, l.date) === key)
    if (idx >= 0) data.logs[idx] = log
    else data.logs.push(log)
    write(store)
  },

  async saveMilestones(userId, milestones) {
    const store = read()
    if (store[userId]) {
      store[userId].milestones = milestones
      write(store)
    }
  },

  async addMeasurement(userId, m) {
    const store = read()
    if (store[userId]) {
      store[userId].measurements.push(m)
      write(store)
    }
  },

  async saveReview(userId, review) {
    const store = read()
    const data = store[userId]
    if (!data) return
    const idx = data.reviews.findIndex((r) => r.weekStart === review.weekStart)
    if (idx >= 0) data.reviews[idx] = review
    else data.reviews.push(review)
    write(store)
  },

  async deleteAccount(userId) {
    const store = read()
    delete store[userId]
    write(store)
  },
}
