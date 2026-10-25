import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { BRAND } from '../lib/config'
import { Button, Field } from '../components/ui'

export default function AuthPage() {
  const { signIn, signUp, demoMode, user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Already signed in — continue to onboarding (which forwards to /app if done).
  if (user) return <Navigate to="/onboarding" replace />


  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!email || password.length < 6) {
      setError('Enter a valid email and a password of at least 6 characters.')
      return
    }
    setLoading(true)
    const res = mode === 'signin' ? await signIn(email, password) : await signUp(email, password)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    // In Supabase, sign-up may require email confirmation (no session yet).
    if (mode === 'signup' && !demoMode) {
      setInfo(
        'Account created. If asked, confirm your email, then sign in. Otherwise you can continue now.'
      )
    }
    navigate('/onboarding', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-5 py-10">
      <Link to="/" className="mb-8 text-center font-semibold text-sage-900 dark:text-white">
        {BRAND.name}
      </Link>

      <div className="card p-6">
        <h1 className="text-xl font-semibold text-sage-900 dark:text-white">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-1 text-sm text-sage-500 dark:text-sage-400">
          {mode === 'signin'
            ? 'Sign in to continue your reset.'
            : 'Start building your personalized system.'}
        </p>

        {demoMode && (
          <div className="mt-4 rounded-lg bg-gold-500/10 px-3 py-2 text-xs text-gold-500">
            Demo mode — data is stored only on this device. Add Supabase keys to enable real accounts.
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label="Email">
            <input
              type="email"
              autoComplete="email"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password" hint="At least 6 characters">
            <input
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-sage-600 dark:text-sage-300">{info}</p>}

          <Button type="submit" loading={loading} className="w-full py-2.5">
            {mode === 'signin' ? 'Sign in' : 'Create account & continue'}
          </Button>
        </form>

        <div className="mt-5 text-center text-sm text-sage-500">
          {mode === 'signin' ? (
            <>
              New here?{' '}
              <button
                className="font-medium text-sage-700 dark:text-sage-200 hover:underline"
                onClick={() => setMode('signup')}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                className="font-medium text-sage-700 dark:text-sage-200 hover:underline"
                onClick={() => setMode('signin')}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-sage-400">
        By continuing you agree to our{' '}
        <Link to="/terms" className="underline">
          Terms
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}
