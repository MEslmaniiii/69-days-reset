import type { Habit, HabitCategory, HabitFrequency, TimeOfDay, Weekday } from '../types'
import { ALL_CATEGORIES, CATEGORY_LABELS, WEEKDAY_SHORT } from '../types'
import { Button } from './ui'
import { newId } from '../data/repo'

const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0] // Mon..Sun display
const TIMES: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'flexible']

export function newBlankHabit(sortOrder: number): Habit {
  return {
    id: newId(),
    name: '',
    category: 'other',
    frequency: 'daily',
    days: [],
    measurable: false,
    isActive: true,
    isPaused: false,
    sortOrder,
    createdAt: new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z',
  }
}

function HabitRow({
  habit,
  onChange,
  onDelete,
  showPause,
}: {
  habit: Habit
  onChange: (h: Habit) => void
  onDelete: () => void
  showPause?: boolean
}) {
  const set = (patch: Partial<Habit>) => onChange({ ...habit, ...patch })

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-start gap-2">
        <input
          className="field flex-1 font-medium"
          value={habit.name}
          placeholder="Habit name (e.g. Walk 30 minutes)"
          onChange={(e) => set({ name: e.target.value })}
        />
        <button
          onClick={onDelete}
          className="rounded-lg px-2 py-2 text-sage-400 hover:bg-red-500/10 hover:text-red-500"
          title="Delete habit"
          aria-label="Delete habit"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          className="field"
          value={habit.category}
          onChange={(e) => set({ category: e.target.value as HabitCategory })}
        >
          {ALL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select
          className="field"
          value={habit.frequency}
          onChange={(e) => set({ frequency: e.target.value as HabitFrequency })}
        >
          <option value="daily">Every day</option>
          <option value="weekly">X times / week</option>
          <option value="custom">Specific days</option>
        </select>
      </div>

      {habit.frequency === 'weekly' && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-sage-500">Times per week</span>
          <input
            type="number"
            min={1}
            max={7}
            className="field w-20"
            value={habit.weeklyTarget ?? 3}
            onChange={(e) => set({ weeklyTarget: Number(e.target.value) })}
          />
        </div>
      )}

      {habit.frequency === 'custom' && (
        <div className="flex flex-wrap gap-1.5">
          {WEEK_ORDER.map((d) => {
            const active = habit.days.includes(d)
            return (
              <button
                key={d}
                type="button"
                onClick={() =>
                  set({
                    days: active ? habit.days.filter((x) => x !== d) : [...habit.days, d],
                  })
                }
                className={`h-9 w-10 rounded-lg border text-xs font-medium transition-colors ${
                  active
                    ? 'border-sage-500 bg-sage-500 text-white'
                    : 'border-sage-200 text-sage-500 dark:border-white/10'
                }`}
              >
                {WEEKDAY_SHORT[d]}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-sage-600 dark:text-sage-300">
          <input
            type="checkbox"
            checked={habit.measurable}
            onChange={(e) => set({ measurable: e.target.checked })}
          />
          Measurable
        </label>
        {habit.measurable && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="field w-24"
              placeholder="Target"
              value={habit.targetValue ?? ''}
              onChange={(e) =>
                set({ targetValue: e.target.value === '' ? undefined : Number(e.target.value) })
              }
            />
            <input
              className="field w-24"
              placeholder="unit"
              value={habit.unit ?? ''}
              onChange={(e) => set({ unit: e.target.value || undefined })}
            />
          </div>
        )}
        <select
          className="field w-auto"
          value={habit.recommendedTime ?? 'flexible'}
          onChange={(e) => set({ recommendedTime: e.target.value as TimeOfDay })}
        >
          {TIMES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {showPause && (
          <label className="flex items-center gap-2 text-sm text-sage-600 dark:text-sage-300">
            <input
              type="checkbox"
              checked={habit.isPaused}
              onChange={(e) => set({ isPaused: e.target.checked })}
            />
            Paused
          </label>
        )}
      </div>
    </div>
  )
}

export default function HabitListEditor({
  habits,
  onChange,
  showPause,
}: {
  habits: Habit[]
  onChange: (habits: Habit[]) => void
  showPause?: boolean
}) {
  const update = (h: Habit) => onChange(habits.map((x) => (x.id === h.id ? h : x)))
  const remove = (id: string) => onChange(habits.filter((x) => x.id !== id))
  const add = () => onChange([...habits, newBlankHabit(habits.length)])

  return (
    <div className="space-y-3">
      {habits.map((h) => (
        <HabitRow
          key={h.id}
          habit={h}
          onChange={update}
          onDelete={() => remove(h.id)}
          showPause={showPause}
        />
      ))}
      <Button variant="outline" onClick={add} className="w-full">
        + Add habit
      </Button>
    </div>
  )
}
