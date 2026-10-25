import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import { getUser, isConfigured } from './_lib/supabaseAdmin'

const SYSTEM = `You are a concise, practical habit coach. Given a short, non-personal summary of a user's goals and recent completion stats, give 2-4 short, actionable suggestions.
Rules: be specific and kind, never preachy or over-motivational. No emojis. Max ~90 words. Plain text, one suggestion per line.`

function fallback(): string {
  return [
    'Protect your top 1–2 habits first — the rest are bonus.',
    'If a habit keeps slipping, shrink it or move it to your strongest time of day.',
    'Aim for "good enough" daily rather than perfect occasionally.',
  ].join('\n')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!isConfigured()) {
    res.status(200).json({ advice: fallback() })
    return
  }
  const user = await getUser(req)
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const context = String((req.body as { context?: string })?.context || '').slice(0, 2000)
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    res.status(200).json({ advice: fallback() })
    return
  }

  try {
    const client = new OpenAI({ apiKey })
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.5,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: context || 'Give me general consistency advice.' },
      ],
    })
    const advice = completion.choices[0]?.message?.content?.trim() || fallback()
    res.status(200).json({ advice })
  } catch (e) {
    console.error('coach error', (e as Error).message)
    res.status(200).json({ advice: fallback() })
  }
}
