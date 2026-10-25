// App-wide configuration. Campaign dates are dynamic so we can later add
// other challenges (30-day, 90-day, Ramadan, 2027 Reset, ...).

import { todayKey } from './dates'

export const PRIVACY_POLICY_VERSION = '2026-10-25'

export interface Campaign {
  id: string
  name: string
  /** end date (ISO yyyy-mm-dd) */
  end: string
  /** short tagline shown in the countdown, e.g. "Until 2027" */
  countdownLabel: string
}

/**
 * The default public campaign. End date is configurable per-user (stored on
 * the profile) but new users start on this one.
 */
export const DEFAULT_CAMPAIGN: Campaign = {
  id: 'reset-2026',
  name: '2026 Reset',
  end: '2026-12-31',
  countdownLabel: 'Until 2027',
}

/** Other campaign templates we can offer later (architecture-ready, not all wired into UI yet). */
export const CAMPAIGN_TEMPLATES: Campaign[] = [
  DEFAULT_CAMPAIGN,
  { id: 'reset-30', name: '30 Day Reset', end: '', countdownLabel: '30 Day Reset' },
  { id: 'reset-90', name: '90 Day Reset', end: '', countdownLabel: '90 Day Reset' },
  { id: 'reset-2027', name: '2027 Reset', end: '2027-12-31', countdownLabel: 'Until 2028' },
]

export function defaultCampaignStart(): string {
  return todayKey()
}

export const BRAND = {
  name: 'Build Your Reset',
  short: 'Reset',
  tagline: 'Build the habits that will change your year.',
  subtagline:
    'Tell us your goals and lifestyle. AI creates a personalized system to help you reach them before the end of the year.',
  supportEmail: 'hello@buildyourreset.app',
}
