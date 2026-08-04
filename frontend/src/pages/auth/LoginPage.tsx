
import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { ApiError } from '../../api/client'

export default function LoginPage() {
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
        const role =await login(username, password)

        if (role === 'admin') {
            navigate('/admin/routes')
        } else {
            navigate('/')
        }

    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail ?? 'Login failed') : 'If you new here, first create your account!')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex w-full items-center justify-center bg-paper">
      <div className="w-full max-w-sm ">
        <div className="text-center mb-8">
          <img src='/trainlogo.jpg' className='inline-flex items-center mb-3 w-20 h-20'/>

          <h1 className="font-display text-2xl text-ink">GoRail</h1>
          <p className="text-sm text-ink/60 mt-1 font-mono tracking-wide">Colombo Fort · Badulla</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-paper-raised rounded-2xl border border-gray-green p-6 shadow-sm"
        >
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
              className="w-full rounded-lg border border-gray-green bg-white px-3 py-2 text-ink outline-none focus-visible:border-brass focus-visible:ring-1 focus-visible:ring-brass/30"
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
              className="w-full rounded-lg border border-gray-green bg-white px-3 py-2 text-ink outline-none focus-visible:border-brass focus-visible:ring-1 focus-visible:ring-brass/30"
            />
          </div>

          {error && (
            <p className="mb-4 text-sm text-clay bg-clay-bg rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-rail-green text-white font-medium py-2.5 hover:bg-rail-green-dark transition-colors disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-ink mt-5 ">
          New here?{' '}
          <Link to="/register" className="text-deep-rail-green/50 font-semibold hover:text-rail-green">
            Create a passenger account
          </Link>
        </p>
      </div>
    </div>
  )
}