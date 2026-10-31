import { useEffect, useState } from 'react'
import { AppProvider, useApp } from './state/AppContext'
import { Dashboard } from './components/Dashboard'
import { WorkoutView } from './components/WorkoutView'
import { WalkingView } from './components/WalkingView'
import { NutritionView } from './components/NutritionView'
import { WeeklyReview } from './components/WeeklyReview'
import { SettingsView } from './components/SettingsView'

export type View =
  | 'dashboard'
  | 'workout'
  | 'walking'
  | 'nutrition'
  | 'review'
  | 'settings'

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Today', icon: 'M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z' },
  { id: 'workout', label: 'Workout', icon: 'M6 7v10M18 7v10M3 9h3v6H3zM18 9h3v6h-3zM6 12h12' },
  { id: 'walking', label: 'Walking', icon: 'M13 5a2 2 0 100-4 2 2 0 000 4zM9 22l2-6 2 2v4M11 10l3-2 2 3 2 1M9 22l-1-7 3-3' },
  { id: 'nutrition', label: 'Nutrition', icon: 'M7 3c-2 2-3 5-3 8a4 4 0 008 0c0-3-1-6-5-8zM12 21V11M15 4a3 3 0 00-3 3M16 9a3 3 0 01-3 3' },
  { id: 'review', label: 'Review', icon: 'M9 11l3 3 7-7M3 5h12M3 12h6M3 19h9' },
  { id: 'settings', label: 'Settings', icon: 'M10.3 3h3.4l.5 2.3 2 .9 2.1-1 1.7 3-1.6 1.6v2.4l1.6 1.6-1.7 3-2.1-1-2 .9-.5 2.3h-3.4l-.5-2.3-2-.9-2.1 1-1.7-3 1.6-1.6V9.8L3.7 8.2l1.7-3 2.1 1 2-.9z' },
]

function useTheme() {
  const { settings } = useApp()
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const dark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      root.classList.toggle('dark', dark)
    }
    apply()
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [settings.theme])
}

function Shell() {
  useTheme()
  const { settings } = useApp()
  const [view, setView] = useState<View>('dashboard')

  // quick theme toggle in header
  const { updateSettings } = useApp()
  const cycleTheme = () =>
    updateSettings({
      theme: settings.theme === 'dark' ? 'light' : settings.theme === 'light' ? 'system' : 'dark',
    })

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-sage-200/70 dark:border-white/5 bg-sage-50/80 dark:bg-[#12161a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-600 text-white text-sm font-bold">
              ٦٠
            </div>
            <span className="font-semibold text-sage-900 dark:text-white">{settings.challengeName}</span>
          </div>
          <button
            onClick={cycleTheme}
            className="btn-ghost px-2 py-1.5 text-xs capitalize"
            title="Toggle theme"
          >
            {settings.theme}
          </button>
        </div>
      </header>

      {/* Desktop nav */}
      <nav className="mx-auto hidden max-w-3xl gap-1 px-4 pt-4 sm:flex">
        {NAV.map((item) => (
          <NavButton key={item.id} item={item} active={view === item.id} onClick={() => setView(item.id)} />
        ))}
      </nav>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-4 sm:pb-12">
        {view === 'dashboard' && <Dashboard onNavigate={setView} />}
        {view === 'workout' && <WorkoutView />}
        {view === 'walking' && <WalkingView />}
        {view === 'nutrition' && <NutritionView />}
        {view === 'review' && <WeeklyReview />}
        {view === 'settings' && <SettingsView />}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-sage-200/70 dark:border-white/5 bg-sage-50/90 dark:bg-[#12161a]/90 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-3xl justify-around px-2 py-1.5">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium ${
                view === item.id
                  ? 'text-sage-600 dark:text-sage-300'
                  : 'text-sage-400 dark:text-sage-500'
              }`}
            >
              <Icon path={item.icon} />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: { id: View; label: string; icon: string }
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-white dark:bg-white/10 text-sage-900 dark:text-white shadow-sm'
          : 'text-sage-500 dark:text-sage-400 hover:bg-white/60 dark:hover:bg-white/5'
      }`}
    >
      <Icon path={item.icon} />
      {item.label}
    </button>
  )
}

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
