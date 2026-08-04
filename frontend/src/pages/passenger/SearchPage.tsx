import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { listRoutes, listStations } from '../../api/trainRoutes'
import { findSchedules } from '../../api/schedules'
import type { Route, Station } from '../../types/api'
import { ApiError } from '../../api/client'
import { Button } from '../../components/common/Button'
import { ErrorBanner } from '../../components/common/StatusBanner'
import { SelectInput } from '../../components/common/SelectInput'
import { TextInput } from '../../components/common/TextInput'

export default function SearchPage() {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<Route[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [stations, setStations] = useState<Station[]>([])
  const [originId, setOriginId] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    listRoutes().then((r) => {
      setRoutes(r)
      if (r.length > 0) setSelectedRouteId(r[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedRouteId) return
    listStations(selectedRouteId).then((s) => {
      setStations(s)
      setOriginId(s[0]?.id ?? '')
      setDestinationId(s[s.length - 1]?.id ?? '')
    })
  }, [selectedRouteId])

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!selectedRouteId || !originId || !destinationId || !travelDate) return
    if (originId === destinationId) {
      setError('Origin and destination must be different stations')
      return
    }
    setError(null)
    setSearching(true)
    try {
      const schedules = await findSchedules({ route_id: selectedRouteId, travel_date: travelDate })
      if (schedules.length === 0) {
        setError('No train runs on this route for the selected date')
        return
      }
      const route = routes.find((r) => r.id === selectedRouteId)
      const origin = stations.find((s) => s.id === originId)
      const destination = stations.find((s) => s.id === destinationId)

      navigate('/seats', {
        state: {
          scheduleId: schedules[0].id,
          routeName: route?.name,
          travelDate,
          originId,
          destinationId,
          originName: origin?.name,
          destinationName: destination?.name,
        },
      })
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      <h1 className="font-display text-2xl text-ink">Where to?</h1>
      <p className="text-sm text-ink/60 mb-10">Find your seat on the hill-country line.</p>

      <form onSubmit={handleSearch} className="space-y-8">
        <div>
          <SelectInput
            label='Route:'
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
          >
            {routes.length === 0 && <option value="">No routes available</option>}
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}

          </SelectInput>          
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <SelectInput
              label='From:'
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              className='ml-1.5'
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}

            </SelectInput>
            
          </div>
          <div>
            <SelectInput
              label='To:'
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              
            </SelectInput>            
          </div>
        </div>

        <div>
          <TextInput
            label='Date:'
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            required
            className='ml-2'
          />          
        </div>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <Button type="submit" disabled={searching || routes.length === 0} className="w-full py-3">
          {searching ? 'Searching…' : 'Find seats'}
        </Button>
      </form>
    </div>
  )
}
