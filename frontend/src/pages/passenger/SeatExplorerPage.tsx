import { useEffect, useState } from 'react'
import { listRoutes } from '../../api/trainRoutes'
import { findSchedules, getScheduleCoaches } from '../../api/schedules'
import { getSeatMap } from '../../api/seatmap'
import type { Route, CoachWithSeats, SeatMapEntry } from '../../types/api'
import { ApiError } from '../../api/client'

const statusStyles: Record<SeatMapEntry['status'], string> = {
  free: 'bg-leaf-bg border-leaf/40 text-leaf',
  partial: 'bg-brass/20 border-brass text-brass-dark',
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
        <select
          value={routeId}
          onChange={(e) => setRouteId(e.target.value)}
          className="w-full rounded-lg border border-gray-green bg-white px-3 py-2.5 text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
        >
          {routes.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={travelDate}
          onChange={(e) => setTravelDate(e.target.value)}
          className="w-full rounded-lg border border-gray-green bg-white px-3 py-2.5 text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
        />
        <button
          onClick={handleFindSchedule}
          className="w-full rounded-lg bg-rail-green text-white font-medium py-2.5 hover:bg-rail-green-dark transition-colors"
        >
          Load seat map
        </button>

        {coaches.length > 0 && (
          <select
            value={coachId}
            onChange={(e) => { setCoachId(e.target.value); setSelectedSeat(null) }}
            className="w-full rounded-lg border border-gray-green bg-white px-3 py-2.5 text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
          >
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>Coach {c.coach_number}</option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="text-sm text-clay bg-clay-bg rounded-lg px-3 py-2 mb-4">{error}</p>}

      {seatMap && (
        <>
          <div className="grid grid-cols-4 gap-2 mb-4">
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

          <div className="flex items-center gap-4 text-xs text-ink/60 mb-6">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-leaf-bg border border-leaf/40" /> Free</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-conic/decreasing from-violet-700 via-lime-300 to-violet-700 border border-brass" /> Partially booked</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-clay-bg border border-clay/40" /> Fully booked</span>
          </div>

          {selectedSeat && (
            <div className="rounded-xl border border-gray-green bg-paper-raised p-4">
              <p className="text-sm font-medium text-ink mb-2">Seat {selectedSeat.seat_number} bookings</p>
              {selectedSeat.booked_segments.length === 0 ? (
                <p className="text-sm text-ink/50">No bookings — fully available.</p>
              ) : (
                <select className="w-full rounded-lg border border-gray-green bg-white px-3 py-2 text-sm text-ink">
                  {selectedSeat.booked_segments.map((seg, i) => (
                    <option key={i}>
                      {seg.origin_station_name} → {seg.destination_station_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}