import type {
  Goal,
  Habit,
  HabitLog,
  Measurement,
  Milestone,
  Profile,
  Schedule,
  WeeklyReviewEntry,
} from '../types'
import type { Repo } from './repo'
import { supabase } from '../lib/supabase'

// ---- Row <-> model mappers (DB is snake_case) ----

function sb() {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
}

function rowToProfile(r: Record<string, unknown>): Profile {
  return {
    id: r.id as string,
    name: (r.name as string) ?? '',
    email: (r.email as string) ?? undefined,
    phone: (r.phone as string) ?? undefined,
    countryCode: (r.country_code as string) ?? undefined,
    country: (r.country as string) ?? undefined,
    bio: (r.bio as string) ?? undefined,
    schedule: (r.schedule as Schedule) ?? { preferredTime: 'flexible', availableDays: [0, 1, 2, 3, 4, 5, 6] },
    campaignName: (r.campaign_name as string) ?? '2026 Reset',
    campaignStart: (r.campaign_start as string) ?? '',
    campaignEnd: (r.campaign_end as string) ?? '2026-12-31',
    theme: (r.theme as Profile['theme']) ?? 'system',
    marketingConsent: Boolean(r.marketing_consent),
    marketingConsentAt: (r.marketing_consent_at as string) ?? undefined,
    privacyPolicyVersion: (r.privacy_policy_version as string) ?? undefined,
    isAdmin: Boolean(r.is_admin),
    onboardingComplete: Boolean(r.onboarding_complete),
    createdAt: (r.created_at as string) ?? '',
    lastActiveAt: (r.last_active_at as string) ?? undefined,
    utm: (r.utm as Profile['utm']) ?? undefined,
  }
}

function profileToRow(p: Profile): Record<string, unknown> {
  return {
    id: p.id,
    name: p.name,
    email: p.email ?? null,
    phone: p.phone ?? null,
    country_code: p.countryCode ?? null,
    country: p.country ?? null,
    bio: p.bio ?? null,
    schedule: p.schedule,
    campaign_name: p.campaignName,
    campaign_start: p.campaignStart || null,
    campaign_end: p.campaignEnd || null,
    theme: p.theme,
    marketing_consent: p.marketingConsent,
    marketing_consent_at: p.marketingConsentAt ?? null,
    privacy_policy_version: p.privacyPolicyVersion ?? null,
    onboarding_complete: p.onboardingComplete,
    last_active_at: p.lastActiveAt ?? null,
    utm: p.utm ?? null,
    // NOTE: is_admin is intentionally NOT writable from the client.
  }
}

function rowToHabit(r: Record<string, unknown>): Habit {
  return {
    id: r.id as string,
    name: r.name as string,
    category: r.category as Habit['category'],
    frequency: r.frequency as Habit['frequency'],
    days: (r.days as Habit['days']) ?? [],
    weeklyTarget: (r.weekly_target as number) ?? undefined,
    measurable: Boolean(r.measurable),
    targetValue: (r.target_value as number) ?? undefined,
    unit: (r.unit as string) ?? undefined,
    recommendedTime: (r.recommended_time as Habit['recommendedTime']) ?? undefined,
    description: (r.description as string) ?? undefined,
    isActive: r.is_active === undefined ? true : Boolean(r.is_active),
    isPaused: Boolean(r.is_paused),
    sortOrder: (r.sort_order as number) ?? 0,
    createdAt: (r.created_at as string) ?? '',
  }
}

function habitToRow(userId: string, h: Habit): Record<string, unknown> {
  return {
    id: h.id,
    user_id: userId,
    name: h.name,
    category: h.category,
    frequency: h.frequency,
    days: h.days,
    weekly_target: h.weeklyTarget ?? null,
    measurable: h.measurable,
    target_value: h.targetValue ?? null,
    unit: h.unit ?? null,
    recommended_time: h.recommendedTime ?? null,
    description: h.description ?? null,
    is_active: h.isActive,
    is_paused: h.isPaused,
    sort_order: h.sortOrder,
  }
}

