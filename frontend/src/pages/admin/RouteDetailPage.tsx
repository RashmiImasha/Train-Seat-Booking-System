import { useEffect, useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { addCoach, addStation, listCoaches, listStations } from '../../api/trainRoutes'
import type { Coach, CoachName, Station } from '../../types/api'
import { ApiError } from '../../api/client'
import { Button } from '../../components/common/Button'
import { ErrorBanner, EmptyState } from '../../components/common/StatusBanner'
import { SectionHeader } from '../../components/common/SectionHeader.tsx'
import { TextInput } from '../../components/common/TextInput.tsx'
import { SelectInput } from '../../components/common/SelectInput.tsx'

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
    <div className="flex flex-col w-full">

      <div className="pb-7">
        <SectionHeader
          backTo='/admin/routes'
          backLabel='Routes'
          description="Route configuration"
        />
      </div>
      
      {error && <div className="mb-4"><ErrorBanner>{error}</ErrorBanner></div>}

      <div className="grid grid-cols-2 gap-8 ">
        {/* Stations */}
        <section className='rounded-lg flex flex-col w-full overflow-hidden bg-form-green px-3 pt-5 pb-16'>
          <p className="text-ink font-semibold pb-5">Stations</p>

          <form onSubmit={handleAddStation} className="flex flex-col gap-2 mb-4">
            <TextInput
              label='Station Name:'
              type="text"
              placeholder="Station name"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
            />
            <TextInput
              label='Distance:'
              type="number"
              min={0}
              placeholder="Distance from previous station (km)"
              value={stationDistance}
              onChange={(e) => setStationDistance(e.target.value)}
              className='ml-8'
            />
            <div className='flex w-full justify-end items-end'>
              <Button type="submit" variant="secondary" disabled={addingStation}>
              {addingStation ? 'Adding…' : 'Add station'}
              </Button>
            </div>
          </form>

          {stations === null ? (
            <p className="text-sm text-ink/50">Loading…</p>
          ) : stations.length === 0 ? (
            <EmptyState title="No stations yet" hint="Stations must be added in order along the route." />
          ) : (
            <ol className="rounded-xl border border-gray-green bg-paper-raised h-64 overflow-y-scroll ">
              {stations.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-green last:border-b-0">
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
        <section className='rounded-lg flex flex-col w-full overflow-hidden bg-form-green px-3 pt-5 pb-16'>
          <p className="text-ink font-semibold pb-5">Coaches</p>

          <form onSubmit={handleAddCoach} className="flex flex-col gap-2 mb-4">            
            <div className="flex items-center gap-10 justify-between ">
              <SelectInput
                label='Coach Class:'
                id='coachType'
                value={coachName}
                onChange={(e) => setCoachName(e.target.value as CoachName)}  
                className='ml-4'            
              >
                <option value="1st_class">1st Class</option>
                <option value="2nd_class">2nd Class</option>
                <option value="3rd_class">3rd Class</option>
              </SelectInput>

              <SelectInput
                label='Coach Type:'
                id='coachType'
                value={coachType}
                onChange={(e) => setCoachType(e.target.value as 'reserved' | 'unreserved')}
              >
                <option value="reserved">Reserved</option>
                <option value="unreserved">Unreserved</option>             

              </SelectInput>
            </div>

            <div className="flex items-center gap-10 justify-between">
              <TextInput
                label='Coach Number:'
                type="number"
                min={1}
                placeholder="Coach number"
                value={coachNumber}
                onChange={(e) => setCoachNumber(e.target.value)}
              />

              <TextInput
                label='Seat Count:'
                type="number"
                min={1}
                placeholder="Seat count"
                value={seatCount}
                onChange={(e) => setSeatCount(e.target.value)}
              />
            </div>   
            <div className='flex w-full justify-end items-end'>
              <Button type="submit" variant="secondary" disabled={addingCoach}>
              {addingCoach ? 'Adding…' : 'Add coach'}
              </Button>

            </div>        
          </form>

          {coaches === null ? (
            <p className="text-sm text-ink/50">Loading…</p>
          ) : coaches.length === 0 ? (
            <EmptyState title="No coaches yet" />
          ) : (
            <ul className="rounded-xl border border-gray-green bg-paper-raised overflow-hidden">
              {coaches.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-green last:border-b-0">
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
