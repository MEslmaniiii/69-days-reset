import OpenAI from 'openai'
import type { GeneratedPlan } from '../../src/types'
import type { PlanInput } from '../../src/lib/planTemplates'

const ALLOWED_CATEGORIES = [
  'health', 'fitness', 'nutrition', 'sleep', 'spirituality', 'learning',
  'language', 'career', 'business', 'money', 'content', 'reading',
  'productivity', 'relationships', 'other',
]

const SYSTEM_PROMPT = `You are a pragmatic habit-design coach. Build a REALISTIC personal system from the user's goals, lifestyle and schedule.

Hard rules:
- Prefer 3 to 6 daily habits MAX, plus a few weekly habits. Never overload.
- Consistency over intensity. Respect the user's job, family and limited energy.
- Habits must directly serve the stated goals.
- Make habits measurable when sensible (steps, minutes, pages, grams, litres, contacts).
- Milestones must be concrete and dated, spaced between today and the campaign end date.
- Return ONLY valid JSON. No prose outside JSON.

Each habit uses:
- frequency: "daily" | "weekly" | "custom"
- for "weekly": set weeklyTarget (times per week)
- for "custom": set days as an array of weekday numbers (0=Sunday..6=Saturday)
- category must be one of: ${ALLOWED_CATEGORIES.join(', ')}
- recommendedTime: "morning" | "afternoon" | "evening" | "flexible"

JSON shape:
{
  "summary": string,
  "mainGoals": string[],
  "dailyHabits": [{"name","category","frequency","days?","weeklyTarget?","measurable?","targetValue?","unit?","recommendedTime?","rationale?"}],
  "weeklyHabits": [{...same...}],
  "milestones": [{"title","targetDate":"YYYY-MM-DD","measurable?","targetValue?","unit?"}]
}`

function sanitize(plan: GeneratedPlan): GeneratedPlan {
  const fixHabit = (h: any) => ({
    name: String(h.name || 'Habit').slice(0, 80),
    category: ALLOWED_CATEGORIES.includes(h.category) ? h.category : 'other',
    frequency: ['daily', 'weekly', 'custom'].includes(h.frequency) ? h.frequency : 'daily',
    days: Array.isArray(h.days) ? h.days.filter((d: number) => d >= 0 && d <= 6) : [],
    weeklyTarget: typeof h.weeklyTarget === 'number' ? h.weeklyTarget : undefined,
    measurable: Boolean(h.measurable),
    targetValue: typeof h.targetValue === 'number' ? h.targetValue : undefined,
    unit: h.unit ? String(h.unit).slice(0, 20) : undefined,
    recommendedTime: ['morning', 'afternoon', 'evening', 'flexible'].includes(h.recommendedTime)
      ? h.recommendedTime
      : undefined,
    rationale: h.rationale ? String(h.rationale).slice(0, 200) : undefined,
  })
  return {
    summary: String(plan.summary || '').slice(0, 400),
    mainGoals: Array.isArray(plan.mainGoals) ? plan.mainGoals.slice(0, 6).map(String) : [],
    dailyHabits: Array.isArray(plan.dailyHabits) ? plan.dailyHabits.slice(0, 6).map(fixHabit) : [],
    weeklyHabits: Array.isArray(plan.weeklyHabits) ? plan.weeklyHabits.slice(0, 5).map(fixHabit) : [],
    milestones: Array.isArray(plan.milestones)
      ? plan.milestones.slice(0, 6).map((m: any) => ({
          title: String(m.title || 'Milestone').slice(0, 120),
          targetDate: String(m.targetDate || '').slice(0, 10),
          measurable: Boolean(m.measurable),
          targetValue: typeof m.targetValue === 'number' ? m.targetValue : undefined,
          unit: m.unit ? String(m.unit).slice(0, 20) : undefined,
        }))
      : [],
  }
}

export async function generateWithOpenAI(
  apiKey: string,
  input: PlanInput
): Promise<GeneratedPlan> {
  const client = new OpenAI({ apiKey })
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const userMsg = JSON.stringify({
    today: input.today,
    campaignEnd: input.campaignEnd,
    bio: input.bio || '',
    schedule: input.schedule || {},
    goals: input.goals,
  })

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Create the plan for this person:\n${userMsg}` },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('Empty AI response')
  const parsed = JSON.parse(raw) as GeneratedPlan
  return sanitize(parsed)
}