export const supabaseRepo: Repo = {
  async getUserData(userId) {
    const client = sb()
    const [profileRes, goalsRes, habitsRes, logsRes, msRes, measRes, revRes] =
      await Promise.all([
        client.from('profiles').select('*').eq('id', userId).maybeSingle(),
        client.from('goals').select('*').eq('user_id', userId),
        client.from('habits').select('*').eq('user_id', userId),
        client.from('habit_logs').select('*').eq('user_id', userId),
        client.from('milestones').select('*').eq('user_id', userId),
        client.from('measurements').select('*').eq('user_id', userId),
        client.from('weekly_reviews').select('*').eq('user_id', userId),
      ])

    if (!profileRes.data) return null

    const goals: Goal[] = (goalsRes.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      details: r.details ?? undefined,
      createdAt: r.created_at ?? '',
    }))

    const logs: HabitLog[] = (logsRes.data ?? []).map((r) => ({
      habitId: r.habit_id,
      date: r.date,
      completed: Boolean(r.completed),
      value: r.value ?? undefined,
      note: r.note ?? undefined,
    }))

    const milestones: Milestone[] = (msRes.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      targetDate: r.target_date,
      measurable: Boolean(r.measurable),
      targetValue: r.target_value ?? undefined,
      unit: r.unit ?? undefined,
      achieved: Boolean(r.achieved),
    }))

    const measurements: Measurement[] = (measRes.data ?? []).map((r) => ({
      id: r.id,
      date: r.date,
      type: r.type,
      value: r.value,
      unit: r.unit,
      note: r.note ?? undefined,
    }))

    const reviews: WeeklyReviewEntry[] = (revRes.data ?? []).map((r) => ({
      weekStart: r.week_start,
      score: r.score ?? 0,
      bestHabit: r.best_habit ?? undefined,
      mostMissedHabit: r.most_missed_habit ?? undefined,
      consistencyPct: r.consistency_pct ?? 0,
      wentWell: r.went_well ?? '',
      difficult: r.difficult ?? '',
      changed: r.changed ?? '',
      aiSuggestions: r.ai_suggestions ?? undefined,
      createdAt: r.created_at ?? '',
    }))

    return {
      profile: rowToProfile(profileRes.data),
      goals,
      habits: (habitsRes.data ?? []).map(rowToHabit),
      logs,
      milestones,
      measurements,
      reviews,
    }
  },

  async saveProfile(profile) {
    const client = sb()
    const { error } = await client.from('profiles').upsert(profileToRow(profile))
    if (error) throw error
    // keep marketing_preferences in sync (spec table)
    await client.from('marketing_preferences').upsert({
      user_id: profile.id,
      email_opt_in: profile.marketingConsent,
      consent_at: profile.marketingConsentAt ?? null,
    })
  },

  async saveGoals(userId, goals) {
    const client = sb()
    await client.from('goals').delete().eq('user_id', userId)
    if (goals.length) {
      const { error } = await client.from('goals').insert(
        goals.map((g) => ({
          id: g.id,
          user_id: userId,
          title: g.title,
          category: g.category,
          details: g.details ?? null,
        }))
      )
      if (error) throw error
    }
  },

  async saveHabits(userId, habits) {
    const client = sb()
    const ids = habits.map((h) => h.id)
    // upsert all provided habits
    if (habits.length) {
      const { error } = await client
        .from('habits')
        .upsert(habits.map((h) => habitToRow(userId, h)))
      if (error) throw error
    }
    // delete habits the user removed (cascades their logs)
    let del = client.from('habits').delete().eq('user_id', userId)
    if (ids.length) del = del.not('id', 'in', `(${ids.join(',')})`)
    await del
  },

  async setLog(userId, log) {
    const client = sb()
    const { error } = await client.from('habit_logs').upsert(
      {
        user_id: userId,
        habit_id: log.habitId,
        date: log.date,
        completed: log.completed,
        value: log.value ?? null,
        note: log.note ?? null,
      },
      { onConflict: 'user_id,habit_id,date' }
    )
    if (error) throw error
  },

  async saveMilestones(userId, milestones) {
    const client = sb()
    await client.from('milestones').delete().eq('user_id', userId)
    if (milestones.length) {
      const { error } = await client.from('milestones').insert(
        milestones.map((m) => ({
          id: m.id,
          user_id: userId,
          title: m.title,
          target_date: m.targetDate,
          measurable: m.measurable,
          target_value: m.targetValue ?? null,
          unit: m.unit ?? null,
          achieved: m.achieved,
        }))
      )
      if (error) throw error
    }
  },

  async addMeasurement(userId, m) {
    const client = sb()
    const { error } = await client.from('measurements').insert({
      id: m.id,
      user_id: userId,
      date: m.date,
      type: m.type,
      value: m.value,
      unit: m.unit,
      note: m.note ?? null,
    })
    if (error) throw error
  },

  async saveReview(userId, review) {
    const client = sb()
    const { error } = await client.from('weekly_reviews').upsert(
      {
        user_id: userId,
        week_start: review.weekStart,
        score: review.score,
        best_habit: review.bestHabit ?? null,
        most_missed_habit: review.mostMissedHabit ?? null,
        consistency_pct: review.consistencyPct,
        went_well: review.wentWell,
        difficult: review.difficult,
        changed: review.changed,
        ai_suggestions: review.aiSuggestions ?? null,
      },
      { onConflict: 'user_id,week_start' }
    )
    if (error) throw error
  },

  async deleteAccount(userId) {
    const client = sb()
    // Child rows cascade via FKs; also call the server endpoint to remove the
    // auth user. Here we clear data the user owns (RLS allows only their rows).
    await Promise.all([
      client.from('habit_logs').delete().eq('user_id', userId),
      client.from('habits').delete().eq('user_id', userId),
      client.from('goals').delete().eq('user_id', userId),
      client.from('milestones').delete().eq('user_id', userId),
      client.from('measurements').delete().eq('user_id', userId),
      client.from('weekly_reviews').delete().eq('user_id', userId),
      client.from('marketing_preferences').delete().eq('user_id', userId),
    ])
    await client.from('profiles').delete().eq('id', userId)
  },
}
