import type { ReactNode } from 'react'

export function ProgressBar({
  pct,
  size = 'md',
  tone = 'sage',
}: {
  pct: number
  size?: 'sm' | 'md' | 'lg'
  tone?: 'sage' | 'gold' | 'muted'
}) {
  const h = size === 'lg' ? 'h-3' : size === 'sm' ? 'h-1.5' : 'h-2.5'
  const bar =
    tone === 'gold'
      ? 'bg-gold-500'
      : tone === 'muted'
        ? 'bg-sage-300 dark:bg-sage-600'
        : 'bg-sage-500'
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div className={`w-full ${h} rounded-full bg-sage-100 dark:bg-white/10 overflow-hidden`}>
      <div
        className={`${h} ${bar} rounded-full transition-[width] duration-500 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export function LabeledBar({
  label,
  pct,
  tone,
}: {
  label: string
  pct: number
  tone?: 'sage' | 'gold' | 'muted'
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium text-sage-700 dark:text-sage-200">{label}</span>
        <span className="text-sm tabular-nums font-semibold text-sage-600 dark:text-sage-300">
          {pct}%
        </span>
      </div>
      <ProgressBar pct={pct} tone={tone} />
    </div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: ReactNode
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-sage-500 dark:text-sage-400">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          accent ? 'text-sage-600 dark:text-sage-300' : 'text-sage-900 dark:text-white'
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-sage-400 dark:text-sage-500 mt-0.5">{sub}</div>}
    </div>
  )
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-sage-900 dark:text-white">{children}</h2>
      {sub && <p className="text-sm text-sage-500 dark:text-sage-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
  hint,
  disabled,
  bonus,
}: {
  checked: boolean
  onChange: () => void
  label: string
  hint?: string
  disabled?: boolean
  bonus?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
        disabled
          ? 'cursor-not-allowed opacity-50 border-sage-200 dark:border-white/10'
          : checked
            ? bonus
              ? 'border-gold-500/40 bg-gold-500/10'
              : 'border-sage-400/50 bg-sage-50 dark:bg-sage-500/10 dark:border-sage-500/40'
            : 'border-sage-200 dark:border-white/10 hover:border-sage-300 dark:hover:border-white/20'
      }`}
    >
      <span
        className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border transition-colors ${
          checked
            ? bonus
              ? 'border-gold-500 bg-gold-500 text-white'
              : 'border-sage-500 bg-sage-500 text-white'
            : 'border-sage-300 dark:border-white/25 bg-transparent'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
            <path
              d="M5 10.5l3.2 3.2L15 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="min-w-0">
        <span
          className={`block text-sm font-medium ${
            checked
              ? 'text-sage-900 dark:text-white'
              : 'text-sage-700 dark:text-sage-200'
          }`}
        >
          {label}
        </span>
        {hint && <span className="block text-xs text-sage-400 dark:text-sage-500">{hint}</span>}
      </span>
    </button>
  )
}
