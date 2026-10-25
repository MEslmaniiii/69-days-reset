import type {
  Goal,
  Habit,
  HabitLog,
  Measurement,
  Milestone,
  Profile,
  UserData,
  WeeklyReviewEntry,
} from '../types'
import { isSupabaseConfigured } from '../lib/supabase'
import { localRepo } from './localRepo'
import { supabaseRepo } from './supabaseRepo'

/**
 * Persistence contract. Two implementations exist:
 *  - supabaseRepo: production, Postgres + RLS (each user isolated)
 *  - localRepo:    device-only demo mode when Supabase env is absent
 */
export interface Repo {
  getUserData(userId: string): Promise<UserData | null>
  saveProfile(profile: Profile): Promise<void>
  saveGoals(userId: string, goals: Goal[]): Promise<void>
  saveHabits(userId: string, habits: Habit[]): Promise<void>
  setLog(userId: string, log: HabitLog): Promise<void>
  saveMilestones(userId: string, milestones: Milestone[]): Promise<void>
  addMeasurement(userId: string, m: Measurement): Promise<void>
  saveReview(userId: string, review: WeeklyReviewEntry): Promise<void>
  deleteAccount(userId: string): Promise<void>
}

export const repo: Repo = isSupabaseConfigured ? supabaseRepo : localRepo

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // Fallback (older runtimes)
  return 'id-' + Math.abs(hashString(String(performance.now()))).toString(36)
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h
}
