import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getFarePreview } from '../../api/fares'
import { createBooking } from '../../api/bookings'
import { ApiError } from '../../api/client'
import { Button } from '../../components/common/Button'
import { ErrorBanner } from '../../components/common/StatusBanner'
import type { CoachName } from '../../types/api'

interface ConfirmState {
  scheduleId: string
  routeName: string
  travelDate: string
  originId: string
  destinationId: string
  originName: string
  destinationName: string
  seatId: string
  seatNumber: number
  coachNumber: number
  coachName: CoachName
}

export default function BookingConfirmPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as ConfirmState | null

  const [fare, setFare] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!state) return
    getFarePreview(state.scheduleId, state.originId, state.destinationId)
      .then((r) => setFare(r.fare))
      .catch((err) => setError(err instanceof ApiError ? String(err.detail) : 'Failed to load fare'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!state) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-ink/60 mb-4">Start a search first.</p>
        <Button onClick={() => navigate('/')}>Back to search</Button>
      </div>
    )
  }

  async function handleConfirm() {
    setBooking(true)
    setError(null)
    try {
      await createBooking(state!.scheduleId, state!.seatId, {
        origin_station_id: state!.originId,
        destination_station_id: state!.destinationId,
      })
      setConfirmed(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('This seat was just taken by someone else. Please pick another seat.')
      } else {
        setError(err instanceof ApiError ? String(err.detail) : 'Booking failed')
      }
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      <h1 className="font-display text-2xl text-ink mb-6">{confirmed ? 'Booked' : 'Confirm your seat'}</h1>

      {/* Ticket stub card */}
      <div className="rounded-2xl border border-gray-green bg-paper-raised shadow-sm overflow-hidden">
        <div className="p-5">
          <p className="text-xs font-mono text-ink/50 uppercase tracking-wide mb-1">{state.routeName}</p>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-display text-lg text-ink">{state.originName}</p>
            </div>
            <svg width="24" height="16" viewBox="0 0 24 16" className="text-brass shrink-0 mx-2">
              <path d="M0 8h20m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-right">
              <p className="font-display text-lg text-ink">{state.destinationName}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-ink/60">
            <span>{state.travelDate}</span>
            <span className="font-mono">
              {state.coachName} : coach {state.coachNumber} · Seat {state.seatNumber}
            </span>
          </div>
        </div>

        {/* Perforation */}
        <div className="relative border-t border-dashed border-gray-green">
          <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-paper" />
          <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-paper" />
        </div>

        <div className="p-5 flex items-center justify-between">
          <span className="text-sm text-ink/60">Fare</span>
          <span className="font-mono text-xl text-ink font-semibold">
            {fare ? `LKR ${fare}` : '…'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorBanner>{error}</ErrorBanner>
        </div>
      )}

      {confirmed ? (
        <Button onClick={() => navigate('/my-bookings')} className="w-full py-3 mt-6">
          View my bookings
        </Button>
      ) : (
        <Button onClick={handleConfirm} disabled={booking || fare === null} className="w-full py-3 mt-6">
          {booking ? 'Booking…' : 'Confirm booking'}
        </Button>
      )}
    </div>
  )
}
