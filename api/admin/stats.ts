import type { VercelRequest, VercelResponse } from '@vercel/node'
import { admin, getUser, isAdminUser, isConfigured } from '../_lib/supabaseAdmin'

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

  const now = Date.now()
  const day = 86400000

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, name, country, country_code, created_at, last_active_at, marketing_consent, onboarding_complete')
  const { data: goals } = await admin.from('goals').select('category')
  const { count: plansGenerated } = await admin
    .from('ai_plans')
    .select('id', { count: 'exact', head: true })

  const p = profiles ?? []
  const countBetween = (fromDays: number) =>
    p.filter((r) => r.created_at && now - new Date(r.created_at).getTime() <= fromDays * day).length

  const countriesMap: Record<string, number> = {}
  for (const r of p) {
    const key = r.country || r.country_code || 'Unknown'
    countriesMap[key] = (countriesMap[key] || 0) + 1
  }
  const categoriesMap: Record<string, number> = {}
  for (const g of goals ?? []) {
    categoriesMap[g.category] = (categoriesMap[g.category] || 0) + 1
  }

  const activeUsers = p.filter(
    (r) => r.last_active_at && now - new Date(r.last_active_at).getTime() <= 7 * day
  ).length

  res.status(200).json({
    totalUsers: p.length,
    onboardedUsers: p.filter((r) => r.onboarding_complete).length,
    newLast7: countBetween(7),
    newLast30: countBetween(30),
    activeUsers,
    marketingConsented: p.filter((r) => r.marketing_consent).length,
    plansGenerated: plansGenerated ?? 0,
    countries: Object.entries(countriesMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    goalCategories: Object.entries(categoriesMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  })
}
