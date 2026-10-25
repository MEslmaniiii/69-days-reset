import { useMemo, useState } from 'react'
import { useApp } from '../state/AppContext'
import { addDays, fromKey, monthShort, rangeKeys, weekStart } from '../lib/dates'
import { dayStatus } from '../lib/progress'
import type { DayStatus } from '../lib/progress'
import { SectionTitle } from './ui'
import { DayModal } from './DayModal'

const WEEKDAY_LABELS = ['S', 'S', 'M', 'T', 'W', 'T', 'F'] // Sat..Fri

const STATUS_CLASS: Record<DayStatus, string> = {
  complete: 'bg-sage-500 border-sage-500 text-white',
  partial: 'bg-sage-300 dark:bg-sage-500/50 border-sage-300 dark:border-sage-500/50',
  missed: 'bg-rose-200/70 dark:bg-rose-500/25 border-rose-300/60 dark:border-rose-500/30',
  today: 'bg-transparent border-sage-400 dark:border-sage-400 ring-2 ring-sage-400/40',
  future: 'bg-sage-100/60 dark:bg-white/5 border-transparent',
}

export function Calendar() {
  const { data, settings, today } = useApp()
  const [selected, setSelected] = useState<string | null>(null)

  // Build columns of weeks (each column is a Sat..Fri week), covering the full challenge.
  const weeks = useMemo(() => {
    const firstCol = weekStart(settings.startDate)
    const cols: string[][] = []
    let col = firstCol
    while (col <= settings.endDate) {
      cols.push(rangeKeys(col, addDays(col, 6)))
      col = addDays(col, 7)
    }
    return cols
  }, [settings.startDate, settings.endDate])

  // Month labels aligned to week columns — show each month once, on its first column.
  const monthLabels = useMemo(() => {
    let prevMonth = -1
    return weeks.map((w) => {
      const firstInRange = w.find((k) => k >= settings.startDate && k <= settings.endDate)
      if (!firstInRange) return ''
      const m = fromKey(firstInRange).getMonth()
      if (m !== prevMonth) {
        prevMonth = m
        return monthShort(firstInRange)
      }
      return ''
    })
  }, [weeks, settings.startDate, settings.endDate])

  const inChallenge = (k: string) => k >= settings.startDate && k <= settings.endDate

  return (
    <section className="card p-5">
      <SectionTitle sub="Tap any day to open its checklist and notes.">Calendar</SectionTitle>

      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-2">
          {/* weekday labels */}
          <div className="flex flex-col gap-1 pr-1 pt-5">
            {WEEKDAY_LABELS.map((d, i) => (
              <div
                key={i}
                className="h-4 text-[10px] leading-4 text-sage-400 dark:text-sage-500"
              >
                {i % 2 === 1 ? d : ''}
              </div>
            ))}
          </div>

          {weeks.map((week, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              <div className="h-4 text-[10px] leading-4 text-sage-400 dark:text-sage-500">
                {monthLabels[ci]}
              </div>
              {week.map((k) => {
                if (!inChallenge(k)) {
                  return <div key={k} className="h-4 w-4" />
                }
                const status = dayStatus(data, settings, k, today)
                return (
                  <button
                    key={k}
                    onClick={() => setSelected(k)}
                    title={k}
                    className={`h-4 w-4 rounded-[4px] border transition-transform hover:scale-125 ${STATUS_CLASS[status]}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <Legend />

      {selected && <DayModal dateKey={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}

function Legend() {
  const items: { label: string; status: DayStatus }[] = [
    { label: 'Completed', status: 'complete' },
    { label: 'Partial', status: 'partial' },
    { label: 'Missed', status: 'missed' },
    { label: 'Today', status: 'today' },
    { label: 'Upcoming', status: 'future' },
  ]
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <span className={`h-3.5 w-3.5 rounded-[4px] border ${STATUS_CLASS[it.status]}`} />
          <span className="text-xs text-sage-500 dark:text-sage-400">{it.label}</span>
        </div>
      ))}
    </div>
  )
}
