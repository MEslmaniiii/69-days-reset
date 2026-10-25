import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../state/DataContext'
import { useAuth } from '../state/AuthContext'
import type { Theme } from '../types'
import { deleteAccountServer } from '../lib/api'
import { todayKey } from '../lib/dates'
import { Button, Field, SectionTitle } from '../components/ui'

export default function SettingsPage() {
  const { data, saveProfile, deleteAccount } = useData()
  const { signOut, demoMode } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(data?.profile.name ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  if (!data) return null
  const { profile } = data

  const setTheme = (theme: Theme) => void saveProfile({ theme })

  const saveName = async () => {
    await saveProfile({ name: name.trim() })
    setSavedMsg('Saved.')
  }

  const toggleMarketing = async () => {
    const next = !profile.marketingConsent
    await saveProfile({
      marketingConsent: next,
      marketingConsentAt: next ? new Date(`${todayKey()}T00:00:00`).toISOString() : undefined,
    })
  }

  const exportMyData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'my-reset-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const doDelete = async () => {
    setBusy(true)
    try {
      if (!demoMode) await deleteAccountServer()
      await deleteAccount()
      await signOut()
      navigate('/', { replace: true })
    } catch {
      setBusy(false)
      setSavedMsg('Deletion failed. Please try again.')
    }
  }

  return (
    <div className="space-y-8">
      <SectionTitle>Settings</SectionTitle>

      <section className="card space-y-4 p-5">
        <Field label="Name">
          <div className="flex gap-2">
            <input className="field flex-1" value={name} onChange={(e) => setName(e.target.value)} />
            <Button variant="outline" onClick={saveName}>Save</Button>
          </div>
        </Field>
        <div>
          <span className="label">Appearance</span>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-lg border px-2 py-2 text-sm capitalize ${
                  profile.theme === t
                    ? 'border-sage-500 bg-sage-500 text-white'
                    : 'border-sage-200 text-sage-500 dark:border-white/10'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {savedMsg && <p className="text-sm text-sage-500">{savedMsg}</p>}
      </section>

      <section className="card space-y-3 p-5">
        <div className="text-sm font-medium text-sage-700 dark:text-sage-200">Communications</div>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" checked={profile.marketingConsent} onChange={toggleMarketing} />
          <span className="text-sm text-sage-600 dark:text-sage-300">
            Receive useful updates, offers, and content. You can turn this off anytime.
          </span>
        </label>
      </section>

      <section className="card space-y-3 p-5">
        <div className="text-sm font-medium text-sage-700 dark:text-sage-200">Your data</div>
        <p className="text-sm text-sage-500 dark:text-sage-400">
          Download everything we store about you, anytime.
        </p>
        <Button variant="outline" onClick={exportMyData}>Download my data (JSON)</Button>
      </section>

      <section className="card space-y-3 p-5">
        <Button variant="ghost" onClick={() => void signOut().then(() => navigate('/'))}>
          Sign out
        </Button>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5 dark:border-red-500/20 dark:bg-red-500/5">
        <div className="text-sm font-medium text-red-700 dark:text-red-400">Delete account</div>
        <p className="mt-1 text-sm text-sage-600 dark:text-sage-300">
          This permanently removes your profile, habits, and all progress. This cannot be undone.
        </p>
        {!confirmDelete ? (
          <Button variant="danger" className="mt-3" onClick={() => setConfirmDelete(true)}>
            Delete my account
          </Button>
        ) : (
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={doDelete} className="flex-1">
              Yes, delete everything
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
