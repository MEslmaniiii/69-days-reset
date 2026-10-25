import { useEffect } from 'react'
import { useApp } from '../state/AppContext'
import { prettyDate, weekdayName } from '../lib/dates'
import { dayNumber, dayRatio, isWorkoutDay, totalDays } from '../lib/progress'
import { DayChecklist } from './DayChecklist'
import { ProgressBar } from './ui'

export function DayModal({ dateKey, onClose }: { dateKey: string; onClose: () => void }) {
  const { settings } = useApp()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const n = dayNumber(settings, dateKey)
  const inRange = n >= 1 && n <= totalDays(settings)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-b-none sm:rounded-2xl animate-pop p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-sage-500 dark:text-sage-400">
              {inRange ? `Day ${n} of ${totalDays(settings)}` : weekdayName(dateKey)}
              {isWorkoutDay(dateKey, settings) ? ' · Workout day' : ' · Rest day'}
            </div>
            <h3 className="mt-0.5 text-lg font-semibold text-sage-900 dark:text-white">
              {prettyDate(dateKey)}
            </h3>
          </div>
          <button className="btn-ghost -mr-2 -mt-1 px-2 py-1 text-xl leading-none" onClick={onClose}>
            ×
          </button>
        </div>

        <DayCompletionBar dateKey={dateKey} />

        <div className="mt-5">
          <DayChecklist dateKey={dateKey} detailed />
        </div>

        <div className="mt-5 flex justify-end">
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function DayCompletionBar({ dateKey }: { dateKey: string }) {
  const { data, settings } = useApp()
  const r = dayRatio(data, settings, dateKey)
  const pct = Math.round(r.ratio * 100)
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-sage-500 dark:text-sage-400">
          {r.completed} / {r.total} core habits
        </span>
        <span className="font-semibold tabular-nums text-sage-600 dark:text-sage-300">{pct}%</span>
      </div>
      <ProgressBar pct={pct} size="lg" />
    </div>
  )
}
