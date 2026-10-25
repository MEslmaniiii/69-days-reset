import { useMemo, useState } from 'react'
import { useApp } from '../state/AppContext'
import type { MealLog, MealType, WeightEntry } from '../types'
import { MEAL_TYPES } from '../types'
import { FOOD_RULES, PLATE_METHOD, WATER_STEPS } from '../lib/defaults'
import {
  nutritionBestStreak,
  nutritionCurrentStreak,
  nutritionDayRatio,
  nutritionItemPct,
  nutritionOverallPct,
  nutritionTodayPct,
  nutritionWeeklyPct,
  proteinDone,
  waterDone,
} from '../lib/progress'
import { fromKey, shortDate } from '../lib/dates'
import { Checkbox, LabeledBar, ProgressBar, SectionTitle, StatCard } from './ui'

export function NutritionView() {
  const { today } = useApp()
  return (
    <div className="space-y-6">
      <NutritionChecklistCard dateKey={today} />
      <MealGuideCard dateKey={today} />
      <RulesCard />
      <NutritionProgressCard />
      <WeightCard />
    </div>
  )
}

// ---------------- Checklist + water + protein ----------------

export function NutritionChecklistCard({ dateKey }: { dateKey: string }) {
  const { data, settings, getNutrition, toggleNutrition } = useApp()
  const nut = getNutrition(dateKey)
  const pct = nutritionTodayPct(data, settings, dateKey)
  const r = nutritionDayRatio(data, settings, dateKey)

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <SectionTitle sub="Quick checkboxes — aim to log in under a minute.">
          Nutrition Today
        </SectionTitle>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums text-sage-600 dark:text-sage-300">
            {pct}%
          </div>
          <div className="text-xs text-sage-400">{r.completed}/7 items</div>
        </div>
      </div>

      <div className="space-y-2">
        <Checkbox
          checked={!!nut.checklist.breakfast}
          onChange={() => toggleNutrition(dateKey, 'breakfast')}
          label="Healthy Breakfast"
        />
        <Checkbox
          checked={!!nut.checklist.snack}
          onChange={() => toggleNutrition(dateKey, 'snack')}
          label="Healthy Work Snack"
        />
        <Checkbox
          checked={!!nut.checklist.lunch}
          onChange={() => toggleNutrition(dateKey, 'lunch')}
          label="Balanced Lunch"
          hint="Flexible — plate method, not strict recipes"
        />
        <Checkbox
          checked={!!nut.checklist.dinner}
          onChange={() => toggleNutrition(dateKey, 'dinner')}
          label="Healthy Dinner"
        />

        <ProteinControl dateKey={dateKey} />

        <Checkbox
          checked={!!nut.checklist.noSugaryDrinks}
          onChange={() => toggleNutrition(dateKey, 'noSugaryDrinks')}
          label="No Sugary Drinks"
        />
      </div>

      <WaterTracker dateKey={dateKey} />
    </section>
  )
}

