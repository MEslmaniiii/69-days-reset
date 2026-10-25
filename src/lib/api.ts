import { supabase, isSupabaseConfigured } from './supabase'
import type { GeneratedPlan } from '../types'
import { generatePlanLocally, type PlanInput } from './planTemplates'

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token) headers.Authorization = `Bearer ${token}`
  }
  return headers
}

/** Generate a personalized plan. Falls back to local rule-based generation. */
export async function generatePlan(input: PlanInput): Promise<GeneratedPlan> {
  if (!isSupabaseConfigured) return generatePlanLocally(input)
  try {
    const res = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(input),
    })
    if (!res.ok) return generatePlanLocally(input)
    const data = (await res.json()) as GeneratedPlan
    if (!data?.dailyHabits) return generatePlanLocally(input)
    return data
  } catch {
    return generatePlanLocally(input)
  }
}

/** Ask the AI coach for concise, practical advice. */
export async function getCoachAdvice(context: string): Promise<string> {
  if (!isSupabaseConfigured) {
    return localCoach(context)
  }
  try {
    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ context }),
    })
    if (!res.ok) return localCoach(context)
    const data = (await res.json()) as { advice: string }
    return data.advice || localCoach(context)
  } catch {
    return localCoach(context)
  }
}

function localCoach(_context: string): string {
  return [
    'Keep showing up — consistency compounds.',
    'If a habit keeps slipping, make it smaller or move it to your best time of day.',
    'Protect your top 1–2 habits first; the rest are bonus.',
  ].join('\n')
}

/** Permanently delete the signed-in user's account (server removes auth user; rows cascade). */
export async function deleteAccountServer(): Promise<void> {
  if (!isSupabaseConfigured) return
  const res = await fetch('/api/account/delete', {
    method: 'POST',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Account deletion failed')
}

// ---- Admin (server-protected) ----

export async function adminStats(): Promise<Record<string, unknown>> {
  const res = await fetch('/api/admin/stats', { headers: await authHeaders() })
  if (!res.ok) throw new Error('Not authorized')
  return res.json()
}

export function adminExportUrl(kind: string): string {
  return `/api/admin/export?type=${encodeURIComponent(kind)}`
}

/** Download a CSV export (attaches the auth token, then triggers a file save). */
export async function downloadExport(kind: string): Promise<void> {
  const res = await fetch(adminExportUrl(kind), { headers: await authHeaders() })
  if (!res.ok) throw new Error('Export failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${kind}-export.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
