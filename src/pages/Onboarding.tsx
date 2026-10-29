import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import type { CountryCode } from 'libphonenumber-js'
import {
  GOAL_CATEGORIES,
  type GeneratedPlan,
  type Habit,
  type HabitCategory,
  type Milestone,
  type Profile,
  type Schedule,
  type TimeOfDay,
  type Weekday,
  WEEKDAY_SHORT,
} from '../types'
import { useAuth } from '../state/AuthContext'
import { useData, proposedToHabit } from '../state/DataContext'
import { COUNTRIES, DEFAULT_COUNTRY, validatePhone } from '../lib/phone'
import { BRAND, DEFAULT_CAMPAIGN, PRIVACY_POLICY_VERSION, defaultCampaignStart } from '../lib/config'
import { loadUtm, track } from '../lib/analytics'
import { generatePlan } from '../lib/api'
import { presetById } from '../lib/presets'
import { newId } from '../data/repo'

const DEFAULT_TIMEZONE = 'Africa/Cairo'

/** A preset chosen on the landing page ("Start with this routine"), if any. */
function selectedPreset() {
  try {
    const id = sessionStorage.getItem('byr_preset')
    return id ? presetById(id) : undefined
  } catch {
    return undefined
  }
}
import { todayKey } from '../lib/dates'
import { Button, Field, Pill, Spinner } from '../components/ui'
import HabitListEditor from '../components/HabitEditor'

const GOAL_QUESTIONS: Partial<Record<HabitCategory, { id: string; label: string; placeholder: string }[]>> = {
  health: [
    { id: 'current', label: 'Current weight (optional)', placeholder: 'e.g. 85 kg' },
    { id: 'target', label: 'Target weight (optional)', placeholder: 'e.g. 78 kg' },
    { id: 'experience', label: 'Exercise experience', placeholder: 'beginner / some / experienced' },
  ],
  fitness: [
    { id: 'experience', label: 'Training experience', placeholder: 'beginner / some / experienced' },
    { id: 'equipment', label: 'Available equipment', placeholder: 'gym / home / none' },
    { id: 'days', label: 'Days available per week', placeholder: 'e.g. 4' },
  ],
  nutrition: [
    { id: 'style', label: 'Any dietary preference?', placeholder: 'none / vegetarian / halal / ...' },
    { id: 'challenge', label: 'Biggest challenge', placeholder: 'e.g. late-night snacking' },
  ],
  sleep: [{ id: 'issue', label: 'What makes sleep hard?', placeholder: 'e.g. phone at night' }],
  spirituality: [
    { id: 'focus', label: 'Focus', placeholder: 'reading / memorization / revision' },
    { id: 'time', label: 'Time available daily', placeholder: 'e.g. 20 minutes' },
  ],
  learning: [
    { id: 'skill', label: 'What skill?', placeholder: 'e.g. Python' },
    { id: 'level', label: 'Current level', placeholder: 'beginner / intermediate' },
    { id: 'minutes', label: 'Minutes available per day', placeholder: 'e.g. 30' },
  ],
  language: [
    { id: 'language', label: 'Which language?', placeholder: 'e.g. French' },
    { id: 'level', label: 'Current level', placeholder: 'beginner / intermediate' },
    { id: 'minutes', label: 'Minutes available per day', placeholder: 'e.g. 30' },
  ],
  career: [
    { id: 'objective', label: 'Main objective', placeholder: 'e.g. get promoted' },
    { id: 'focus', label: 'Key focus area', placeholder: 'e.g. deep work' },
  ],
  business: [
    { id: 'business', label: 'What business?', placeholder: 'e.g. coaching' },
    { id: 'stage', label: 'Current stage', placeholder: 'idea / early / growing' },
    { id: 'objective', label: 'Main objective', placeholder: 'e.g. first 10 clients' },
  ],
  money: [
    { id: 'target', label: 'Money goal', placeholder: 'e.g. save $5,000' },
    { id: 'timeframe', label: 'By when?', placeholder: 'e.g. end of year' },
  ],
  content: [
    { id: 'platform', label: 'Platform', placeholder: 'e.g. Instagram' },
    { id: 'cadence', label: 'Target cadence', placeholder: 'e.g. 2 posts/week' },
  ],
  reading: [{ id: 'target', label: 'Reading goal', placeholder: 'e.g. 12 books this year' }],
  productivity: [{ id: 'focus', label: 'What do you want to improve?', placeholder: 'e.g. mornings' }],
  relationships: [{ id: 'focus', label: 'Focus', placeholder: 'e.g. weekly family time' }],
  other: [{ id: 'describe', label: 'Describe this goal', placeholder: 'What do you want to achieve?' }],
}

