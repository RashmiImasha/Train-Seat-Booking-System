import { useEffect, useState } from 'react'
import { cancelBooking, listMyBookings } from '../../api/bookings'
import type { BookingDetail } from '../../types/api'
import { ApiError } from '../../api/client'
import { Button } from '../../components/common/Button'
import { ErrorBanner, EmptyState } from '../../components/common/StatusBanner'

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingDetail[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  async function load() {
    try {
      setBookings(await listMyBookings())
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to load bookings')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCancel(id: string) {
    setCancellingId(id)
    setError(null)
    try {
      await cancelBooking(id)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to cancel booking')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      <h1 className="font-display text-2xl text-ink mb-6">My Bookings</h1>

      {error && (
        <div className="mb-4 ">
          <ErrorBanner>{error}</ErrorBanner>
        </div>
      )}

      {bookings === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings yet" hint="Search for a train to book your first seat." />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl border bg-paper-raised shadow-sm overflow-hidden ${
                b.status === 'cancelled' ? 'border-gray-green opacity-60' : 'border-gray-green'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-mono text-ink/50 uppercase tracking-wide">{b.route_name}</p>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                      b.status === 'confirmed' ? 'bg-leaf-bg text-leaf' : 'bg-line/60 text-ink/50'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-display text-base text-ink">
                    {b.origin_station_name} → {b.destination_station_name}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-y-1 font-mono justify-between text-sm text-ink/60">
                  <span>Travel Date : {b.travel_date}</span>
                  <span>
                    {b.coach_name} : coach {b.coach_number} : seat no. {b.seat_number}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-green px-4 py-3 flex items-center justify-between">
                <span className="font-mono text-lg text-ink font-semibold">LKR {b.fare}</span>
                {b.status === 'confirmed' && (
                  <Button
                    variant="danger"
                    onClick={() => handleCancel(b.id)}
                    disabled={cancellingId === b.id}
                    className="text-xs py-1.5"
                  >
                    {cancellingId === b.id ? 'Cancelling…' : 'Cancel'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


