import { MILESTONES } from '../lib/defaults'
import { useApp } from '../state/AppContext'
import { currentStreak } from '../lib/progress'
import { SectionTitle } from './ui'

export function Milestones() {
  const { data, settings, today } = useApp()
  const streak = currentStreak(data, settings, today)

  // The most recent milestone reached
  const reached = [...MILESTONES].reverse().find((m) => streak >= m.day)

  return (
    <section className="card p-5">
      <SectionTitle sub="Quiet markers of consistency — no coins, no noise.">Milestones</SectionTitle>

      {reached && (
        <p className="mb-4 rounded-xl bg-sage-50 dark:bg-white/5 px-4 py-3 text-sm font-medium text-sage-700 dark:text-sage-200 animate-fadein">
          “{reached.message}”
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {MILESTONES.map((m) => {
          const done = streak >= m.day
          const next = !done && streak < m.day && (!reached || m.day > reached.day)
          const isNext =
            next && MILESTONES.filter((x) => x.day > streak).sort((a, b) => a.day - b.day)[0]?.day === m.day
          return (
            <div
              key={m.day}
              className={`flex h-14 w-14 flex-col items-center justify-center rounded-xl border text-center transition-colors ${
                done
                  ? 'border-sage-500 bg-sage-500 text-white'
                  : isNext
                    ? 'border-sage-400 dark:border-sage-500 text-sage-600 dark:text-sage-300'
                    : 'border-sage-200 dark:border-white/10 text-sage-400 dark:text-sage-500'
              }`}
            >
              <span className="text-base font-semibold tabular-nums">{m.day}</span>
              <span className="text-[9px] uppercase tracking-wide">days</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