interface OnbGoal {
  id: string
  category: HabitCategory
  title: string
  details: Record<string, string>
  custom?: boolean
}

const STEPS = ['Name', 'Contact', 'About you', 'Goals', 'Details', 'Schedule', 'Consent'] as const

export default function Onboarding() {
  const { user } = useAuth()
  const { data, createProfile, setGoals, setHabits, setMilestones, saveProfile } = useData()
  const navigate = useNavigate()

  // A routine preset chosen on the landing page (optional).
  const preset = useMemo(() => selectedPreset(), [])

  const [step, setStep] = useState(0)
  // form state
  const [name, setName] = useState('')
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [phoneNat, setPhoneNat] = useState('')
  const [bio, setBio] = useState('')
  const [goals, setGoalsState] = useState<OnbGoal[]>(() => {
    if (!preset) return []
    // Pre-select the goal categories the preset's routine covers (editable).
    const cats = Array.from(
      new Set([...preset.plan.dailyHabits, ...preset.plan.weeklyHabits].map((hh) => hh.category))
    )
    return cats.slice(0, 6).map((c) => ({
      id: newId(),
      category: c,
      title: GOAL_CATEGORIES.find((g) => g.key === c)?.label ?? c,
      details: {},
    }))
  })
  const [customTitle, setCustomTitle] = useState('')
  const [schedule, setSchedule] = useState<Schedule>({
    preferredTime: 'morning',
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    wakeTime: '',
    sleepTime: '',
    workStart: '',
    workEnd: '',
    timezone: DEFAULT_TIMEZONE,
    eatingWindowStart: '',
    eatingWindowEnd: '',
  })
  const [privacyOk, setPrivacyOk] = useState(false)
  const [marketingOk, setMarketingOk] = useState(false)

  // generation state
  const [phase, setPhase] = useState<'form' | 'generating' | 'review'>('form')
  const [planHabits, setPlanHabits] = useState<Habit[]>([])
  const [planMilestones, setPlanMilestones] = useState<Milestone[]>([])
  const [planSummary, setPlanSummary] = useState('')
  const [mainGoals, setMainGoals] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Already onboarded? go straight to the app.
  if (data?.profile?.onboardingComplete) return <Navigate to="/app" replace />

  const phoneValid = useMemo(
    () => (phoneNat ? validatePhone(phoneNat, country.code as CountryCode) : null),
    [phoneNat, country]
  )

  const toggleGoal = (category: HabitCategory, label: string) => {
    setGoalsState((prev) => {
      const exists = prev.find((g) => g.category === category && !g.custom)
      if (exists) return prev.filter((g) => g !== exists)
      return [...prev, { id: newId(), category, title: label, details: {} }]
    })
  }

  const addCustomGoal = () => {
    const t = customTitle.trim()
    if (!t) return
    setGoalsState((prev) => [...prev, { id: newId(), category: 'other', title: t, details: {}, custom: true }])
    setCustomTitle('')
  }

  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return name.trim().length >= 2
      case 1:
        return Boolean(phoneValid)
      case 2:
        return true // bio optional
      case 3:
        return goals.length > 0
      case 4:
        return true
      case 5:
        return schedule.availableDays.length > 0
      case 6:
        return privacyOk
      default:
        return true
    }
  }

  const buildProfile = (): Profile => ({
    id: user!.id,
    name: name.trim(),
    email: user!.email,
    phone: phoneValid ?? undefined,
    countryCode: country.dial,
    country: country.code,
    bio: bio.trim() || undefined,
    schedule,
    campaignName: DEFAULT_CAMPAIGN.name,
    campaignStart: defaultCampaignStart(),
    campaignEnd: DEFAULT_CAMPAIGN.end,
    theme: 'system',
    marketingConsent: marketingOk,
    marketingConsentAt: marketingOk ? new Date(`${todayKey()}T00:00:00`).toISOString() : undefined,
    privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    isAdmin: false,
    onboardingComplete: false,
    createdAt: new Date(`${todayKey()}T00:00:00`).toISOString(),
    utm: loadUtm(),
  })

  const startGeneration = async () => {
    setError(null)
    setPhase('generating')
    try {
      const profile = buildProfile()
      await createProfile(profile)
      await setGoals(
        goals.map((g) => ({
          id: g.id,
          title: g.title,
          category: g.category,
          details: g.details,
          createdAt: profile.createdAt,
        }))
      )
      let plan: GeneratedPlan
      if (preset) {
        // "Start with this routine" — use the preset plan directly (editable in review).
        plan = preset.plan
        track('plan_generated', { goals: goals.length, preset: preset.id }, user!.id)
      } else {
        plan = await generatePlan({
          bio: bio.trim(),
          goals: goals.map((g) => ({ title: g.title, category: g.category, details: g.details })),
          schedule,
          campaignEnd: profile.campaignEnd,
          today: todayKey(schedule.timezone),
        })
        track('plan_generated', { goals: goals.length }, user!.id)
      }
      let i = 0
      setPlanHabits([
        ...plan.dailyHabits.map((p) => proposedToHabit(p, i++, profile.createdAt)),
        ...plan.weeklyHabits.map((p) => proposedToHabit(p, i++, profile.createdAt)),
      ])
      setPlanMilestones(
        plan.milestones.map((m) => ({
          id: newId(),
          title: m.title,
          targetDate: m.targetDate,
          measurable: Boolean(m.measurable),
          targetValue: m.targetValue,
          unit: m.unit,
          achieved: false,
        }))
      )
      setPlanSummary(plan.summary)
      setMainGoals(plan.mainGoals)
      setPhase('review')
    } catch (e) {
      setError((e as Error).message || 'Something went wrong. Please try again.')
      setPhase('form')
    }
  }

  const acceptAndStart = async () => {
    setSaving(true)
    setError(null)
    try {
      const cleaned = planHabits
        .filter((h) => h.name.trim())
        .map((h, idx) => ({ ...h, sortOrder: idx }))
      await setHabits(cleaned)
      await setMilestones(planMilestones)
      await saveProfile({ onboardingComplete: true })
      try {
        sessionStorage.removeItem('byr_preset')
      } catch {
        // ignore storage errors
      }
      track('onboarding_completed', {}, user!.id)
      track('plan_accepted', { habits: cleaned.length }, user!.id)
      navigate('/app', { replace: true })
    } catch (e) {
      setError((e as Error).message || 'Could not save your plan.')
      setSaving(false)
    }
  }

  // ---- render ----
  if (phase === 'generating') {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
        <Spinner />
        <h2 className="text-lg font-semibold text-sage-900 dark:text-white">Creating your system…</h2>
        <p className="text-sm text-sage-500">
          Designing a realistic set of habits and milestones around your goals and schedule.
        </p>
      </div>
    )
  }

  if (phase === 'review') {
    return (
      <div className="mx-auto max-w-2xl px-5 py-8">
        <Pill tone="gold">Your Reset Plan</Pill>
        <h1 className="mt-3 text-2xl font-semibold text-sage-900 dark:text-white">
          Here’s your proposed system
        </h1>
        <p className="mt-2 text-sm text-sage-500 dark:text-sage-400">{planSummary}</p>

        {mainGoals.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {mainGoals.map((g) => (
              <Pill key={g}>{g}</Pill>
            ))}
          </div>
        )}

        <h2 className="mb-3 mt-6 text-lg font-semibold text-sage-900 dark:text-white">
          Habits — edit anything before you start
        </h2>
        <HabitListEditor habits={planHabits} onChange={setPlanHabits} />

        {planMilestones.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-semibold text-sage-900 dark:text-white">Milestones</h2>
            <div className="space-y-2">
              {planMilestones.map((m) => (
                <div key={m.id} className="card flex items-center justify-between p-3 text-sm">
                  <span className="text-sage-700 dark:text-sage-200">{m.title}</span>
                  <span className="tabular-nums text-sage-400">{m.targetDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="sticky bottom-0 mt-6 flex gap-3 bg-sage-50/80 py-4 backdrop-blur dark:bg-[#12161a]/80">
          <Button variant="outline" onClick={() => setPhase('form')} className="flex-1">
            Back
          </Button>
          <Button onClick={acceptAndStart} loading={saving} className="flex-[2]">
            Start My Reset
          </Button>
        </div>
      </div>
    )
  }

  // form phase
  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <div className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-sage-400">
        {BRAND.name} · Step {step + 1} of {STEPS.length}
      </div>
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-sage-100 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-sage-500 transition-[width] duration-300"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {step === 0 && (
        <StepShell title="What's your name?" sub="We'll use it to personalize your dashboard.">
          <Field label="Full name">
            <input
              className="field"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mohamed Saeed"
            />
          </Field>
        </StepShell>
      )}

      {step === 1 && (
        <StepShell title="How can we reach you?" sub="Your number is private and never shown publicly.">
          <Field label="Phone number">
            <div className="flex gap-2">
              <select
                className="field w-32"
                value={country.code}
                onChange={(e) =>
                  setCountry(COUNTRIES.find((c) => c.code === e.target.value) ?? DEFAULT_COUNTRY)
                }
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.dial}
                  </option>
                ))}
              </select>
              <input
                className="field flex-1"
                value={phoneNat}
                inputMode="tel"
                onChange={(e) => setPhoneNat(e.target.value)}
                placeholder="1012345678"
              />
            </div>
          </Field>
          {phoneNat && !phoneValid && (
            <p className="text-sm text-red-600">That doesn’t look like a valid number for {country.name}.</p>
          )}
          {phoneValid && <p className="text-sm text-sage-500">✓ {phoneValid}</p>}
        </StepShell>
      )}

      {step === 2 && (
        <StepShell
          title="Tell us a little about yourself"
          sub="Your lifestyle, work, responsibilities — anything that affects your routine."
        >
          <textarea
            className="field min-h-[140px]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="I work 9–5, I'm married, I usually have free time early in the morning, and I want to improve my health and productivity."
          />
        </StepShell>
      )}

      {step === 3 && (
        <StepShell
          title="What do you want to achieve before the end of 2026?"
          sub="Pick one or more. You can add your own."
        >
          <div className="grid grid-cols-2 gap-2">
            {GOAL_CATEGORIES.map((c) => {
              const active = goals.some((g) => g.category === c.key && !g.custom)
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggleGoal(c.key, c.label)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                    active
                      ? 'border-sage-500 bg-sage-50 dark:bg-sage-500/10'
                      : 'border-sage-200 dark:border-white/10 hover:border-sage-300'
                  }`}
                >
                  <span>{c.emoji}</span>
                  <span className="text-sage-800 dark:text-sage-100">{c.label}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              className="field flex-1"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Add a custom goal"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomGoal())}
            />
            <Button variant="outline" onClick={addCustomGoal}>
              Add
            </Button>
          </div>
          {goals.filter((g) => g.custom).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {goals
                .filter((g) => g.custom)
                .map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoalsState((prev) => prev.filter((x) => x.id !== g.id))}
                    className="rounded-full bg-sage-500/12 px-2.5 py-1 text-xs text-sage-700 dark:text-sage-200"
                  >
                    {g.title} ✕
                  </button>
                ))}
            </div>
          )}
        </StepShell>
      )}

      {step === 4 && (
        <StepShell title="A few quick details" sub="Only what helps the AI tailor your plan. Skip anything.">
          <div className="space-y-5">
            {goals.map((g) => {
              const qs = GOAL_QUESTIONS[g.category] ?? GOAL_QUESTIONS.other!
              return (
                <div key={g.id}>
                  <div className="mb-2 font-medium text-sage-800 dark:text-sage-100">{g.title}</div>
                  <div className="space-y-2">
                    {qs.map((q) => (
                      <input
                        key={q.id}
                        className="field"
                        placeholder={q.label + ' — ' + q.placeholder}
                        value={g.details[q.id] ?? ''}
                        onChange={(e) =>
                          setGoalsState((prev) =>
                            prev.map((x) =>
                              x.id === g.id
                                ? { ...x, details: { ...x.details, [q.id]: e.target.value } }
                                : x
                            )
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </StepShell>
      )}

      {step === 5 && (
        <StepShell title="Your time & routine" sub="So habits land when you actually have energy.">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Wake up">
              <input type="time" className="field" value={schedule.wakeTime}
                onChange={(e) => setSchedule({ ...schedule, wakeTime: e.target.value })} />
            </Field>
            <Field label="Sleep">
              <input type="time" className="field" value={schedule.sleepTime}
                onChange={(e) => setSchedule({ ...schedule, sleepTime: e.target.value })} />
            </Field>
            <Field label="Work/study start">
              <input type="time" className="field" value={schedule.workStart}
                onChange={(e) => setSchedule({ ...schedule, workStart: e.target.value })} />
            </Field>
            <Field label="Work/study end">
              <input type="time" className="field" value={schedule.workEnd}
                onChange={(e) => setSchedule({ ...schedule, workEnd: e.target.value })} />
            </Field>
          </div>
          <Field label="Timezone" hint="Used to decide when your day rolls over.">
            <input
              className="field"
              value={schedule.timezone ?? ''}
              placeholder="e.g. Africa/Cairo"
              onChange={(e) => setSchedule({ ...schedule, timezone: e.target.value })}
            />
          </Field>
          <Field label="Eating window (optional)" hint="For intermittent fasting — leave blank if not applicable. You can set this later.">
            <div className="grid grid-cols-2 gap-3">
              <input type="time" className="field" value={schedule.eatingWindowStart}
                onChange={(e) => setSchedule({ ...schedule, eatingWindowStart: e.target.value })} />
              <input type="time" className="field" value={schedule.eatingWindowEnd}
                onChange={(e) => setSchedule({ ...schedule, eatingWindowEnd: e.target.value })} />
            </div>
          </Field>
          <Field label="Preferred habit time">
            <div className="grid grid-cols-4 gap-2">
              {(['morning', 'afternoon', 'evening', 'flexible'] as TimeOfDay[]).map((t) => (
                <button key={t} type="button"
                  onClick={() => setSchedule({ ...schedule, preferredTime: t })}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium capitalize ${
                    schedule.preferredTime === t
                      ? 'border-sage-500 bg-sage-500 text-white'
                      : 'border-sage-200 text-sage-500 dark:border-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Available days">
            <div className="flex flex-wrap gap-1.5">
              {([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map((d) => {
                const active = schedule.availableDays.includes(d)
                return (
                  <button key={d} type="button"
                    onClick={() =>
                      setSchedule({
                        ...schedule,
                        availableDays: active
                          ? schedule.availableDays.filter((x) => x !== d)
                          : [...schedule.availableDays, d],
                      })
                    }
                    className={`h-9 w-10 rounded-lg border text-xs font-medium ${
                      active ? 'border-sage-500 bg-sage-500 text-white' : 'border-sage-200 text-sage-500 dark:border-white/10'
                    }`}
                  >
                    {WEEKDAY_SHORT[d]}
                  </button>
                )
              })}
            </div>
          </Field>
        </StepShell>
      )}

      {step === 6 && (
        <StepShell title="Before we build your plan" sub="A couple of quick agreements.">
          <label className="flex items-start gap-3 rounded-xl border border-sage-200 p-3 dark:border-white/10">
            <input type="checkbox" className="mt-1" checked={privacyOk} onChange={(e) => setPrivacyOk(e.target.checked)} />
            <span className="text-sm text-sage-700 dark:text-sage-200">
              I agree to the{' '}
              <a href="/privacy" target="_blank" className="underline">Privacy Policy</a> and{' '}
              <a href="/terms" target="_blank" className="underline">Terms of Use</a>.{' '}
              <span className="text-red-500">*</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-sage-200 p-3 dark:border-white/10">
            <input type="checkbox" className="mt-1" checked={marketingOk} onChange={(e) => setMarketingOk(e.target.checked)} />
            <span className="text-sm text-sage-700 dark:text-sage-200">
              I'd like to receive useful updates, offers, and content. (Optional)
            </span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </StepShell>
      )}

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
            Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="flex-[2]">
            Continue
          </Button>
        ) : (
          <Button onClick={startGeneration} disabled={!canNext()} className="flex-[2]">
            Build my plan
          </Button>
        )}
      </div>
    </div>
  )
}

function StepShell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="animate-fadein">
      <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">{title}</h1>
      {sub && <p className="mb-5 mt-2 text-sm text-sage-500 dark:text-sage-400">{sub}</p>}
      <div className="space-y-4">{children}</div>
    </div>
  )
}
