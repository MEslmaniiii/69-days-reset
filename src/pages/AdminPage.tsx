import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminStats, downloadExport } from '../lib/api'
import { BRAND } from '../lib/config'
import { Button, Spinner, StatCard } from '../components/ui'

interface Stats {
  totalUsers: number
  onboardedUsers: number
  newLast7: number
  newLast30: number
  activeUsers: number
  marketingConsented: number
  plansGenerated: number
  countries: { name: string; count: number }[]
  goalCategories: { name: string; count: number }[]
}

const EXPORTS = [
  { key: 'users', label: 'Export Users' },
  { key: 'leads', label: 'Export Leads' },
  { key: 'marketing', label: 'Export Marketing Leads' },
  { key: 'goals', label: 'Export Goal Data' },
  { key: 'activity', label: 'Export Activity' },
]

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    adminStats()
      .then((s) => setStats(s as unknown as Stats))
      .catch((e) => setError((e as Error).message))
  }, [])

  const doExport = async (kind: string) => {
    setDownloading(kind)
    try {
      await downloadExport(kind)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">{BRAND.name} · Admin</h1>
          <p className="text-sm text-sage-500">Private — owner only.</p>
        </div>
        <Link to="/app" className="btn-ghost text-sm">← Back to app</Link>
      </div>

      {error && (
        <div className="card mb-6 p-4 text-sm text-red-600">
          {error} — ensure your profile has <code>is_admin = true</code> in Supabase.
        </div>
      )}

      {!stats && !error && (
        <div className="flex justify-center py-16 text-sage-400">
          <Spinner />
        </div>
      )}

      {stats && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total users" value={stats.totalUsers} accent />
            <StatCard label="Onboarded" value={stats.onboardedUsers} />
            <StatCard label="New (7d)" value={stats.newLast7} />
            <StatCard label="New (30d)" value={stats.newLast30} />
            <StatCard label="Active (7d)" value={stats.activeUsers} />
            <StatCard label="Plans generated" value={stats.plansGenerated} />
            <StatCard label="Marketing opt-ins" value={stats.marketingConsented} />
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="card p-5">
              <div className="mb-3 text-sm font-medium text-sage-700 dark:text-sage-200">Countries</div>
              <BreakdownList items={stats.countries} />
            </div>
            <div className="card p-5">
              <div className="mb-3 text-sm font-medium text-sage-700 dark:text-sage-200">Goal categories</div>
              <BreakdownList items={stats.goalCategories} />
            </div>
          </section>

          <section className="mt-6 card p-5">
            <div className="mb-3 text-sm font-medium text-sage-700 dark:text-sage-200">Exports (CSV / Excel)</div>
            <div className="flex flex-wrap gap-2">
              {EXPORTS.map((e) => (
                <Button
                  key={e.key}
                  variant="outline"
                  loading={downloading === e.key}
                  onClick={() => doExport(e.key)}
                >
                  {e.label}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-xs text-sage-400">
              Marketing Leads includes only users who explicitly opted in. Files open directly in Excel.
            </p>
          </section>
        </>
      )}
    </div>
  )
}

function BreakdownList({ items }: { items: { name: string; count: number }[] }) {
  if (!items.length) return <p className="text-sm text-sage-400">No data yet.</p>
  const max = Math.max(...items.map((i) => i.count), 1)
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.name} className="flex items-center gap-3">
          <span className="w-28 truncate text-sm text-sage-600 dark:text-sage-300">{i.name}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-sage-100 dark:bg-white/10">
            <div className="h-full rounded-full bg-sage-500" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
          <span className="w-8 text-right text-sm tabular-nums text-sage-500">{i.count}</span>
        </div>
      ))}
    </div>
  )
}
