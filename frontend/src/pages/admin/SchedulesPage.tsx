import { useEffect, useState, type FormEvent } from 'react'
import { listRoutes } from '../../api/trainRoutes'
import { createSchedule, findSchedules } from '../../api/schedules'
import type { Route, TrainSchedule } from '../../types/api'
import { ApiError } from '../../api/client'
import { Button } from '../../components/common/Button'
import { ErrorBanner, EmptyState } from '../../components/common/StatusBanner'
import { TextInput } from '../../components/common/TextInput'
import { SelectInput } from '../../components/common/SelectInput'
import { SectionHeader } from '../../components/common/SectionHeader.tsx'

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
    <div className="flex flex-col w-full">

      <div className="pb-7">
        <SectionHeader
          title="Schedules"
          description="Run a route on a specific date"
        />
      </div>

      <form onSubmit={handleCreate} className="flex items-center gap-10 mb-8 p-3 rounded-lg bg-form-green w-full">
        <div className="flex items-center gap-x-10 w-1/2">
          
          <SelectInput
          label='Train Route:'
          value={selectedRoute}
          onChange={(e) => setSelectedRoute(e.target.value)}
          >
            {routes.length === 0 && <option value="">No routes yet</option>}
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}

          </SelectInput>
          
          
          <TextInput
            label='Travel Date:'
            id="traveldate"
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)} 
                  
          />
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? 'Creating…' : 'Create schedule'}
        </Button>  
        
      </form>

      {error && <div className="mb-4"><ErrorBanner>{error}</ErrorBanner></div>}

      {schedules === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : schedules.length === 0 ? (
        <EmptyState title="No schedules yet" hint="Create one above once a route has stations and coaches." />
      ) : (
        <div className="rounded-lg flex flex-col w-full overflow-hidden bg-form-green px-3 py-5">
          <p className='text-ink font-semibold pb-5'>Train Schedules</p>
          {schedules.map((s) => (
            <div key={s.id} className="bg-paper-raised flex items-center justify-between rounded-lg mb-3 px-4 py-3 border border-gray-green last:border-b-0 hover:bg-white transition-colors">
              <span className="text-sm text-ink">{routeName(s.route_id)}</span>
              <span className="text-sm font-mono text-ink/60">{s.travel_date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