function ProteinControl({ dateKey }: { dateKey: string }) {
  const { settings, getNutrition, toggleNutrition, updateNutrition } = useApp()
  const nut = getNutrition(dateKey)
  const done = proteinDone(nut, settings)

  if (settings.nutritionMode === 'simple') {
    return (
      <Checkbox
        checked={!!nut.checklist.protein}
        onChange={() => toggleNutrition(dateKey, 'protein')}
        label="Protein Target"
        hint={`${settings.proteinTargetMin}–${settings.proteinTargetMax} g · simple mode`}
      />
    )
  }

  // Detailed mode: enter grams, auto-satisfies when ≥ target min
  return (
    <div
      className={`rounded-xl border px-3.5 py-3 transition-colors ${
        done
          ? 'border-sage-400/50 bg-sage-50 dark:bg-sage-500/10 dark:border-sage-500/40'
          : 'border-sage-200 dark:border-white/10'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-sage-800 dark:text-sage-100">Protein Target</div>
          <div className="text-xs text-sage-400">
            Goal {settings.proteinTargetMin}–{settings.proteinTargetMax} g · detailed mode
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            className="field w-24 text-right"
            placeholder="g"
            value={nut.proteinGrams ?? ''}
            onChange={(e) =>
              updateNutrition(dateKey, {
                proteinGrams: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
          />
          <span className="text-sm text-sage-400">g</span>
        </div>
      </div>
      <div className="mt-2">
        <ProgressBar
          pct={Math.min(100, ((nut.proteinGrams ?? 0) / settings.proteinTargetMin) * 100)}
          size="sm"
          tone={done ? 'sage' : 'muted'}
        />
      </div>
    </div>
  )
}

function WaterTracker({ dateKey }: { dateKey: string }) {
  const { settings, getNutrition, addWater, updateNutrition } = useApp()
  const nut = getNutrition(dateKey)
  const target = settings.waterTargetMl
  const ml = nut.waterMl ?? 0
  const pct = target > 0 ? Math.min(100, (ml / target) * 100) : 0
  const done = waterDone(nut, settings)

  return (
    <div className="mt-4 rounded-xl border border-sage-200 dark:border-white/10 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium text-sage-800 dark:text-sage-100">
          Water Target {done && <span className="text-sage-500">· reached ✓</span>}
        </span>
        <span className="text-sm font-semibold tabular-nums text-sage-600 dark:text-sage-300">
          {(ml / 1000).toFixed(1)} / {(target / 1000).toFixed(1)} L
        </span>
      </div>
      <ProgressBar pct={pct} size="lg" tone={done ? 'sage' : 'muted'} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {WATER_STEPS.map((step) => (
          <button
            key={step}
            className="btn-ghost border border-sage-200 dark:border-white/10"
            onClick={() => addWater(dateKey, step)}
          >
            +{step} ml
          </button>
        ))}
        <button
          className="btn-ghost text-sage-500"
          onClick={() => addWater(dateKey, -250)}
          disabled={ml <= 0}
        >
          −250 ml
        </button>
        <button
          className="btn-ghost text-sage-400 ml-auto"
          onClick={() => updateNutrition(dateKey, { waterMl: 0 })}
          disabled={ml <= 0}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

// ---------------- Meal guide + logging ----------------

function MealGuideCard({ dateKey }: { dateKey: string }) {
  const { settings, getNutrition, updateNutrition } = useApp()
  const nut = getNutrition(dateKey)

  function mealOf(type: MealType): MealLog | undefined {
    return nut.meals.find((m) => m.type === type)
  }

  function upsertMeal(type: MealType, patch: Partial<MealLog>) {
    const meals = [...nut.meals]
    const i = meals.findIndex((m) => m.type === type)
    const existing: MealLog = i >= 0 ? meals[i] : { id: type, type, description: '' }
    const next = { ...existing, ...patch }
    if (i >= 0) meals[i] = next
    else meals.push(next)
    updateNutrition(dateKey, { meals })
  }

  const suggestionsFor = (type: MealType): string[] => {
    if (type === 'breakfast') return settings.mealSuggestions.breakfast
    if (type === 'snack') return settings.mealSuggestions.snack
    if (type === 'dinner') return settings.mealSuggestions.dinner
    return [] // lunch uses the plate method instead
  }

  return (
    <section className="card p-5">
      <SectionTitle sub="Pick a suggestion or write your own. Logging is optional.">
        Meals & guide
      </SectionTitle>
      <div className="space-y-4">
        {MEAL_TYPES.map(({ type, label }) => {
          const meal = mealOf(type)
          const suggestions = suggestionsFor(type)
          return (
            <div key={type} className="rounded-xl border border-sage-200 dark:border-white/10 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sage-900 dark:text-white">{label}</h3>
                <span className="text-xs text-sage-400">
                  {type === 'breakfast' && 'Protein + moderate carbs + veg/fruit'}
                  {type === 'snack' && 'Protein-based is best'}
                  {type === 'lunch' && 'Flexible — plate method'}
                  {type === 'dinner' && 'Lighter, protein-focused'}
                </span>
              </div>

              {type === 'lunch' ? (
                <ul className="mt-2 space-y-0.5">
                  {PLATE_METHOD.map((p) => (
                    <li key={p} className="text-sm text-sage-600 dark:text-sage-300">
                      • {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => upsertMeal(type, { description: s })}
                      className="rounded-lg bg-sage-50 dark:bg-white/5 px-2.5 py-1 text-left text-xs text-sage-600 dark:text-sage-300 hover:bg-sage-100 dark:hover:bg-white/10"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 space-y-2">
                <input
                  className="field"
                  placeholder={
                    type === 'lunch'
                      ? 'e.g. Chicken + rice · Molokhia + chicken'
                      : 'What did you eat?'
                  }
                  value={meal?.description ?? ''}
                  onChange={(e) => upsertMeal(type, { description: e.target.value })}
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="number"
                    min={0}
                    className="field"
                    placeholder="Protein (g) — optional"
                    value={meal?.proteinGrams ?? ''}
                    onChange={(e) =>
                      upsertMeal(type, {
                        proteinGrams: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                  />
                  <input
                    className="field"
                    placeholder="Notes — optional"
                    value={meal?.notes ?? ''}
                    onChange={(e) => upsertMeal(type, { notes: e.target.value || undefined })}
                  />
                </div>
                <p className="text-[11px] text-sage-400">
                  📷 Photo logging is reserved for a future update.
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ---------------- My rules ----------------

function RulesCard() {
  return (
    <section className="card p-5">
      <SectionTitle sub="Calm guidelines, not rules to punish yourself with.">My Rules</SectionTitle>
      <ol className="space-y-2">
        {FOOD_RULES.map((rule, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-sage-100 dark:bg-white/10 text-xs font-semibold text-sage-600 dark:text-sage-300">
              {i + 1}
            </span>
            <span className="pt-0.5 text-sm text-sage-700 dark:text-sage-200">{rule}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ---------------- Nutrition progress ----------------

function NutritionProgressCard() {
  const { data, settings, today } = useApp()
  return (
    <section className="card p-5">
      <SectionTitle>Nutrition progress</SectionTitle>
      <div className="space-y-4">
        <LabeledBar label="Today" pct={nutritionTodayPct(data, settings, today)} />
        <LabeledBar label="This week" pct={nutritionWeeklyPct(data, settings, today)} />
        <LabeledBar label="Overall" pct={nutritionOverallPct(data, settings, today)} tone="gold" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Breakfast" value={`${nutritionItemPct(data, settings, today, 'breakfast')}%`} />
        <StatCard label="Snack" value={`${nutritionItemPct(data, settings, today, 'snack')}%`} />
        <StatCard label="Dinner" value={`${nutritionItemPct(data, settings, today, 'dinner')}%`} />
        <StatCard label="Protein" value={`${nutritionItemPct(data, settings, today, 'protein')}%`} />
        <StatCard label="Water" value={`${nutritionItemPct(data, settings, today, 'water')}%`} />
        <StatCard
          label="Best streak"
          value={`${nutritionBestStreak(data, settings, today)}d`}
          sub={`current ${nutritionCurrentStreak(data, settings, today)}d`}
          accent
        />
      </div>
      <p className="mt-3 text-xs text-sage-400">
        A bad nutrition day never resets your challenge — streaks just pause, and you pick up again.
      </p>
    </section>
  )
}

// ---------------- Weight tracking ----------------

function WeightCard() {
  const { data, today, setWeight, removeWeight } = useApp()
  const [weight, setWeightInput] = useState('')
  const [waist, setWaist] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [date, setDate] = useState(today)

  const entries = useMemo(
    () => Object.values(data.weights).sort((a, b) => a.date.localeCompare(b.date)),
    [data.weights],
  )

  const latest = entries[entries.length - 1]
  const first = entries[0]
  const change = latest && first ? latest.weightKg - first.weightKg : 0

  // Weekly averages (if enough measurements)
  const weeklyAvg = useMemo(() => computeWeeklyAverages(entries), [entries])

  function add() {
    const w = Number(weight)
    if (!date || !w) return
    const entry: WeightEntry = {
      date,
      weightKg: w,
      waistCm: waist ? Number(waist) : undefined,
      bodyFatPct: bodyFat ? Number(bodyFat) : undefined,
    }
    setWeight(entry)
    setWeightInput('')
    setWaist('')
    setBodyFat('')
  }

  return (
    <section className="card p-5">
      <SectionTitle sub="Optional. No daily weighing needed — track the trend, not the noise.">
        Weight & measurements
      </SectionTitle>

      {entries.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Latest" value={`${latest.weightKg} kg`} accent />
          <StatCard
            label="Change"
            value={`${change > 0 ? '+' : ''}${change.toFixed(1)} kg`}
            sub="since first entry"
          />
          <StatCard label="Entries" value={entries.length} />
          <StatCard
            label="Weekly avg"
            value={weeklyAvg.length ? `${weeklyAvg[weeklyAvg.length - 1].avg.toFixed(1)} kg` : '—'}
            sub={weeklyAvg.length >= 2 ? 'last week' : 'need more'}
          />
        </div>
      )}

      {entries.length >= 2 ? (
        <WeightChart entries={entries} weeklyAvg={weeklyAvg} />
      ) : (
        <p className="rounded-xl bg-sage-50 dark:bg-white/5 px-4 py-6 text-center text-sm text-sage-500 dark:text-sage-400">
          Add at least two measurements to see your trend line.
        </p>
      )}

      {/* Entry form */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="label">Date</label>
          <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Weight (kg)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            className="field"
            value={weight}
            onChange={(e) => setWeightInput(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Waist (cm)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            className="field"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Body fat (%)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            className="field"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
          />
        </div>
      </div>
      <button className="btn-primary mt-3" onClick={add} disabled={!weight}>
        Save measurement
      </button>

      {entries.length > 0 && (
        <div className="mt-5 max-h-56 overflow-y-auto rounded-xl border border-sage-200 dark:border-white/10">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-sage-100 dark:divide-white/5">
              {[...entries].reverse().map((e) => (
                <tr key={e.date}>
                  <td className="px-3 py-2 text-sage-500 dark:text-sage-400">{shortDate(e.date)}</td>
                  <td className="px-3 py-2 font-medium text-sage-800 dark:text-sage-100">
                    {e.weightKg} kg
                  </td>
                  <td className="px-3 py-2 text-sage-500 dark:text-sage-400">
                    {e.waistCm ? `${e.waistCm} cm` : ''}
                    {e.bodyFatPct ? `${e.waistCm ? ' · ' : ''}${e.bodyFatPct}% bf` : ''}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="text-xs text-rose-500/80 hover:text-rose-500"
                      onClick={() => removeWeight(e.date)}
                    >
                      remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

interface WeeklyAvg {
  label: string
  avg: number
}

function computeWeeklyAverages(entries: WeightEntry[]): WeeklyAvg[] {
  if (entries.length === 0) return []
  // Group by ISO week number (year-week)
  const groups = new Map<string, number[]>()
  for (const e of entries) {
    const d = fromKey(e.date)
    const key = `${d.getFullYear()}-W${isoWeek(d)}`
    const arr = groups.get(key) ?? []
    arr.push(e.weightKg)
    groups.set(key, arr)
  }
  return [...groups.entries()].map(([label, vals]) => ({
    label,
    avg: vals.reduce((s, v) => s + v, 0) / vals.length,
  }))
}

function isoWeek(d: Date): number {
  const date = new Date(d.getTime())
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
    )
  )
}

function WeightChart({ entries }: { entries: WeightEntry[]; weeklyAvg: WeeklyAvg[] }) {
  const W = 600
  const H = 180
  const pad = { top: 16, right: 12, bottom: 24, left: 36 }

  const xs = entries.map((e) => fromKey(e.date).getTime())
  const ys = entries.map((e) => e.weightKg)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const padY = Math.max(0.5, (maxY - minY) * 0.15)
  const loY = minY - padY
  const hiY = maxY + padY

  const sx = (t: number) =>
    pad.left + (maxX === minX ? 0 : ((t - minX) / (maxX - minX)) * (W - pad.left - pad.right))
  const sy = (v: number) =>
    pad.top + (hiY === loY ? 0 : (1 - (v - loY) / (hiY - loY)) * (H - pad.top - pad.bottom))

  const line = entries.map((e, i) => `${i === 0 ? 'M' : 'L'} ${sx(xs[i])} ${sy(e.weightKg)}`).join(' ')

  // y gridlines
  const ticks = 3
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => loY + ((hiY - loY) * i) / ticks)

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[320px] w-full" role="img" aria-label="Weight trend">
        {tickVals.map((v, i) => (
          <g key={i}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={sy(v)}
              y2={sy(v)}
              className="stroke-sage-100 dark:stroke-white/10"
              strokeWidth={1}
            />
            <text x={4} y={sy(v) + 3} className="fill-sage-400 text-[9px]">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        <path d={line} className="fill-none stroke-sage-500" strokeWidth={2} strokeLinejoin="round" />
        {entries.map((e, i) => (
          <circle key={e.date} cx={sx(xs[i])} cy={sy(e.weightKg)} r={3} className="fill-sage-500" />
        ))}
        {/* first & last date labels */}
        <text x={pad.left} y={H - 6} className="fill-sage-400 text-[9px]">
          {shortDate(entries[0].date)}
        </text>
        <text x={W - pad.right} y={H - 6} textAnchor="end" className="fill-sage-400 text-[9px]">
          {shortDate(entries[entries.length - 1].date)}
        </text>
      </svg>
    </div>
  )
}
