import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useData } from '../state/DataContext'
import { BRAND } from '../lib/config'

const TABS = [
  { to: '/app', label: 'Today', icon: '☀️', end: true },
  { to: '/app/habits', label: 'Habits', icon: '✓', end: false },
  { to: '/app/review', label: 'Review', icon: '📊', end: false },
  { to: '/app/coach', label: 'Coach', icon: '🧭', end: false },
  { to: '/app/settings', label: 'Settings', icon: '⚙️', end: false },
]

export default function AppLayout() {
  const { data } = useData()
  const navigate = useNavigate()
  const isAdmin = data?.profile?.isAdmin

  return (
    <div className="min-h-full">
      {/* Top bar (desktop) */}
      <header className="sticky top-0 z-20 border-b border-sage-200/60 dark:border-white/5 bg-sage-50/80 dark:bg-[#12161a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/app')}
            className="font-semibold text-sage-900 dark:text-white"
          >
            {BRAND.name}
          </button>
          <nav className="hidden items-center gap-1 sm:flex">
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sage-500/12 text-sage-700 dark:text-sage-200'
                      : 'text-sage-500 hover:text-sage-800 dark:hover:text-sage-200'
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gold-500 hover:bg-gold-500/10"
              >
                Admin
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:pb-10">
        <Outlet />
      </main>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-sage-200/70 dark:border-white/10 bg-white/90 dark:bg-[#12161a]/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-3xl">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                  isActive ? 'text-sage-600 dark:text-sage-300' : 'text-sage-400'
                }`
              }
            >
              <span className="text-base leading-none">{t.icon}</span>
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
