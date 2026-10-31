import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { weekEnd, weekStart, shortDate, prettyDate } from '../lib/dates'
import { nutritionWeekStats, weekStats } from '../lib/progress'
import type { WeeklyReview as Review } from '../types'
import { LabeledBar, SectionTitle } from './ui'

const EMPTY_REVIEW: Review = {
  wentWell: '',
  difficult: '',
  change: '',
  hardestMeal: '',
  hungerChange: '',
  energyChange: '',
  discomfortFood: '',
}

export function WeeklyReview() {
  const { data, settings, today, saveReview } = useApp()
  const friday = weekEnd(today)
  const start = weekStart(today)
  const stats = weekStats(data, settings, today)
  const nut = nutritionWeekStats(data, settings, today)

  const existing = { ...EMPTY_REVIEW, ...(data.reviews[friday] ?? {}) }
  const [form, setForm] = useState<Review>(existing)
  const [saved, setSaved] = useState(false)

  function save() {
    saveReview(friday, form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <SectionTitle sub={`Week of ${shortDate(start)} – ${shortDate(friday)}`}>
          Weekly Review
        </SectionTitle>
        <div className="space-y-4">
          <LabeledBar label="Fajr in mosque" pct={stats.fajr} />
          <LabeledBar label="Workout" pct={stats.workout} />
          <LabeledBar label="Quran Wird" pct={stats.wird} />
          <LabeledBar label="French" pct={stats.french} />
          <LabeledBar label="Learn AI" pct={stats.aiLearning} />
          <div className="pt-1 border-t border-sage-100 dark:border-white/5">
            <LabeledBar label="Overall routine this week" pct={stats.overall} tone="gold" />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <SectionTitle sub="Separate from the core routine score.">Nutrition this week</SectionTitle>
        <div className="space-y-4">
          <LabeledBar label="Breakfast" pct={nut.breakfast} />
          <LabeledBar label="Snack" pct={nut.snack} />
          <LabeledBar label="Dinner" pct={nut.dinner} />
          <LabeledBar label="Protein" pct={nut.protein} />
          <LabeledBar label="Water" pct={nut.water} />
          <div className="pt-1 border-t border-sage-100 dark:border-white/5">
            <LabeledBar label="Overall nutrition this week" pct={nut.overall} tone="gold" />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <SectionTitle sub="Short questions. Keep it simple — all optional.">Reflect</SectionTitle>
        <div className="space-y-4">
          <div>
            <label className="label">What went well this week?</label>
            <textarea
              className="field min-h-[64px] resize-y"
              value={form.wentWell}
              onChange={(e) => setForm({ ...form, wentWell: e.target.value })}
            />
          </div>
          <div>
            <label className="label">What made the routine difficult?</label>
            <textarea
              className="field min-h-[64px] resize-y"
              value={form.difficult}
              onChange={(e) => setForm({ ...form, difficult: e.target.value })}
            />
          </div>
          <div>
            <label className="label">What should you change next week?</label>
            <textarea
              className="field min-h-[64px] resize-y"
              value={form.change}
              onChange={(e) => setForm({ ...form, change: e.target.value })}
            />
          </div>

          <div className="pt-1 border-t border-sage-100 dark:border-white/5">
            <p className="label !mb-3">Nutrition (optional)</p>
            <div className="space-y-4">
              <div>
                <label className="label">Which meal was hardest to control?</label>
                <input
                  className="field"
                  value={form.hardestMeal ?? ''}
                  onChange={(e) => setForm({ ...form, hardestMeal: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Did hunger increase this week?</label>
                <input
                  className="field"
                  value={form.hungerChange ?? ''}
                  onChange={(e) => setForm({ ...form, hungerChange: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Did energy improve or decrease?</label>
                <input
                  className="field"
                  value={form.energyChange ?? ''}
                  onChange={(e) => setForm({ ...form, energyChange: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Any food that caused bloating or discomfort?</label>
                <input
                  className="field"
                  value={form.discomfortFood ?? ''}
                  onChange={(e) => setForm({ ...form, discomfortFood: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="btn-primary" onClick={save}>
              Save review
            </button>
            {saved && <span className="text-sm text-sage-500 animate-fadein">Saved ✓</span>}
          </div>
        </div>
      </section>

      {Object.keys(data.reviews).length > 0 && (
        <section className="card p-5">
          <SectionTitle>Past reviews</SectionTitle>
          <div className="space-y-4">
            {Object.entries(data.reviews)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([key, r]) => (
                <div
                  key={key}
                  className="rounded-xl border border-sage-200 dark:border-white/10 p-4"
                >
                  <div className="text-xs font-medium uppercase tracking-wide text-sage-500 dark:text-sage-400">
                    Week ending {prettyDate(key)}
                  </div>
                  <dl className="mt-2 space-y-1.5 text-sm">
                    {r.wentWell && (
                      <Entry term="Went well" desc={r.wentWell} />
                    )}
                    {r.difficult && <Entry term="Difficult" desc={r.difficult} />}
                    {r.change && <Entry term="Change" desc={r.change} />}
                    {r.hardestMeal && <Entry term="Hardest meal" desc={r.hardestMeal} />}
                    {r.hungerChange && <Entry term="Hunger" desc={r.hungerChange} />}
                    {r.energyChange && <Entry term="Energy" desc={r.energyChange} />}
                    {r.discomfortFood && <Entry term="Discomfort" desc={r.discomfortFood} />}
                  </dl>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Entry({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="flex gap-2">
      <dt className="flex-none font-medium text-sage-500 dark:text-sage-400">{term}:</dt>
      <dd className="text-sage-700 dark:text-sage-200">{desc}</dd>
    </div>
  )
}
