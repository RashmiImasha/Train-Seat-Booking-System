import { useEffect, useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { addCoach, addStation, listCoaches, listStations } from '../../api/trainRoutes'
import type { Coach, CoachName, Station } from '../../types/api'
import { ApiError } from '../../api/client'
import { Button } from '../../components/common/Button'
import { ErrorBanner, EmptyState } from '../../components/common/StatusBanner'

export default function RouteDetailPage() {
  const { routeId } = useParams<{ routeId: string }>()
  const [stations, setStations] = useState<Station[] | null>(null)
  const [coaches, setCoaches] = useState<Coach[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [stationName, setStationName] = useState('')
  const [stationDistance, setStationDistance] = useState('')
  const [addingStation, setAddingStation] = useState(false)

  const [coachNumber, setCoachNumber] = useState('')
  const [coachType, setCoachType] = useState<'reserved' | 'unreserved'>('reserved')
  const [coachName, setCoachName] = useState<CoachName>('1st_class')
  const [seatCount, setSeatCount] = useState('')
  const [addingCoach, setAddingCoach] = useState(false)

  async function load() {
    if (!routeId) return
    try {
      const [s, c] = await Promise.all([listStations(routeId), listCoaches(routeId)])
      setStations(s)
      setCoaches(c)
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to load route')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId])

  async function handleAddStation(e: FormEvent) {
    e.preventDefault()
    if (!routeId || !stationName.trim()) return
    setAddingStation(true)
    setError(null)
    try {
      await addStation(routeId, {
        name: stationName.trim(),
        sequence_order: stations?.length ?? 0,
        distance_from_previous_km: Number(stationDistance) || 0,
      })
      setStationName('')
      setStationDistance('')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to add station')
    } finally {
      setAddingStation(false)
    }
  }

  async function handleAddCoach(e: FormEvent) {
    e.preventDefault()
    if (!routeId || !coachNumber || !seatCount) return
    setAddingCoach(true)
    setError(null)
    try {
      await addCoach(routeId, {
        coach_number: Number(coachNumber),
        coach_type: coachType,
        seat_count: Number(seatCount),
        coach_name: coachName,
      })
      setCoachNumber('')
      setSeatCount('')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to add coach')
    } finally {
      setAddingCoach(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-4xl">
      <Link to="/admin/routes" className="text-sm text-rail font-medium hover:text-brass-dark">
        ← Routes
      </Link>
      <h1 className="font-display text-2xl text-ink mt-2 mb-6">Route configuration</h1>

      {error && <div className="mb-6"><ErrorBanner>{error}</ErrorBanner></div>}

      <div className="grid grid-cols-2 gap-8">
        {/* Stations */}
        <section>
          <h2 className="font-display text-lg text-ink mb-3">Stations</h2>

          <form onSubmit={handleAddStation} className="flex flex-col gap-2 mb-4">
            <input
              type="text"
              placeholder="Station name"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
            />
            <input
              type="number"
              min={0}
              placeholder="Distance from previous station (km)"
              value={stationDistance}
              onChange={(e) => setStationDistance(e.target.value)}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
            />
            <Button type="submit" variant="secondary" disabled={addingStation}>
              {addingStation ? 'Adding…' : 'Add station'}
            </Button>
          </form>

          {stations === null ? (
            <p className="text-sm text-ink/50">Loading…</p>
          ) : stations.length === 0 ? (
            <EmptyState title="No stations yet" hint="Stations must be added in order along the route." />
          ) : (
            <ol className="rounded-xl border border-line bg-paper-raised overflow-hidden">
              {stations.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-4 py-2.5 border-b border-line last:border-b-0">
                  <span className="text-sm text-ink">
                    <span className="font-mono text-ink/40 mr-2">{s.sequence_order}</span>
                    {s.name}
                  </span>
                  {s.sequence_order > 0 && (
                    <span className="text-xs text-ink/50 font-mono">+{s.distance_from_previous_km}km</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Coaches */}
        <section>
          <h2 className="font-display text-lg text-ink mb-3">Coaches</h2>

          <form onSubmit={handleAddCoach} className="flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-2 justify-between">
              <input
              type="number"
              min={1}
              placeholder="Coach number"
              value={coachNumber}
              onChange={(e) => setCoachNumber(e.target.value)}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
              />
              <select
              value={coachName}
              onChange={(e) => setCoachName(e.target.value as CoachName)}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
            >
              <option value="1st_class">1st Class</option>
              <option value="2nd_class">2nd Class</option>
              <option value="3rd_class">3rd Class</option>
            </select>

            </div>
            
            <select
              value={coachType}
              onChange={(e) => setCoachType(e.target.value as 'reserved' | 'unreserved')}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
            >
              <option value="reserved">Reserved</option>
              <option value="unreserved">Unreserved</option>
            </select>
            <input
              type="number"
              min={1}
              placeholder="Seat count"
              value={seatCount}
              onChange={(e) => setSeatCount(e.target.value)}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
            />
            <Button type="submit" variant="secondary" disabled={addingCoach}>
              {addingCoach ? 'Adding…' : 'Add coach'}
            </Button>
          </form>

          {coaches === null ? (
            <p className="text-sm text-ink/50">Loading…</p>
          ) : coaches.length === 0 ? (
            <EmptyState title="No coaches yet" />
          ) : (
            <ul className="rounded-xl border border-line bg-paper-raised overflow-hidden">
              {coaches.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-4 py-2.5 border-b border-line last:border-b-0">
                  <span className="text-sm text-ink">Coach {c.coach_number}</span>
                  <span className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                        c.coach_type === 'reserved' ? 'bg-leaf-bg text-leaf' : 'bg-line/60 text-ink/60'
                      }`}
                    >
                      {c.coach_type}
                    </span>
                    <span className="text-xs text-ink/50 font-mono">{c.seat_count} seats</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
