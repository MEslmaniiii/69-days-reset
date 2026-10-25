import type { VercelRequest, VercelResponse } from '@vercel/node'
import { admin, getUser, isConfigured } from '../_lib/supabaseAdmin'

// Deletes the authenticated user's auth account. All owned rows cascade via
// `on delete cascade` foreign keys to auth.users.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!isConfigured()) {
    res.status(500).json({ error: 'Server not configured' })
    return
  }
  const user = await getUser(req)
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.status(200).json({ ok: true })
}
