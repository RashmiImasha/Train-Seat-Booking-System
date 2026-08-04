import { Seat } from './Seat'
import type { CoachWithSeats } from '../../types/api'

interface SeatMapProps {
  coaches: CoachWithSeats[]
  availableSeatIds: Set<string>
  selectedSeatId: string | null
  onSelect: (seatId: string) => void
}

// Renders reserved coaches as a 2-aisle-2 grid (the common layout for
// intercity reserved coaches) -- purely visual grouping by seat_number,
// since the backend doesn't model row/column, just a flat seat_number per
// coach. Unreserved coaches aren't shown here at all: they're
// first-come-first-served with no individual seat tracking.
export function SeatMap({ coaches, availableSeatIds, selectedSeatId, onSelect }: SeatMapProps) {
  const reservedCoaches = coaches.filter((c) => c.coach_type === 'reserved')

  if (reservedCoaches.length === 0) {
    return <p className="text-sm text-ink/50 text-center py-8">No reserved coaches configured for this route.</p>
  }

  return (
    <div className="flex flex-col items-center ">
      {reservedCoaches.map((coach) => {
        const rows: (typeof coach.seats)[] = []
        for (let i = 0; i < coach.seats.length; i += 4) {
          rows.push(coach.seats.slice(i, i + 4))
        }

        return (
          <div key={coach.id} className='w-full '>
            <p className="text-xs font-mono text-ink/80 mb-3 tracking-wide uppercase">{coach.coach_name} : Coach {coach.coach_number}</p>

            <div className="flex items-center gap-4 text-xs text-ink/60 mb-3 p-1 bg-white justify-center rounded-lg">
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-leaf-bg border border-leaf/40" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-clay-bg border border-clay/20" /> Taken for this leg
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-light-orange/40 border border-light-orange" /> Selected
              </span>
            </div>
            <div className="w-full inline-flex flex-col gap-2 rounded-2xl border border-gray-green bg-paper-raised p-4">
              {rows.map((row, i) => (
                <div key={i} className="flex items-center gap-3">
                  {row.slice(0, 2).map((seat) => (
                    <Seat
                      key={seat.id}
                      seatNumber={seat.seat_number}
                      available={availableSeatIds.has(seat.id)}
                      selected={selectedSeatId === seat.id}
                      onClick={() => onSelect(seat.id)}
                    />
                  ))}
                  <div className="w-8" aria-hidden="true" />
                  {row.slice(2, 4).map((seat) => (
                    <Seat
                      key={seat.id}                    
                      seatNumber={seat.seat_number}
                      available={availableSeatIds.has(seat.id)}
                      selected={selectedSeatId === seat.id}
                      onClick={() => onSelect(seat.id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      
    </div>
  )
}
