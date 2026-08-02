import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createRoute, listRoutes } from '../../api/trainRoutes'
import type { Route } from '../../types/api'
import { ApiError } from '../../api/client'
import { Button } from '../../components/common/Button'
import { ErrorBanner, EmptyState } from '../../components/common/StatusBanner'

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[] | null>(null)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    try {
      setRoutes(await listRoutes())
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to load routes')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    try {
      await createRoute(newName.trim())
      setNewName('')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to create route')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-3xl">
      <h1 className="font-display text-2xl text-ink mb-1">Routes</h1>
      <p className="text-sm text-ink/60 mb-6">Configure the lines this system serves.</p>

      <form onSubmit={handleCreate} className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="e.g. Colombo Fort-Badulla"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
        />
        <Button type="submit" disabled={creating}>
          {creating ? 'Adding…' : 'Add route'}
        </Button>
      </form>

      {error && <div className="mb-4">
        <ErrorBanner>{error}</ErrorBanner>
      </div>}

      {routes === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : routes.length === 0 ? (
        <EmptyState title="No routes yet" hint="Add your first line above to get started." />
      ) : (
        <div className="rounded-xl border border-line bg-paper-raised overflow-hidden">
          {routes.map((route) => (
            <Link
              key={route.id}
              to={`/admin/routes/${route.id}`}
              className="flex items-center justify-between px-4 py-3 border-b border-line last:border-b-0 hover:bg-white transition-colors"
            >
              <span className="font-medium text-ink">{route.name}</span>
              <span className="text-sm text-rail font-mono">Configure →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
