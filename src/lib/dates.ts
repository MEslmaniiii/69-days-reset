// Date helpers. All "date keys" are local-time ISO yyyy-mm-dd strings so
// a day never shifts due to UTC conversion.

export function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Today's date key. When an IANA `tz` is given (e.g. "Africa/Cairo"), the day
 * is resolved in that timezone instead of the device's, so tracking doesn't
 * roll over at the wrong local midnight. Invalid/absent tz falls back to device.
 */
export function todayKey(tz?: string): string {
  if (tz) {
    try {
      // en-CA formats as yyyy-mm-dd, which is exactly our key format.
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date())
    } catch {
      // fall through to device-local on an invalid timezone
    }
  }
  return toKey(new Date())
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

/** Inclusive number of days from a..b (b - a + 1). */
export function daysBetweenInclusive(a: string, b: string): number {
  const ms = fromKey(b).getTime() - fromKey(a).getTime()
  return Math.round(ms / 86400000) + 1
}

/** 0-based difference in days (b - a). */
export function diffDays(a: string, b: string): number {
  const ms = fromKey(b).getTime() - fromKey(a).getTime()
  return Math.round(ms / 86400000)
}

/** List every date key in [start, end] inclusive. */
export function rangeKeys(start: string, end: string): string[] {
  const out: string[] = []
  let cur = start
  const total = daysBetweenInclusive(start, end)
  for (let i = 0; i < total; i++) {
    out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

export function clampKey(key: string, min: string, max: string): string {
  if (key < min) return min
  if (key > max) return max
  return key
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function weekdayName(key: string): string {
  return WEEKDAY_NAMES[fromKey(key).getDay()]
}
export function weekdayShort(key: string): string {
  return WEEKDAY_SHORT[fromKey(key).getDay()]
}
export function monthShort(key: string): string {
  return MONTH_SHORT[fromKey(key).getMonth()]
}

/** e.g. "Saturday, October 24" */
export function prettyDate(key: string): string {
  const d = fromKey(key)
  return `${WEEKDAY_NAMES[d.getDay()]}, ${MONTH_LONG[d.getMonth()]} ${d.getDate()}`
}

/** e.g. "Oct 24" */
export function shortDate(key: string): string {
  const d = fromKey(key)
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}

export function isFriday(key: string): boolean {
  return fromKey(key).getDay() === 5
}

/**
 * Return the key for the start of the week (Saturday) containing `key`.
 * Islamic/Middle-Eastern week begins Saturday.
 */
export function weekStart(key: string): string {
  const day = fromKey(key).getDay() // 0 Sun .. 6 Sat
  // distance back to the most recent Saturday (6)
  const back = (day + 1) % 7
  return addDays(key, -back)
}

/** The Friday that closes the week containing `key`. */
export function weekEnd(key: string): string {
  return addDays(weekStart(key), 6)
}
