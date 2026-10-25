import type { VercelRequest, VercelResponse } from '@vercel/node'
import { admin, getUser, isAdminUser, isConfigured } from '../_lib/supabaseAdmin'

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  let s = typeof v === 'object' ? JSON.stringify(v) : String(v)
  // Guard against CSV formula injection in Excel.
  if (/^[=+\-@]/.test(s)) s = "'" + s
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"'
  return s
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(',')]
  for (const r of rows) lines.push(r.map(csvCell).join(','))
  // Prepend UTF-8 BOM so Excel renders Arabic/emoji and commas correctly.
  return '﻿' + lines.join('\r\n')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isConfigured()) {
    res.status(500).json({ error: 'Server not configured' })
    return
  }
  const user = await getUser(req)
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  if (!(await isAdminUser(user.id))) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const type = String(req.query.type || 'users')

  // Fetch the building blocks.
  const { data: profiles } = await admin.from('profiles').select('*')
  const { data: goals } = await admin.from('goals').select('user_id, title, category')
  const { data: logs } = await admin.from('habit_logs').select('user_id, completed')

  const p = profiles ?? []

  // goals per user
  const goalsByUser: Record<string, { title: string; category: string }[]> = {}
  for (const g of goals ?? []) {
    ;(goalsByUser[g.user_id] ||= []).push({ title: g.title, category: g.category })
  }
  // approximate progress: completed logs / total logs
  const logAgg: Record<string, { done: number; total: number }> = {}
  for (const l of logs ?? []) {
    const a = (logAgg[l.user_id] ||= { done: 0, total: 0 })
    a.total++
    if (l.completed) a.done++
  }
  const progressPct = (uid: string) => {
    const a = logAgg[uid]
    return a && a.total ? Math.round((a.done / a.total) * 100) : 0
  }
  const goalTitles = (uid: string) => (goalsByUser[uid] || []).map((g) => g.title).join('; ')
  const goalCats = (uid: string) =>
    [...new Set((goalsByUser[uid] || []).map((g) => g.category))].join('; ')

  let filename = 'export.csv'
  let csv = ''

  if (type === 'users') {
    filename = 'users.csv'
    csv = toCsv(
      ['ID', 'Name', 'Country', 'Email', 'Signup Date', 'Onboarded', 'Last Active', 'Progress %'],
      p.map((r) => [
        r.id,
        r.name,
        r.country || r.country_code || '',
        r.email || '',
        r.created_at,
        r.onboarding_complete ? 'yes' : 'no',
        r.last_active_at || '',
        progressPct(r.id),
      ])
    )
  } else if (type === 'leads') {
    filename = 'leads.csv'
    csv = toCsv(
      ['Name', 'Phone', 'Country', 'Email', 'Bio', 'Main Goals', 'Goal Categories', 'Signup Date',
        'Marketing Consent', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Last Active', 'Progress %'],
      p.map((r) => [
        r.name, r.phone || '', r.country || r.country_code || '', r.email || '', r.bio || '',
        goalTitles(r.id), goalCats(r.id), r.created_at, r.marketing_consent ? 'yes' : 'no',
        r.utm?.source || '', r.utm?.medium || '', r.utm?.campaign || '',
        r.last_active_at || '', progressPct(r.id),
      ])
    )
  } else if (type === 'marketing') {
    filename = 'marketing-leads.csv'
    const consented = p.filter((r) => r.marketing_consent)
    csv = toCsv(
      ['Name', 'Phone', 'Country', 'Email', 'Bio', 'Main Goals', 'Goal Categories', 'Signup Date',
        'Marketing Consent', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Last Active', 'Progress %'],
      consented.map((r) => [
        r.name, r.phone || '', r.country || r.country_code || '', r.email || '', r.bio || '',
        goalTitles(r.id), goalCats(r.id), r.created_at, 'yes',
        r.utm?.source || '', r.utm?.medium || '', r.utm?.campaign || '',
        r.last_active_at || '', progressPct(r.id),
      ])
    )
  } else if (type === 'goals') {
    filename = 'goals.csv'
    const rows: unknown[][] = []
    for (const g of goals ?? []) {
      const prof = p.find((x) => x.id === g.user_id)
      rows.push([prof?.name || '', g.title, g.category, prof?.country || prof?.country_code || ''])
    }
    csv = toCsv(['User', 'Goal', 'Category', 'Country'], rows)
  } else if (type === 'activity') {
    filename = 'activity.csv'
    csv = toCsv(
      ['Name', 'Signup Date', 'Last Active', 'Logged Days', 'Completed', 'Progress %'],
      p.map((r) => [
        r.name, r.created_at, r.last_active_at || '',
        logAgg[r.id]?.total || 0, logAgg[r.id]?.done || 0, progressPct(r.id),
      ])
    )
  } else {
    res.status(400).json({ error: 'Unknown export type' })
    return
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.status(200).send(csv)
}
