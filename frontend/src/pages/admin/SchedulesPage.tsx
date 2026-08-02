import { useEffect, useState, type FormEvent } from 'react'
import { listRoutes } from '../../api/trainRoutes'
import { createSchedule, findSchedules } from '../../api/schedules'
import type { Route, TrainSchedule } from '../../types/api'
import { ApiError } from '../../api/client'
import { Button } from '../../components/common/Button'
import { ErrorBanner, EmptyState } from '../../components/common/StatusBanner'

export default function SchedulesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [schedules, setSchedules] = useState<TrainSchedule[] | null>(null)
  const [selectedRoute, setSelectedRoute] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function loadRoutes() {
    const r = await listRoutes()
    setRoutes(r)
    if (r.length > 0 && !selectedRoute) setSelectedRoute(r[0].id)
  }

  async function loadSchedules() {
    try {
      setSchedules(await findSchedules({}))
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to load schedules')
    }
  }

  useEffect(() => {
    loadRoutes()
    loadSchedules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!selectedRoute || !travelDate) return
    setCreating(true)
    setError(null)
    try {
      await createSchedule(selectedRoute, travelDate)
      setTravelDate('')
      await loadSchedules()
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to create schedule')
    } finally {
      setCreating(false)
    }
  }

  const routeName = (id: string) => routes.find((r) => r.id === id)?.name ?? id

  return (
    <div className="px-8 py-8 max-w-3xl">
      <h1 className="font-display text-2xl text-ink mb-1">Schedules</h1>
      <p className="text-sm text-ink/60 mb-6">Run a route on a specific date.</p>

      <form onSubmit={handleCreate} className="flex gap-2 mb-8">
        <select
          value={selectedRoute}
          onChange={(e) => setSelectedRoute(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
        >
          {routes.length === 0 && <option value="">No routes yet</option>}
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={travelDate}
          onChange={(e) => setTravelDate(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
        />
        <Button type="submit" disabled={creating || routes.length === 0}>
          {creating ? 'Creating…' : 'Create schedule'}
        </Button>
      </form>

      {error && <div className="mb-4"><ErrorBanner>{error}</ErrorBanner></div>}

      {schedules === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : schedules.length === 0 ? (
        <EmptyState title="No schedules yet" hint="Create one above once a route has stations and coaches." />
      ) : (
        <div className="rounded-xl border border-line bg-paper-raised overflow-hidden">
          {schedules.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 border-b border-line last:border-b-0">
              <span className="text-sm text-ink">{routeName(s.route_id)}</span>
              <span className="text-sm font-mono text-ink/60">{s.travel_date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
