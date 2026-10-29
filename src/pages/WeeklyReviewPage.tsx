import { useMemo, useState } from 'react'
import { useAuth } from '../state/AuthContext'
import { useData } from '../state/DataContext'
import { buildLogMap, weekStats } from '../lib/progress'
import { todayKey, weekStart, shortDate, weekEnd } from '../lib/dates'
import { getCoachAdvice } from '../lib/api'
import { track } from '../lib/analytics'
import { Button, Field, LabeledBar, SectionTitle, StatCard } from '../components/ui'

export default function WeeklyReviewPage() {
  const { data, saveReview } = useData()
  const { user } = useAuth()
  const today = todayKey(data?.profile.schedule?.timezone)
  const ws = weekStart(today)
  const logMap = useMemo(() => buildLogMap(data?.logs ?? []), [data?.logs])
  const lightDays = useMemo(() => new Set(data?.profile.lightDays ?? []), [data?.profile.lightDays])

  const existing = data?.reviews.find((r) => r.weekStart === ws)
  const [wentWell, setWentWell] = useState(existing?.wentWell ?? '')
  const [difficult, setDifficult] = useState(existing?.difficult ?? '')
  const [changed, setChanged] = useState(existing?.changed ?? '')
  const [suggestions, setSuggestions] = useState<string[]>(existing?.aiSuggestions ?? [])
  const [loadingAi, setLoadingAi] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!data) return null

  const stats = weekStats(data.habits, logMap, ws, today, lightDays)

  const getSuggestions = async () => {
    setLoadingAi(true)
    const context = [
      `Goals: ${data.goals.map((g) => g.title).join(', ') || 'general'}`,
      `This week consistency: ${stats.consistencyPct}%`,
      `Best habit: ${stats.bestHabit?.name ?? 'n/a'} (${stats.bestHabit?.pct ?? 0}%)`,
      `Most missed: ${stats.mostMissed?.name ?? 'n/a'} (${stats.mostMissed?.pct ?? 0}%)`,
      wentWell && `Went well: ${wentWell}`,
      difficult && `Difficult: ${difficult}`,
    ]
      .filter(Boolean)
      .join('\n')
    const advice = await getCoachAdvice(context)
    setSuggestions(advice.split('\n').map((s) => s.trim()).filter(Boolean))
    setLoadingAi(false)
  }

  const save = async () => {
    setSaving(true)
    await saveReview({
      weekStart: ws,
      score: stats.consistencyPct,
      bestHabit: stats.bestHabit?.name,
      mostMissedHabit: stats.mostMissed?.name,
      consistencyPct: stats.consistencyPct,
      wentWell,
      difficult,
      changed,
      aiSuggestions: suggestions.length ? suggestions : undefined,
      createdAt: new Date().toISOString(),
    })
    track('weekly_review_completed', { consistency: stats.consistencyPct }, user?.id)
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="space-y-6">
      <SectionTitle sub={`${shortDate(ws)} – ${shortDate(weekEnd(ws))}`}>Weekly review</SectionTitle>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Weekly score" value={`${stats.consistencyPct}%`} accent />
        <StatCard label="Best habit" value={stats.bestHabit?.name ?? '—'} sub={stats.bestHabit ? `${stats.bestHabit.pct}%` : undefined} />
        <StatCard label="Most missed" value={stats.mostMissed?.name ?? '—'} sub={stats.mostMissed ? `${stats.mostMissed.pct}%` : undefined} />
      </section>

      {stats.perHabit.length > 0 && (
        <section className="card space-y-3 p-5">
          <div className="text-sm font-medium text-sage-700 dark:text-sage-200">Per-habit this week</div>
          {stats.perHabit.map((h) => (
            <LabeledBar key={h.id} label={h.name} pct={h.pct} />
          ))}
        </section>
      )}

      <section className="space-y-4">
        <Field label="What went well?">
          <textarea className="field min-h-[80px]" value={wentWell} onChange={(e) => setWentWell(e.target.value)} />
        </Field>
        <Field label="What was difficult?">
          <textarea className="field min-h-[80px]" value={difficult} onChange={(e) => setDifficult(e.target.value)} />
        </Field>
        <Field label="What changed this week?">
          <textarea className="field min-h-[80px]" value={changed} onChange={(e) => setChanged(e.target.value)} />
        </Field>
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-sage-700 dark:text-sage-200">AI suggestions</span>
          <Button variant="outline" onClick={getSuggestions} loading={loadingAi}>
            {suggestions.length ? 'Refresh' : 'Get suggestions'}
          </Button>
        </div>
        {suggestions.length > 0 ? (
          <ul className="space-y-1.5 text-sm text-sage-600 dark:text-sage-300">
            {suggestions.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-sage-400">•</span>
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-sage-400">
            Small, practical adjustments based on your week. You decide what to apply.
          </p>
        )}
      </section>

      <Button onClick={save} loading={saving} className="w-full">
        {saved ? 'Saved ✓' : 'Save review'}
      </Button>
    </div>
  )
}
