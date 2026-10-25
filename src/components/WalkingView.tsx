import { useApp } from '../state/AppContext'
import { WALKING_PLAN, walkingTargetForDay } from '../lib/defaults'
import { dayNumber } from '../lib/progress'
import { elapsedKeys } from '../lib/progress'
import { SectionTitle, StatCard } from './ui'

export function WalkingView() {
  const { data, settings, today } = useApp()
  const n = Math.max(1, dayNumber(settings, today))
  const week = Math.ceil(n / 7)
  const target = walkingTargetForDay(n, settings.walkingBaseMinutes)

  const keys = elapsedKeys(settings, today)
  const totalMinutes = keys.reduce((s, k) => s + (data.days[k]?.walking?.minutes ?? 0), 0)
  const totalKm = keys.reduce((s, k) => s + (data.days[k]?.walking?.distanceKm ?? 0), 0)
  const totalSteps = keys.reduce((s, k) => s + (data.days[k]?.walking?.steps ?? 0), 0)

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <SectionTitle sub="Conservative, steady progression on the Walking Pad.">
          Walking Plan
        </SectionTitle>
        <div className="rounded-xl bg-sage-50 dark:bg-white/5 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-sage-500 dark:text-sage-400">
            This week (week {Math.min(week, 10)})
          </div>
          <div className="mt-1 text-2xl font-semibold text-sage-700 dark:text-sage-200">
            {target} <span className="text-base font-normal text-sage-500">per session</span>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-sage-200 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-sage-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-sage-500 dark:text-sage-400">
              <tr>
                <th className="px-4 py-2 font-medium">Phase</th>
                <th className="px-4 py-2 font-medium">Minutes</th>
                <th className="px-4 py-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100 dark:divide-white/5">
              {WALKING_PLAN.map((p) => (
                <tr key={p.weeks}>
                  <td className="px-4 py-2.5 font-medium text-sage-800 dark:text-sage-100">
                    {p.weeks}
                  </td>
                  <td className="px-4 py-2.5 text-sage-600 dark:text-sage-300">{p.minutes}</td>
                  <td className="px-4 py-2.5 text-sage-500 dark:text-sage-400">{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-sage-400 dark:text-sage-500">
          Every workout ends with a walk. Log minutes, distance, and steps for each day in its
          checklist (open a day from the calendar or the dashboard).
        </p>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Total minutes walked" value={totalMinutes} accent />
          <StatCard label="Total distance" value={`${totalKm.toFixed(1)} km`} />
          <StatCard label="Total steps" value={totalSteps.toLocaleString()} />
        </div>
      </section>
    </div>
  )
}
