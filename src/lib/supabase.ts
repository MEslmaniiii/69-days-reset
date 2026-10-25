import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// The browser client uses ONLY the public anon key. Row Level Security on the
// database is what actually protects user data — the anon key is safe to ship.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * When Supabase env vars are absent we fall back to a local (device-only) demo
 * mode so the app still runs for previews. `isSupabaseConfigured` tells the rest
 * of the app which backend is active.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
