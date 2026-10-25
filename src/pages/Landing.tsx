import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BRAND } from '../lib/config'
import { PRESETS } from '../lib/presets'
import { track } from '../lib/analytics'
import { useAuth } from '../state/AuthContext'
import { Pill } from '../components/ui'

const STEPS = [
  { n: 1, title: 'Tell us about yourself', body: 'Your lifestyle, work, and the time you really have.' },
  { n: 2, title: 'Choose your goals', body: 'Health, learning, business, faith — one or many.' },
  { n: 3, title: 'AI builds your system', body: 'A realistic set of 3–6 habits and dated milestones.' },
  { n: 4, title: 'Track your progress', body: 'Daily checklist, streaks, and progress percentages.' },
  { n: 5, title: 'Improve every week', body: 'Weekly reviews and an AI coach keep you adjusting.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    track('landing_view')
  }, [])

  const start = () => {
    track('onboarding_started')
    navigate(user ? '/onboarding' : '/auth')
  }

  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="font-semibold text-sage-900 dark:text-white">{BRAND.name}</span>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="btn-ghost text-sm">
            Sign in
          </Link>
          <button onClick={start} className="btn-primary text-sm">
            Build My Plan
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-5 pb-10 pt-10 text-center sm:pt-16">
        <div className="mb-5 flex justify-center">
          <Pill tone="gold">AI-personalized · Free to start</Pill>
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-sage-900 dark:text-white sm:text-5xl">
          {BRAND.tagline}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-sage-600 dark:text-sage-300 sm:text-lg">
          {BRAND.subtagline}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={start} className="btn-primary w-full px-6 py-3 text-base sm:w-auto">
            Build My Plan
          </button>
          <Link to="/auth" className="btn-ghost w-full px-6 py-3 text-base sm:w-auto">
            I already have an account
          </Link>
        </div>
        <p className="mt-4 text-xs text-sage-400">Takes about 3–5 minutes. No credit card.</p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-3xl px-5 py-10">
        <h2 className="mb-6 text-center text-xl font-semibold text-sage-900 dark:text-white">
          How it works
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.n} className="card flex gap-4 p-4">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-sage-500/12 text-sm font-semibold text-sage-600 dark:text-sage-300">
                {s.n}
              </div>
              <div>
                <div className="font-medium text-sage-900 dark:text-white">{s.title}</div>
                <div className="text-sm text-sage-500 dark:text-sage-400">{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Example systems */}
      <section className="mx-auto max-w-3xl px-5 py-10">
        <h2 className="mb-2 text-center text-xl font-semibold text-sage-900 dark:text-white">
          Built around your goals
        </h2>
        <p className="mb-6 text-center text-sm text-sage-500 dark:text-sage-400">
          A few examples of what the AI can design. Yours will be unique to you.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PRESETS.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-lg">{p.emoji}</span>
                <span className="font-medium text-sage-900 dark:text-white">{p.title}</span>
              </div>
              <p className="mb-3 text-sm text-sage-500 dark:text-sage-400">{p.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {[...p.plan.dailyHabits, ...p.plan.weeklyHabits].slice(0, 4).map((h) => (
                  <span
                    key={h.name}
                    className="rounded-md bg-sage-100 px-2 py-0.5 text-xs text-sage-600 dark:bg-white/5 dark:text-sage-300"
                  >
                    {h.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 text-center">
        <div className="card px-6 py-10">
          <h2 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Make the rest of the year count.
          </h2>
          <button onClick={start} className="btn-primary mt-6 px-6 py-3 text-base">
            Build My Plan
          </button>
        </div>
      </section>

      <footer className="mx-auto max-w-3xl px-5 py-8 text-center text-xs text-sage-400">
        <div className="flex justify-center gap-4">
          <Link to="/privacy" className="hover:text-sage-600">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-sage-600">
            Terms
          </Link>
        </div>
        <p className="mt-3">
          © {BRAND.name}. Your data is private and protected.
        </p>
      </footer>
    </div>
  )
}
