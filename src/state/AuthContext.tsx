import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { newId } from '../data/repo'

export interface AuthUser {
  id: string
  email?: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  demoMode: boolean
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ---- Demo (device-only) auth, used when Supabase is not configured ----
const DEMO_SESSION = 'byr_demo_session'
const DEMO_USERS = 'byr_demo_users'

function demoUsers(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(DEMO_USERS) || '{}')
  } catch {
    return {}
  }
}
function setDemoUsers(u: Record<string, string>) {
  localStorage.setItem(DEMO_USERS, JSON.stringify(u))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return
        const s = data.session
        setUser(s ? { id: s.user.id, email: s.user.email ?? undefined } : null)
        setLoading(false)
      })
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(
          session ? { id: session.user.id, email: session.user.email ?? undefined } : null
        )
      })
      return () => {
        active = false
        sub.subscription.unsubscribe()
      }
    } else {
      // demo mode
      try {
        const raw = localStorage.getItem(DEMO_SESSION)
        setUser(raw ? JSON.parse(raw) : null)
      } catch {
        setUser(null)
      }
      setLoading(false)
      return () => {
        active = false
      }
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      demoMode: !isSupabaseConfigured,
      async signUp(email, password) {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.auth.signUp({ email, password })
          return { error: error?.message }
        }
        // demo
        const users = demoUsers()
        const key = email.toLowerCase()
        if (users[key]) return { error: 'An account with this email already exists.' }
        const id = newId()
        users[key] = id
        setDemoUsers(users)
        const u = { id, email }
        localStorage.setItem(DEMO_SESSION, JSON.stringify(u))
        setUser(u)
        return {}
      },
      async signIn(email, password) {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          return { error: error?.message }
        }
        const users = demoUsers()
        const key = email.toLowerCase()
        const id = users[key]
        if (!id) return { error: 'No demo account found — sign up first.' }
        const u = { id, email }
        localStorage.setItem(DEMO_SESSION, JSON.stringify(u))
        setUser(u)
        return {}
      },
      async signOut() {
        if (isSupabaseConfigured && supabase) {
          await supabase.auth.signOut()
        } else {
          localStorage.removeItem(DEMO_SESSION)
        }
        setUser(null)
      },
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
