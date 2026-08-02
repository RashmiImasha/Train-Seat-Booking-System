import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerPassenger } from '../../api/auth'
import { useAuth } from '../../auth/useAuth'
import { ApiError } from '../../api/client'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await registerPassenger(username, password)
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail ?? 'Registration failed') : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-paper">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl text-ink">Create your account</h1>
          <p className="text-sm text-ink/60 mt-1 font-mono tracking-wide">LSF Rail · Passenger</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-paper-raised rounded-2xl border border-line p-6 shadow-sm">
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-ink mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
            />
          </div>

          {error && <p className="mb-4 text-sm text-clay bg-clay-bg rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-rail text-white font-medium py-2.5 hover:bg-rail-dark transition-colors disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-ink/60 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-rail font-medium hover:text-brass-dark">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
