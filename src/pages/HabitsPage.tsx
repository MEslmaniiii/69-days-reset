import { useEffect, useState } from 'react'
import { useData, proposedToHabit } from '../state/DataContext'
import type { Habit } from '../types'
import { generatePlan } from '../lib/api'
import { todayKey } from '../lib/dates'
import { Button, SectionTitle } from '../components/ui'
import HabitListEditor from '../components/HabitEditor'

export default function HabitsPage() {
  const { data, setHabits } = useData()
  const [local, setLocal] = useState<Habit[]>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (data) setLocal(data.habits)
  }, [data])

  if (!data) return null

  const onChange = (h: Habit[]) => {
    setLocal(h)
    setDirty(true)
    setMsg(null)
  }

  const save = async () => {
    setSaving(true)
    const cleaned = local.filter((h) => h.name.trim()).map((h, i) => ({ ...h, sortOrder: i }))
    await setHabits(cleaned)
    setLocal(cleaned)
    setSaving(false)
    setDirty(false)
    setMsg('Saved. Your progress history is kept.')
  }

  const rerun = async () => {
    setRegenerating(true)
    setMsg(null)
    try {
      const plan = await generatePlan({
        bio: data.profile.bio,
        goals: data.goals.map((g) => ({ title: g.title, category: g.category, details: g.details })),
        schedule: data.profile.schedule,
        campaignEnd: data.profile.campaignEnd,
        today: todayKey(),
      })
      const existingNames = new Set(local.map((h) => h.name.toLowerCase()))
      const createdAt = new Date().toISOString()
      let i = local.length
      const fresh = [...plan.dailyHabits, ...plan.weeklyHabits]
        .filter((p) => !existingNames.has(p.name.toLowerCase()))
        .map((p) => proposedToHabit(p, i++, createdAt))
      if (fresh.length === 0) {
        setMsg('No new suggestions — your current habits already cover your goals.')
      } else {
        setLocal([...local, ...fresh])
        setDirty(true)
        setMsg(`Added ${fresh.length} suggestion${fresh.length > 1 ? 's' : ''}. Review and Save to keep them.`)
      }
    } catch {
      setMsg('Could not fetch new suggestions right now.')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionTitle sub="Add, edit, pause or remove habits anytime. Saving never deletes past progress.">
        Your habits
      </SectionTitle>

      <HabitListEditor habits={local} onChange={onChange} showPause />

      {msg && <p className="text-sm text-sage-500 dark:text-sage-400">{msg}</p>}

      <div className="sticky bottom-20 z-10 flex gap-3 sm:bottom-4">
        <Button variant="outline" onClick={rerun} loading={regenerating} className="flex-1">
          Re-run AI suggestions
        </Button>
        <Button onClick={save} loading={saving} disabled={!dirty} className="flex-[2]">
          {dirty ? 'Save changes' : 'Saved'}
        </Button>
      </div>
    </div>
  )
}
