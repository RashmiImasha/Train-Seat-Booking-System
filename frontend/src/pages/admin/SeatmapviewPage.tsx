import { useEffect, useState } from 'react'
import { listRoutes } from '../../api/trainRoutes'
import { findSchedules } from '../../api/schedules'
import { getSeatMap } from '../../api/seatmap'
import type { Route, SeatMapEntry } from '../../types/api'
import { ApiError } from '../../api/client'
import { Button } from '../../components/common/Button'
import { ErrorBanner, EmptyState } from '../../components/common/StatusBanner'
import { PopupWindow } from '../../components/common/PopupWindow'
import { TextInput } from '../../components/common/TextInput'
import { SelectInput } from '../../components/common/SelectInput'
import { SectionHeader } from '../../components/common/SectionHeader.tsx'


const statusStyles: Record<SeatMapEntry['status'], string> = {
  free: 'bg-leaf-bg border-leaf/40 text-leaf',
  partial: 'bg-brass/20 border-brass text-brass-dark',
  full: 'bg-clay-bg border-clay/40 text-clay',
}

export default function AdminSeatMapPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [routeId, setRouteId] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [seatMap, setSeatMap] = useState<SeatMapEntry[] | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<SeatMapEntry | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listRoutes().then((r) => {
      setRoutes(r)
      if (r.length > 0) setRouteId(r[0].id)
    })
  }, [])

  async function handleLoad() {
    setError(null)
    setSeatMap(null)
    setSelectedSeat(null)
    setLoading(true)
    try {
      const schedules = await findSchedules({ route_id: routeId, travel_date: travelDate })
      if (schedules.length === 0) {
        setError('No schedule exists for this route and date')
        return
      }
      const entries = await getSeatMap(schedules[0].id)
      setSeatMap(entries)
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to load seat map')
    } finally {
      setLoading(false)
    }
  }

  const coachGroups = seatMap
    ? Object.values(
        seatMap.reduce<Record<number, { coachNumber: number; seats: SeatMapEntry[] }>>((acc, seat) => {
          acc[seat.coach_number] ??= { coachNumber: seat.coach_number, seats: [] }
          acc[seat.coach_number].seats.push(seat)
          return acc
        }, {}),
      ).sort((a, b) => a.coachNumber - b.coachNumber)
    : []

  return (
    <div className="flex flex-col w-full">
      <div className="pb-7">
        <SectionHeader
          title="Seat Map"
          description="Occupancy across every reserved coach for a schedule"
        />
      </div>

      <div className="flex items-center gap-10 mb-5 p-3 rounded-lg bg-form-green w-full ">
        <div className="flex items-center gap-x-10 w-1/2">
          
          <SelectInput
            label='Train Route:'
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
          >
            {routes.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
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
        <Button onClick={handleLoad} disabled={loading || !routeId || !travelDate}>
          {loading ? 'Loading…' : 'Load seat map'}
        </Button>
        
      </div>      
      
      {error && <div className="mb-4"><ErrorBanner>{error}</ErrorBanner></div>}

      {seatMap && coachGroups.length === 0 && (
        <EmptyState title="No reserved coaches on this route" />
      )}


      {coachGroups.length > 0 && (
        <div className="rounded-lg flex flex-col w-full overflow-hidden bg-form-green px-3 py-5">
          
          <div className='flex justify-between items-center'>
            <p className='text-ink font-semibold pb-5'>Select a seat & see it's bookings</p>
            <div className="flex items-center gap-4 text-xs text-ink font-semibold bg-white px-4 py-2">
              <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-leaf-bg border border-leaf/40" /> Free</span>
              <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-linear-to-tr from-light-yellow to-soft-mint-green border border-brass" /> Partially booked</span>
              <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-clay-bg border border-clay/40" /> Fully booked</span>
            </div>
          </div>
                   
          
          <div className='flex w-full justify-between p-3 mt-3 rounded-xl bg-paper h-96 overflow-y-scroll'>
            <div className="grid grid-cols-3 gap-8 w-full ">
            {coachGroups.map((group) => (
              <div key={group.coachNumber}>
                <p className="text-xs font-mono text-ink mb-3 tracking-wide uppercase">
                  Coach {group.coachNumber}
                </p>
                <div className="grid grid-cols-6 gap-2 rounded-2xl border border-gray-green bg-paper-raised p-4 w-fit">
                  {group.seats.map((seat) => (
                    <button
                      key={seat.seat_id}
                      onClick={() => setSelectedSeat(seat)}
                      className={`h-11 w-11 rounded-lg border text-sm font-mono font-medium transition-all ${
                        statusStyles[seat.status]
                      } ${
                        selectedSeat?.seat_id === seat.seat_id
                          ? 'ring-2 ring-brass ring-offset-1'
                          : 'hover:scale-105'
                      }`}
                    >
                      {seat.seat_number}
                    </button>
                    
                  ))}
                </div>
              </div>
            ))}

            
          </div>
          </div>


        </div>
      )}

      {selectedSeat && (
        <PopupWindow
          title={`Coach ${selectedSeat.coach_number} · Seat ${selectedSeat.seat_number}`}
          onClose={() => setSelectedSeat(null)}
        >
          {selectedSeat.booked_segments.length === 0 ? (
            <p className="text-sm text-ink/50">Fully available -- no bookings.</p>
          ) : (
            <ul className="space-y-2">
              {selectedSeat.booked_segments.map((seg, i) => (
                <li
                  key={i}
                  className="text-sm text-ink font-mono bg-white rounded-lg border border-gray-green px-3 py-2"
                >
                  {seg.origin_station_name} → {seg.destination_station_name}
                </li>
              ))}
            </ul>
          )}
        </PopupWindow>
      )}
    </div>
  )
}