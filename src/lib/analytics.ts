import { supabase, isSupabaseConfigured } from './supabase'
import type { UtmData } from '../types'

// Lightweight, privacy-respecting analytics.
// RULE: never put names, phone numbers, emails, or bios into event props.

const UTM_KEY = 'byr_utm'

export type AnalyticsEvent =
  | 'landing_view'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'plan_generated'
  | 'plan_accepted'
  | 'habit_completed'
  | 'weekly_review_completed'
  | 'preset_selected'
  | 'light_day_toggled'
  | 'signup'

/** Capture UTM + referrer once, the first time the user lands. */
export function captureUtm(): UtmData {
  const existing = loadUtm()
  if (existing && Object.keys(existing).length) return existing

  const params = new URLSearchParams(window.location.search)
  const utm: UtmData = {}
  const get = (k: string) => params.get(k) || undefined
  utm.source = get('utm_source')
  utm.medium = get('utm_medium')
  utm.campaign = get('utm_campaign')
  utm.content = get('utm_content')
  utm.term = get('utm_term')
  utm.referrer = document.referrer || undefined

  const cleaned = Object.fromEntries(
    Object.entries(utm).filter(([, v]) => v !== undefined)
  ) as UtmData

  if (Object.keys(cleaned).length) {
    try {
      localStorage.setItem(UTM_KEY, JSON.stringify(cleaned))
    } catch {
      /* ignore */
    }
  }
  return cleaned
}

export function loadUtm(): UtmData {
  try {
    const raw = localStorage.getItem(UTM_KEY)
    return raw ? (JSON.parse(raw) as UtmData) : {}
  } catch {
    return {}
  }
}

/** Fire-and-forget event. Scrubs nothing automatically — callers must not pass PII. */
export async function track(
  event: AnalyticsEvent,
  props: Record<string, string | number | boolean> = {},
  userId?: string
): Promise<void> {
  try {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('analytics_events').insert({
        user_id: userId ?? null,
        event,
        props,
      })
    } else if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', event, props)
    }
  } catch {
    /* analytics must never break the app */
  }
}
