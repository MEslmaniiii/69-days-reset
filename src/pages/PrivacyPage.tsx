import { Link } from 'react-router-dom'
import { BRAND, PRIVACY_POLICY_VERSION } from '../lib/config'

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link to="/" className="text-sm text-sage-500 hover:text-sage-700">← {BRAND.name}</Link>
      <h1 className="mt-4 text-3xl font-semibold text-sage-900 dark:text-white">{title}</h1>
      <div className="prose-sm mt-6 space-y-5 text-sage-600 dark:text-sage-300">{children}</div>
    </div>
  )
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-sage-900 dark:text-white">{children}</h2>
}

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <p className="text-sm text-sage-400">Version {PRIVACY_POLICY_VERSION}</p>
      <p>
        {BRAND.name} helps you build a personalized habit system. This policy explains, in plain
        language, what we collect, why, and the control you have.
      </p>

      <div>
        <H>What we collect</H>
        <ul className="ml-5 list-disc space-y-1">
          <li>Your name and phone number (to identify your account and, with consent, contact you).</li>
          <li>Your email address (for sign-in).</li>
          <li>A short description of your lifestyle and the goals you choose.</li>
          <li>Your habits, daily check-ins, measurements, and weekly reviews.</li>
          <li>Basic attribution data (how you arrived — e.g. a campaign link) and anonymous usage events.</li>
        </ul>
      </div>

      <div>
        <H>Why we collect it</H>
        <p>
          To generate and run your personalized plan, show your progress, and improve the product. Your
          goals and progress numbers may be sent to our AI provider to generate advice — never your
          name, phone number, or personal description.
        </p>
      </div>

      <div>
        <H>How it is used</H>
        <p>
          Your personal data is private to your account. We never sell it. Aggregate, non-identifying
          statistics may be used to understand overall usage.
        </p>
      </div>

      <div>
        <H>Marketing communications</H>
        <p>
          We only send updates, offers, or content if you explicitly opt in. You can withdraw consent
          anytime in Settings. We never use your phone number for marketing without consent.
        </p>
      </div>

      <div>
        <H>Analytics</H>
        <p>
          We record anonymous product events (e.g. “plan generated”) to improve the experience. These
          events never contain your name, phone number, email, or personal description.
        </p>
      </div>

      <div>
        <H>Data storage</H>
        <p>
          Data is stored in a secure database with row-level security, so each account can only access
          its own data. Secrets and keys are never exposed in the app.
        </p>
      </div>

      <div>
        <H>Your rights & deletion</H>
        <p>
          You can download all your data or permanently delete your account at any time from Settings.
          Deletion removes your profile, habits, logs, and progress. To request anything else, contact{' '}
          <a href={`mailto:${BRAND.supportEmail}`} className="underline">{BRAND.supportEmail}</a>.
        </p>
      </div>

      <p className="pt-4 text-sm">
        <Link to="/terms" className="underline">Terms of Use</Link>
      </p>
    </LegalShell>
  )
}
