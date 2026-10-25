import { useApp } from '../state/AppContext'
import { getSurah, SUGGESTED_ORDER, SURAHS } from '../lib/quran'
import { MEMORIZATION_STEPS } from '../lib/defaults'
import { habitDays, habitStreak } from '../lib/progress'
import { LabeledBar, ProgressBar, SectionTitle, StatCard } from './ui'

export function QuranView() {
  const { data, settings, today, updateQuran } = useApp()
  const q = data.quran
  const surah = getSurah(q.currentSurah)
  const memorizedInSurah = Math.max(0, Math.min(q.currentAyah - 1, surah.ayahCount))
  const surahPct = surah.ayahCount ? Math.round((memorizedInSurah / surah.ayahCount) * 100) : 0

  const hifzDays = habitDays(data, settings, today, 'hifz')
  const hifzStreak = habitStreak(data, settings, today, 'hifz')
  const revStreak = habitStreak(data, settings, today, 'murajaah')

  // Advance memorization by the daily target within/across surahs
  function advance(byAyat: number) {
    let s = q.currentSurah
    let a = q.currentAyah + byAyat
    const completed = [...q.completedSurahs]
    const added = Math.max(0, byAyat)
    while (a > getSurah(s).ayahCount) {
      a -= getSurah(s).ayahCount
      if (!completed.includes(s)) completed.push(s)
      s = Math.min(114, s + 1)
      if (s === 114 && a > getSurah(114).ayahCount) {
        a = getSurah(114).ayahCount + 1
        break
      }
    }
    updateQuran({
      currentSurah: s,
      currentAyah: Math.max(1, a),
      ayatMemorized: Math.max(0, q.ayatMemorized + added),
      completedSurahs: completed,
    })
  }

  return (
    <div className="space-y-6">
      {/* Current progress */}
      <section className="card p-5">
        <SectionTitle sub="Consistency over quantity. Small daily portions, reviewed often.">
          Quran Memorization
        </SectionTitle>

        <div className="rounded-xl bg-sage-50 dark:bg-white/5 p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-sage-500 dark:text-sage-400">
                Current Surah
              </div>
              <div className="mt-0.5 text-xl font-semibold text-sage-900 dark:text-white">
                {surah.number}. {surah.name}{' '}
                <span className="font-normal text-sage-400">· {surah.arabic}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-sage-500 dark:text-sage-400">Next ayah</div>
              <div className="text-xl font-semibold tabular-nums text-sage-700 dark:text-sage-200">
                {Math.min(q.currentAyah, surah.ayahCount)}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-sage-500 dark:text-sage-400">
                Ayah {memorizedInSurah} / {surah.ayahCount}
              </span>
              <span className="font-semibold tabular-nums text-sage-600 dark:text-sage-300">
                {surahPct}%
              </span>
            </div>
            <ProgressBar pct={surahPct} size="lg" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => advance(settings.dailyAyahTarget)}>
              + Memorized today ({settings.dailyAyahTarget} ayat)
            </button>
            <button className="btn-ghost" onClick={() => advance(1)}>
              +1 ayah
            </button>
            <button className="btn-ghost" onClick={() => advance(-1)} disabled={q.currentAyah <= 1}>
              −1 ayah
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Ayat memorized" value={q.ayatMemorized} accent />
          <StatCard label="Surahs completed" value={q.completedSurahs.length} />
          <StatCard label="Days memorized" value={hifzDays} />
          <StatCard label="Hifz streak" value={`${hifzStreak}d`} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2">
          <div className="card p-4">
            <LabeledBar label="Memorization streak" pct={Math.min(100, hifzStreak * 5)} />
            <p className="mt-1 text-xs text-sage-400">{hifzStreak} days in a row</p>
          </div>
          <div className="card p-4">
            <LabeledBar label="Revision streak" pct={Math.min(100, revStreak * 5)} tone="gold" />
            <p className="mt-1 text-xs text-sage-400">{revStreak} days in a row</p>
          </div>
        </div>
      </section>

      {/* Three activities */}
      <section className="card p-5">
        <SectionTitle>The three daily Quran activities</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { t: 'Wird', d: 'Daily Quran reading — a steady portion, no pressure.' },
            { t: 'Hifz', d: `New memorization — ~${settings.dailyAyahTarget} ayat (15–20 min).` },
            { t: "Muraja'ah", d: 'Review previous memorization (10–15 min). This is what makes it stick.' },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-sage-200 dark:border-white/10 p-4">
              <div className="font-semibold text-sage-900 dark:text-white">{x.t}</div>
              <p className="mt-1 text-sm text-sage-500 dark:text-sage-400">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Method */}
      <section className="card p-5">
        <SectionTitle sub="A gentle method — use it as a guide, not a rule.">
          Memorization method
        </SectionTitle>
        <ol className="space-y-2">
          {MEMORIZATION_STEPS.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-sage-100 dark:bg-white/10 text-xs font-semibold text-sage-600 dark:text-sage-300">
                {i + 1}
              </span>
              <span className="text-sm text-sage-700 dark:text-sage-200 pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Listening recommendation */}
      <section className="card p-5">
        <SectionTitle>Listening while training</SectionTitle>
        <div className="space-y-3 text-sm text-sage-600 dark:text-sage-300">
          <p>
            <span className="font-medium text-sage-800 dark:text-sage-100">Walking Pad:</span>{' '}
            listening to the surah you're memorizing is optional and useful for repetition.
          </p>
          <p>
            <span className="font-medium text-sage-800 dark:text-sage-100">
              Strength / dumbbell work:
            </span>{' '}
            don't rely on listening for memorization. Focus on technique and breathing.
          </p>
          <p className="rounded-lg bg-sage-50 dark:bg-white/5 px-3 py-2">
            Your main memorization session should happen <strong>after</strong> exercise, sitting
            calmly. You can log what you listened to in each day's checklist — it does not count as a
            core habit.
          </p>
        </div>
      </section>

      {/* Suggested starting plan */}
      <section className="card p-5">
        <SectionTitle sub="Starts in Juz Amma. Change your starting surah any time in Settings.">
          Suggested order
        </SectionTitle>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_ORDER.map((n) => {
            const s = SURAHS[n]
            const isCurrent = n === q.currentSurah
            const isDone = q.completedSurahs.includes(n)
            return (
              <span
                key={n}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                  isCurrent
                    ? 'bg-sage-600 text-white'
                    : isDone
                      ? 'bg-sage-100 dark:bg-white/10 text-sage-400 line-through'
                      : 'bg-sage-50 dark:bg-white/5 text-sage-600 dark:text-sage-300'
                }`}
              >
                {s.name}
              </span>
            )
          })}
        </div>
      </section>
    </div>
  )
}
