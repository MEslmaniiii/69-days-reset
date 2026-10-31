// Single source of truth for the challenge window and branding.
// Everything else (header "Day X of 60", days remaining, progress %, calendar
// range, milestones) derives from these — never hard-code the length again.

/** Day 1 of the challenge. */
export const START_DATE = '2026-11-01'
/** Day 60 of the challenge (inclusive). */
export const END_DATE = '2026-12-30'
/** Total days in the challenge. Derived constant kept in sync with the dates. */
export const TOTAL_DAYS = 60
/** Default user-visible challenge name. */
export const CHALLENGE_NAME = '60 Days Reset'
