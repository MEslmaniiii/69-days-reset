import { Link } from 'react-router-dom'
import { BRAND } from '../lib/config'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <div className="text-5xl font-semibold text-sage-300">404</div>
      <p className="mt-3 text-sage-600 dark:text-sage-300">This page doesn’t exist.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to {BRAND.name}
      </Link>
    </div>
  )
}
