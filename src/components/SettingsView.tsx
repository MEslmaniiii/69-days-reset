import { useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import type { MealSuggestions, NutritionMode, Theme, Weekday } from '../types'
import { exportCSV, exportJSON, importJSON } from '../lib/storage'
import { freshData } from '../lib/defaults'
import { SectionTitle } from './ui'

const WEEKDAYS: { d: Weekday; label: string }[] = [
  { d: 6, label: 'Sat' },
  { d: 0, label: 'Sun' },
  { d: 1, label: 'Mon' },
  { d: 2, label: 'Tue' },
  { d: 3, label: 'Wed' },
  { d: 4, label: 'Thu' },
  { d: 5, label: 'Fri' },
]

export function SettingsView() {
  const { data, settings, updateSettings, replaceData } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  function toggleWorkoutDay(d: Weekday) {
    const has = settings.workoutDays.includes(d)
    const next = has
      ? settings.workoutDays.filter((x) => x !== d)
      : [...settings.workoutDays, d].sort((a, b) => a - b)
    updateSettings({ workoutDays: next })
  }

  function updateMealSuggestions(patch: Partial<MealSuggestions>) {
    updateSettings({ mealSuggestions: { ...settings.mealSuggestions, ...patch } })
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importJSON(file)
      replaceData(imported)
      flash('Backup imported ✓')
    } catch {
      flash('Could not read that file.')
    }
    e.target.value = ''
  }

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <SectionTitle>Challenge</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <input
              className="field"
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
            />
          </Field>
          <Field label="Challenge name">
            <input
              className="field"
              value={settings.challengeName}
              onChange={(e) => updateSettings({ challengeName: e.target.value })}
            />
          </Field>
          <Field label="Start date">
            <input
              type="date"
              className="field"
              value={settings.startDate}
              onChange={(e) => updateSettings({ startDate: e.target.value })}
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              className="field"
              value={settings.endDate}
              onChange={(e) => updateSettings({ endDate: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-4">
          <label className="label">Workout days</label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((w) => {
              const active = settings.workoutDays.includes(w.d)
              return (
                <button
                  key={w.d}
                  onClick={() => toggleWorkoutDay(w.d)}
                  className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-sage-600 text-white'
                      : 'bg-sage-100 dark:bg-white/5 text-sage-600 dark:text-sage-300'
                  }`}
                >
                  {w.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <SectionTitle>Walking & appearance</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Walking base minutes (week 1)">
            <input
              type="number"
              min={5}
              className="field"
              value={settings.walkingBaseMinutes}
              onChange={(e) =>
                updateSettings({ walkingBaseMinutes: Math.max(5, Number(e.target.value)) })
              }
            />
          </Field>
          <Field label="Theme">
            <select
              className="field"
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as Theme })}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="card p-5">
        <SectionTitle sub="Keep it simple — exact gram tracking is never required.">
          Nutrition
        </SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Protein min (g)">
            <input
              type="number"
              min={0}
              className="field"
              value={settings.proteinTargetMin}
              onChange={(e) =>
                updateSettings({ proteinTargetMin: Math.max(0, Number(e.target.value)) })
              }
            />
          </Field>
          <Field label="Protein max (g)">
            <input
              type="number"
              min={0}
              className="field"
              value={settings.proteinTargetMax}
              onChange={(e) =>
                updateSettings({ proteinTargetMax: Math.max(0, Number(e.target.value)) })
              }
            />
          </Field>
          <Field label="Water target (L)">
            <input
              type="number"
              min={0}
              step={0.1}
              className="field"
              value={(settings.waterTargetMl / 1000).toString()}
              onChange={(e) =>
                updateSettings({ waterTargetMl: Math.round(Number(e.target.value) * 1000) })
              }
            />
          </Field>
          <Field label="Protein tracking">
            <select
              className="field"
              value={settings.nutritionMode}
              onChange={(e) => updateSettings({ nutritionMode: e.target.value as NutritionMode })}
            >
              <option value="simple">Simple (checkbox)</option>
              <option value="detailed">Detailed (grams)</option>
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <label className="label">
            Lifestyle score weights — Core {settings.coreWeight}% · Nutrition{' '}
            {settings.nutritionWeight}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={settings.coreWeight}
            onChange={(e) => {
              const core = Number(e.target.value)
              updateSettings({ coreWeight: core, nutritionWeight: 100 - core })
            }}
            className="w-full accent-sage-600"
          />
          <p className="mt-1 text-xs text-sage-400">
            Overall Lifestyle % = Core × {settings.coreWeight}% + Nutrition ×{' '}
            {settings.nutritionWeight}%.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <p className="label !mb-0">Meal suggestions (one per line)</p>
          <MealSuggestionEditor
            label="Breakfast"
            value={settings.mealSuggestions.breakfast}
            onChange={(breakfast) => updateMealSuggestions({ breakfast })}
          />
          <MealSuggestionEditor
            label="Work Snack"
            value={settings.mealSuggestions.snack}
            onChange={(snack) => updateMealSuggestions({ snack })}
          />
          <MealSuggestionEditor
            label="Dinner"
            value={settings.mealSuggestions.dinner}
            onChange={(dinner) => updateMealSuggestions({ dinner })}
          />
        </div>
      </section>

      <section className="card p-5">
        <SectionTitle sub="Everything is stored locally in your browser. Back it up any time.">
          Your data
        </SectionTitle>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => exportJSON(data)}>
            Export JSON
          </button>
          <button className="btn-ghost border border-sage-200 dark:border-white/10" onClick={() => exportCSV(data)}>
            Export CSV
          </button>
          <button
            className="btn-ghost border border-sage-200 dark:border-white/10"
            onClick={() => fileRef.current?.click()}
          >
            Import backup (JSON)
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
          <button
            className="btn-ghost border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400"
            onClick={() => {
              if (confirm('Erase all tracked data and start over? This cannot be undone.')) {
                replaceData(freshData(settings))
                flash('Data reset.')
              }
            }}
          >
            Reset all data
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-sage-500 animate-fadein">{msg}</p>}
      </section>
    </div>
  )
}

function MealSuggestionEditor({
  label,
  value,
  onChange,
}: {
  label: string
  value: string[]
  onChange: (next: string[]) => void
}) {
  // Use a local editable string so the user can type blank lines mid-edit.
  const [text, setText] = useState(value.join('\n'))
  return (
    <div>
      <label className="label">{label}</label>
      <textarea
        className="field min-h-[80px] resize-y text-sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() =>
          onChange(
            text
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
      />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}
