import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getUser, admin, isConfigured } from './_lib/supabaseAdmin'
import { generateWithOpenAI } from './_lib/openaiPlan'
import { generatePlanLocally, type PlanInput } from '../src/lib/planTemplates'
import type { GeneratedPlan } from '../src/types'

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

  const input = (req.body || {}) as PlanInput
  if (!Array.isArray(input.goals)) {
    res.status(400).json({ error: 'Missing goals' })
    return
  }

  let plan: GeneratedPlan
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey) {
    try {
      plan = await generateWithOpenAI(apiKey, input)
    } catch (e) {
      console.error('OpenAI generation failed, using fallback:', (e as Error).message)
      plan = generatePlanLocally(input)
    }
  } else {
    plan = generatePlanLocally(input)
  }

  // best-effort snapshot
  try {
    await admin.from('ai_plans').insert({ user_id: user.id, status: 'proposed', plan })
  } catch {
    /* ignore */
  }

  res.status(200).json(plan)
}
