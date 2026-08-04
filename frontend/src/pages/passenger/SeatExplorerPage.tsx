import { useEffect, useState } from 'react'
import { listRoutes } from '../../api/trainRoutes'
import { findSchedules, getScheduleCoaches } from '../../api/schedules'
import { getSeatMap } from '../../api/seatmap'
import type { Route, CoachWithSeats, SeatMapEntry } from '../../types/api'
import { ApiError } from '../../api/client'
import { TextInput } from '../../components/common/TextInput'
import { SelectInput } from '../../components/common/SelectInput'
import { PopupWindow } from '../../components/common/PopupWindow'

const statusStyles: Record<SeatMapEntry['status'], string> = {
  free: 'bg-leaf-bg border border-leaf/40',
  partial: 'bg-linear-to-tr from-light-yellow to-soft-mint-green border border-soft-mint-green',
  full: 'bg-clay-bg border-clay/40 text-clay',
}

export default function SeatExplorerPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [routeId, setRouteId] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [scheduleId, setScheduleId] = useState<string | null>(null)
  const [coaches, setCoaches] = useState<CoachWithSeats[]>([])
  const [coachId, setCoachId] = useState('')
  const [seatMap, setSeatMap] = useState<SeatMapEntry[] | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<SeatMapEntry | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listRoutes().then((r) => {
      setRoutes(r)
      if (r.length > 0) setRouteId(r[0].id)
    })
  }, [])

  async function handleFindSchedule() {
    setError(null)
    setSeatMap(null)
    setSelectedSeat(null)
    try {
      const schedules = await findSchedules({ route_id: routeId, travel_date: travelDate })
      if (schedules.length === 0) {
        setError('No train runs on this route for the selected date')
        setScheduleId(null)
        return
      }
      const id = schedules[0].id
      setScheduleId(id)
      const coachData = await getScheduleCoaches(id)
      const reserved = coachData.filter((c) => c.coach_type === 'reserved')
      setCoaches(reserved)
      if (reserved.length > 0) setCoachId(reserved[0].id)
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Search failed')
    }
  }

  useEffect(() => {
    if (!scheduleId || !coachId) return
    getSeatMap(scheduleId, coachId)
      .then(setSeatMap)
      .catch((err) => setError(err instanceof ApiError ? String(err.detail) : 'Failed to load seat map'))
  }, [scheduleId, coachId])

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      <h1 className="font-display text-2xl text-ink mb-6">Seat Map</h1>

      <div className="space-y-3 mb-6">
        <SelectInput
          label='Route:'
          value={routeId}
          onChange={(e) => setRouteId(e.target.value)}
        >
          {routes.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </SelectInput>
        
        <TextInput
          label='Date:'
          type="date"
          value={travelDate}
          onChange={(e) => setTravelDate(e.target.value)}
          className='ml-2'
        />

        <button
          onClick={handleFindSchedule}
          className="w-full rounded-lg bg-rail-green text-white font-medium py-2.5 hover:bg-rail-green-dark transition-colors"
        >
          Load seat map
        </button>

        {coaches.length > 0 && (
          <SelectInput
            label='Coach:'
            value={coachId}
            onChange={(e) => { 
              setCoachId(e.target.value); 
              setSelectedSeat(null);
            }}
          >
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>{c.coach_name} : coach no. {c.coach_number}</option>
            ))}

          </SelectInput>          
        )}       
        
      </div>     

      {error && <p className="text-sm text-clay bg-clay-bg rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className='flex flex-col '>
        <p className='text-ink text-sm py-1 px-4 rounded-full w-fit bg-soft-mint-green/70 mb-5'>Select a seat & view bookings</p>

        <div className="flex items-center justify-center gap-4 text-xs text-ink font-semibold bg-white px-4 py-2 rounded-lg ">
            <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-leaf-bg border border-leaf/40" /> Free</span>
            <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-linear-to-tr from-light-yellow to-soft-mint-green border border-soft-mint-green" /> Partially booked</span>
            <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-clay-bg border border-clay/40" /> Fully booked</span>
        </div>

      </div>
      
      {seatMap && (
        <>
          <div className='p-5 bg-white rounded-lg mt-2 shadow-2xl'>
            <div className="grid grid-cols-4 gap-2">
            {seatMap.map((seat) => (
              <button
                key={seat.seat_id}
                onClick={() => setSelectedSeat(seat)}
                className={`h-11 rounded-lg border text-sm font-mono font-medium transition-transform hover:scale-105 ${statusStyles[seat.status]}`}
              >
                {seat.seat_number}
              </button>
            ))}
          </div>    
          </div>      

          {selectedSeat && (
            <PopupWindow
              title={`Booking List for seat no.  ${selectedSeat.seat_number}`}
              onClose={() => setSelectedSeat(null)}
            >
              {selectedSeat.booked_segments.length === 0 ? (
                <p className="text-center text-sm text-ink">Fully available -- still no bookings!</p>
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
        </>
      )}
    </div>
  )
}