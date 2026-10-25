import { useMemo, useState } from 'react'
import { useData } from '../state/DataContext'
import { buildLogMap, overallProgressPct, weekProgressPct, weekStats } from '../lib/progress'
import { todayKey, weekStart } from '../lib/dates'
import { getCoachAdvice } from '../lib/api'
import { Button, SectionTitle } from '../components/ui'

export default function CoachPage() {
  const { data } = useData()
  const today = todayKey()
  const logMap = useMemo(() => buildLogMap(data?.logs ?? []), [data?.logs])
  const [advice, setAdvice] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  if (!data) return null

  const ask = async () => {
    setLoading(true)
    const stats = weekStats(data.habits, logMap, weekStart(today), today)
    // Context is intentionally non-PII: goals + aggregate completion only.
    const context = [
      `Goals: ${data.goals.map((g) => g.title).join(', ') || 'general self-improvement'}`,
      `Active habits: ${data.habits.filter((h) => h.isActive && !h.isPaused).length}`,
      `This week consistency: ${weekProgressPct(data.habits, logMap, today)}%`,
      `Overall progress: ${overallProgressPct(data.habits, logMap, data.profile.campaignStart || today, today)}%`,
      `Strongest: ${stats.bestHabit?.name ?? 'n/a'}`,
      `Weakest: ${stats.mostMissed?.name ?? 'n/a'}`,
    ].join('\n')
    const res = await getCoachAdvice(context)
    setAdvice(res.split('\n').map((s) => s.trim()).filter(Boolean))
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <SectionTitle sub="Practical, concise guidance based on your goals and recent consistency.">
        AI Coach
      </SectionTitle>

      <div className="card p-5">
        {advice.length === 0 ? (
          <p className="text-sm text-sage-500 dark:text-sage-400">
            Ask your coach for a quick read on how your week is going and what to adjust.
          </p>
        ) : (
          <ul className="space-y-2 text-sm text-sage-700 dark:text-sage-200">
            {advice.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-sage-400">•</span>
                {a}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button onClick={ask} loading={loading} className="w-full">
        {advice.length ? 'Ask again' : 'Ask the coach'}
      </Button>

      <p className="text-center text-xs text-sage-400">
        Your name, phone, and bio are never sent to the AI — only your goals and progress numbers.
      </p>
    </div>
  )
}
