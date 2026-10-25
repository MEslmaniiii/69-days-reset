import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './state/AuthContext'
import { DataProvider, useData } from './state/DataContext'
import { Spinner } from './components/ui'
import { captureUtm } from './lib/analytics'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import HabitsPage from './pages/HabitsPage'
import WeeklyReviewPage from './pages/WeeklyReviewPage'
import CoachPage from './pages/CoachPage'
import SettingsPage from './pages/SettingsPage'
import AdminPage from './pages/AdminPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import NotFound from './pages/NotFound'
import AppLayout from './components/AppLayout'

function FullSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sage-500">
      <Spinner />
    </div>
  )
}

function ThemeApplier() {
  const { data } = useData()
  const theme = data?.profile?.theme ?? 'system'
  useEffect(() => {
    const root = document.documentElement
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mql.matches)
      root.classList.toggle('dark', dark)
    }
    apply()
    if (theme === 'system') {
      mql.addEventListener('change', apply)
      return () => mql.removeEventListener('change', apply)
    }
  }, [theme])
  return null
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullSpinner />
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

function RequireOnboarded({ children }: { children: ReactNode }) {
  const { data, loading } = useData()
  if (loading) return <FullSpinner />
  if (!data || !data.profile?.onboardingComplete) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { data, loading } = useData()
  if (loading) return <FullSpinner />
  if (!data?.profile?.isAdmin) return <Navigate to="/app" replace />
  return <>{children}</>
}

function Routing() {
  useEffect(() => {
    captureUtm()
  }, [])
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <Onboarding />
          </RequireAuth>
        }
      />
      <Route
        element={
          <RequireAuth>
            <RequireOnboarded>
              <AppLayout />
            </RequireOnboarded>
          </RequireAuth>
        }
      >
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/habits" element={<HabitsPage />} />
        <Route path="/app/review" element={<WeeklyReviewPage />} />
        <Route path="/app/coach" element={<CoachPage />} />
        <Route path="/app/settings" element={<SettingsPage />} />
      </Route>
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <ThemeApplier />
          <Routing />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
