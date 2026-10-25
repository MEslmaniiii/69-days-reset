import { createClient } from '@supabase/supabase-js'
import type { VercelRequest } from '@vercel/node'

// Server-only Supabase client using the SERVICE ROLE key. This bypasses RLS,
// so it must NEVER be imported into browser code. It lives under /api only.
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export function isConfigured(): boolean {
  return Boolean(url && serviceKey)
}

export interface ServerUser {
  id: string
  email?: string
}

/** Verify the caller's Supabase JWT (from the Authorization header). */
export async function getUser(req: VercelRequest): Promise<ServerUser | null> {
  const header = req.headers.authorization || req.headers.Authorization
  const value = Array.isArray(header) ? header[0] : header
  if (!value || !value.startsWith('Bearer ')) return null
  const token = value.slice('Bearer '.length)
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email ?? undefined }
}

/** True only if the authenticated user's profile has is_admin = true. */
export async function isAdminUser(userId: string): Promise<boolean> {
  const { data } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()
  return Boolean(data?.is_admin)
}
