import { Link } from 'react-router-dom'
import { BRAND } from '../lib/config'

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link to="/" className="text-sm text-sage-500 hover:text-sage-700">← {BRAND.name}</Link>
      <h1 className="mt-4 text-3xl font-semibold text-sage-900 dark:text-white">Terms of Use</h1>
      <div className="mt-6 space-y-5 text-sage-600 dark:text-sage-300">
        <p>
          By using {BRAND.name} you agree to these terms. The service helps you plan and track habits.
          It is a productivity tool, not medical, financial, or professional advice.
        </p>
        <div>
          <h2 className="text-lg font-semibold text-sage-900 dark:text-white">Your responsibility</h2>
          <p>
            Use your own judgment for health, fitness, and lifestyle decisions, and consult a qualified
            professional where appropriate. You are responsible for keeping your login secure.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-sage-900 dark:text-white">AI-generated plans</h2>
          <p>
            Plans and coaching suggestions are generated automatically and may not be perfect. Always
            review them and adjust to what is realistic and safe for you before acting.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-sage-900 dark:text-white">Availability</h2>
          <p>
            The service is provided “as is”, without warranties. We may update or discontinue features.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-sage-900 dark:text-white">Contact</h2>
          <p>
            Questions? <a href={`mailto:${BRAND.supportEmail}`} className="underline">{BRAND.supportEmail}</a>
          </p>
        </div>
        <p className="pt-4 text-sm">
          <Link to="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
