import { CORE_HABIT_KEYS, HABIT_LABELS } from '../types'
import type { Habits } from '../types'
import { useApp } from '../state/AppContext'
import { isWorkoutDay } from '../lib/progress'
import { Checkbox } from './ui'

const HABIT_HINTS: Partial<Record<keyof Habits, string>> = {
  fajrMosque: 'Prayed Fajr in congregation at the mosque',
  adhkar: 'Morning remembrance between Adhan & Iqamah',
  quranWird: 'Daily Quran reading portion',
  hifz: 'New memorization',
  murajaah: 'Reviewed previous memorization',
}

export function DayChecklist({
  dateKey,
  detailed = false,
}: {
  dateKey: string
  detailed?: boolean
}) {
  const { getDay, settings, toggleHabit, toggleBonus, updateDay } = useApp()
  const day = getDay(dateKey)
  const workoutDay = isWorkoutDay(dateKey, settings)

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {CORE_HABIT_KEYS.map((k) => {
          const isWorkout = k === 'workout'
          const disabled = isWorkout && !workoutDay
          return (
            <Checkbox
              key={k}
              checked={!!day.habits[k]}
              disabled={disabled}
              onChange={() => toggleHabit(dateKey, k)}
              label={HABIT_LABELS[k]}
              hint={disabled ? 'Rest day — not counted' : HABIT_HINTS[k]}
            />
          )
        })}
      </div>

      <div>
        <div className="label">Bonus (does not affect your score)</div>
        <Checkbox
          bonus
          checked={!!day.bonus.script}
          onChange={() => toggleBonus(dateKey, 'script')}
          label="Wrote a script / content idea"
        />
      </div>

      {detailed && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Walking minutes</label>
            <input
              type="number"
              min={0}
              className="field"
              value={day.walking.minutes || ''}
              onChange={(e) =>
                updateDay(dateKey, {
                  walking: { ...day.walking, minutes: Number(e.target.value) || 0 },
                })
              }
            />
          </div>
          <div>
            <label className="label">Distance (km)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              className="field"
              value={day.walking.distanceKm ?? ''}
              onChange={(e) =>
                updateDay(dateKey, {
                  walking: {
                    ...day.walking,
                    distanceKm: e.target.value === '' ? undefined : Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <label className="label">Steps</label>
            <input
              type="number"
              min={0}
              className="field"
              value={day.walking.steps ?? ''}
              onChange={(e) =>
                updateDay(dateKey, {
                  walking: {
                    ...day.walking,
                    steps: e.target.value === '' ? undefined : Number(e.target.value),
                  },
                })
              }
            />
          </div>
        </div>
      )}

      {detailed && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Listened — Surah</label>
            <input
              className="field"
              placeholder="e.g. An-Naba"
              value={day.listening.surah ?? ''}
              onChange={(e) =>
                updateDay(dateKey, {
                  listening: { ...day.listening, surah: e.target.value || undefined },
                })
              }
            />
          </div>
          <div>
            <label className="label">Reciter</label>
            <input
              className="field"
              placeholder="e.g. Al-Husary"
              value={day.listening.reciter ?? ''}
              onChange={(e) =>
                updateDay(dateKey, {
                  listening: { ...day.listening, reciter: e.target.value || undefined },
                })
              }
            />
          </div>
          <div>
            <label className="label">Minutes listened</label>
            <input
              type="number"
              min={0}
              className="field"
              value={day.listening.minutes ?? ''}
              onChange={(e) =>
                updateDay(dateKey, {
                  listening: {
                    ...day.listening,
                    minutes: e.target.value === '' ? undefined : Number(e.target.value),
                  },
                })
              }
            />
          </div>
        </div>
      )}

      <div>
        <label className="label">Note for this day</label>
        <textarea
          className="field min-h-[72px] resize-y"
          placeholder="Low energy today · Great workout · Memorization was difficult…"
          value={day.note}
          onChange={(e) => updateDay(dateKey, { note: e.target.value })}
        />
      </div>
    </div>
  )
}
