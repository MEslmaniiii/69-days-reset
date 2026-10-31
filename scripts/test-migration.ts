/*
 * Standalone test for the v2 → v3 migration and the 60-day date logic.
 * Runs the REAL code (no mocks) against a fixture. No test runner is configured
 * in this project, so transpile src + this script to CJS with the bundled
 * sucrase and run with node:
 *
 *   OUT=$(mktemp -d); printf '{"type":"commonjs"}' > "$OUT/package.json"
 *   node_modules/.bin/sucrase src     -d "$OUT/src"     --transforms typescript,jsx,imports -q
 *   node_modules/.bin/sucrase scripts -d "$OUT/scripts" --transforms typescript,imports     -q
 *   node "$OUT/scripts/test-migration.js"
 */
import assert from 'node:assert/strict'
import { migrate } from '../src/lib/storage'
import { CORE_HABIT_KEYS } from '../src/types'
import { DATA_VERSION, DEFAULT_SETTINGS, MILESTONES } from '../src/lib/defaults'
import { dayNumber, totalDays } from '../src/lib/progress'
import { END_DATE, START_DATE, TOTAL_DAYS } from '../src/lib/config'

let passed = 0
function check(label: string, fn: () => void) {
  fn()
  passed++
  console.log(`  ok  ${label}`)
}

// A realistic v2 save matching the live localStorage shape.
const v2 = () => ({
  version: 2,
  settings: {
    name: 'Mohamed',
    challengeName: '69 Days Reset',
    startDate: '2026-10-24',
    endDate: '2026-12-31',
    workoutDays: [1, 2, 4, 5],
    startingSurah: 78,
    startingAyah: 1,
    dailyAyahTarget: 4,
    walkingBaseMinutes: 18,
    proteinTargetMin: 130,
    proteinTargetMax: 160,
    waterTargetMl: 2500,
    nutritionMode: 'simple',
    coreWeight: 70,
    nutritionWeight: 30,
    mealSuggestions: { breakfast: ['x'], snack: ['y'], dinner: ['z'] },
    theme: 'system',
  },
  days: {
    // Out-of-window legacy day with the removed habits set.
    '2026-10-28': {
      date: '2026-10-28',
      habits: { fajrMosque: true, quranWird: true, hifz: true, murajaah: true },
      bonus: {},
      note: 'kept',
      walking: { minutes: 10 },
      listening: { surah: 'An-Naba' },
      nutrition: { checklist: { breakfast: true }, waterMl: 500, meals: [] },
    },
    // In-window day, also carrying a removed habit.
    '2026-11-02': {
      date: '2026-11-02',
      habits: { workout: true, hifz: true },
      bonus: { script: true },
      note: '',
      walking: { minutes: 0 },
      listening: {},
    },
  },
  quran: { currentSurah: 80, currentAyah: 5, ayatMemorized: 42, completedSurahs: [78, 79] },
  reviews: { '2026-10-30': { wentWell: 'a', difficult: 'b', change: 'c' } },
  weights: { '2026-10-28': { date: '2026-10-28', weightKg: 70 } },
})

console.log('Migration v2 → v3:')
const m = migrate(v2() as never)

check('bumps schema to version 3', () => assert.equal(m.version, DATA_VERSION))
check('DATA_VERSION is 3', () => assert.equal(DATA_VERSION, 3))
check('forces startDate to 2026-11-01', () => assert.equal(m.settings.startDate, START_DATE))
check('forces endDate to 2026-12-30', () => assert.equal(m.settings.endDate, END_DATE))
check('rebrands the default challenge name', () =>
  assert.equal(m.settings.challengeName, '60 Days Reset'))
check('drops Quran-plan settings', () => {
  assert.ok(!('startingSurah' in m.settings))
  assert.ok(!('startingAyah' in m.settings))
  assert.ok(!('dailyAyahTarget' in m.settings))
})
check('drops the top-level quran object', () => assert.ok(!('quran' in m)))
check('strips hifz/murajaah from every day', () => {
  for (const d of Object.values(m.days)) {
    assert.ok(!('hifz' in d.habits), 'hifz should be gone')
    assert.ok(!('murajaah' in d.habits), 'murajaah should be gone')
  }
})
check('keeps surviving habits and other day data', () => {
  const d = m.days['2026-10-28']
  assert.equal(d.habits.fajrMosque, true)
  assert.equal(d.habits.quranWird, true)
  assert.equal(d.note, 'kept')
  assert.equal(d.walking.minutes, 10)
  assert.equal(d.nutrition?.waterMl, 500)
})
check('preserves reviews and weights', () => {
  assert.equal(m.reviews['2026-10-30'].wentWell, 'a')
  assert.equal(m.weights['2026-10-28'].weightKg, 70)
})

console.log('Idempotency & edge cases:')
check('migrating twice is stable', () =>
  assert.deepEqual(migrate(m as never), m))
check('a custom challenge name is NOT overwritten (dates still fixed)', () => {
  const custom = v2()
  custom.settings.challengeName = 'My Custom Reset'
  const r = migrate(custom as never)
  assert.equal(r.settings.challengeName, 'My Custom Reset')
  assert.equal(r.settings.startDate, START_DATE)
})
check('already-v3 data keeps its (user-edited) dates', () => {
  const v3 = migrate(v2() as never)
  v3.settings.startDate = '2026-11-05'
  v3.version = 3
  const r = migrate(v3 as never)
  assert.equal(r.settings.startDate, '2026-11-05')
})
check('never throws on empty / partial / junk data', () => {
  assert.doesNotThrow(() => migrate({} as never))
  assert.doesNotThrow(() => migrate({ version: 2, days: { bad: null } } as never))
  assert.doesNotThrow(() => migrate({ version: 1 } as never))
  assert.equal(migrate({} as never).version, 3)
})

console.log('60-day date logic (real progress fns):')
check('TOTAL_DAYS constant is 60', () => assert.equal(TOTAL_DAYS, 60))
check('derived totalDays(defaults) is 60', () =>
  assert.equal(totalDays(DEFAULT_SETTINGS), 60))
check('constant matches derived', () =>
  assert.equal(TOTAL_DAYS, totalDays(m.settings)))
check('Nov 1 is Day 1', () => assert.equal(dayNumber(m.settings, '2026-11-01'), 1))
check('Dec 30 is Day 60', () => assert.equal(dayNumber(m.settings, '2026-12-30'), 60))
check('Oct 31 is before start (day 0, no crash / no negative day shown)', () =>
  assert.equal(dayNumber(m.settings, '2026-10-31'), 0))

console.log('Habits & milestones:')
check('exactly 6 core habits', () => assert.equal(CORE_HABIT_KEYS.length, 6))
check('core habits include french & aiLearning, exclude hifz/murajaah', () => {
  assert.ok(CORE_HABIT_KEYS.includes('french'))
  assert.ok(CORE_HABIT_KEYS.includes('aiLearning'))
  assert.ok(!CORE_HABIT_KEYS.includes('hifz' as never))
  assert.ok(!CORE_HABIT_KEYS.includes('murajaah' as never))
})
check('milestones end at 60 and drop 69', () => {
  const days = MILESTONES.map((x) => x.day)
  assert.equal(Math.max(...days), 60)
  assert.ok(!days.includes(69))
  assert.deepEqual(days, [7, 14, 21, 30, 45, 60])
})

console.log(`\nAll ${passed} assertions passed ✓`)
