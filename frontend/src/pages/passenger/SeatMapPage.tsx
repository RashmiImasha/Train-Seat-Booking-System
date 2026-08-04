import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getScheduleCoaches } from '../../api/schedules'
import { getAvailability } from '../../api/availability'
import type { CoachWithSeats } from '../../types/api'
import { ApiError } from '../../api/client'
import { SeatMap } from '../../components/seatMap/SeatMap'
import { Button } from '../../components/common/Button'
import { ErrorBanner } from '../../components/common/StatusBanner'
import { SelectInput } from '../../components/common/SelectInput'

interface SearchState {
  scheduleId: string
  routeName: string
  travelDate: string
  originId: string
  destinationId: string
  originName: string
  destinationName: string
}

export default function SeatMapPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as SearchState | null

  const [coaches, setCoaches] = useState<CoachWithSeats[] | null>(null)
  const [availableSeatIds, setAvailableSeatIds] = useState<Set<string>>(new Set())
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null)
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!state) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    if (!state) return
    setError(null)

    try {
      const [coachData, availability] = await Promise.all([
        getScheduleCoaches(state.scheduleId),
        getAvailability(state.scheduleId, state.originId, state.destinationId),
      ])

      setCoaches(coachData)

      // Select first coach by default
      if (coachData.length > 0) {
        setSelectedCoachId(coachData[0].id)
      }

      setAvailableSeatIds(new Set(availability.map((s) => s.seat_id)))
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to load seat map')
    }
  }

  if (!state) {
    return (
      <div className="px-4 py-10 text-center ">
        <p className="text-ink/60 mb-4">Start a search first.</p>
        <Button onClick={() => navigate('/')}>Back to search</Button>
      </div>
    )
  }

  function handleContinue() {
    if (!selectedSeatId || !coaches || !selectedCoachId) return

    const selectedCoach = coaches.find(
      (coach) => coach.id === selectedCoachId
    )

    const seat = selectedCoach?.seats.find(
      (s) => s.id === selectedSeatId
    )

    navigate('/confirm', {
      state: {
        ...state,
        seatId: selectedSeatId,
        seatNumber: seat?.seat_number,
        coachNumber: selectedCoach?.coach_number,
        coachName: selectedCoach?.coach_name,
      },
    })
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      <p className="text-xs font-mono text-ink uppercase tracking-wide mb-1">
        {state.originName} → {state.destinationName} · {state.travelDate}
      </p>
      <h1 className="font-display text-2xl text-ink mb-10">Pick a seat</h1>

      {error && (
        <div className="mb-4">
          <ErrorBanner>{error}</ErrorBanner>
        </div>
      )}

      {coaches === null ? (
        <p className="text-sm text-ink/50">Loading seat map…</p>
      ) : (
        <>
          {/* Coach Selection */}
          <div className="mb-5 ">
            <SelectInput
              label='Select Coach:'
              value={selectedCoachId ?? ''}
              onChange={(e) => {
                setSelectedCoachId(e.target.value)
                setSelectedSeatId(null)
              }}
            >
              {coaches
                .filter((coach) => coach.coach_type === 'reserved')
                .map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.coach_name} : coach {coach.coach_number} 
                  </option>
              ))}

            </SelectInput>            
          </div>


          {/* Selected Coach Seat Map */}
          {selectedCoachId && (
            <SeatMap
              coaches={coaches.filter(
                (coach) => coach.id === selectedCoachId
              )}
              availableSeatIds={availableSeatIds}
              selectedSeatId={selectedSeatId}
              onSelect={setSelectedSeatId}
            />
          )}


          <div className="fixed bottom-20 inset-x-0">
            <div className="max-w-xs mx-auto">
              <Button
                onClick={handleContinue}
                disabled={!selectedSeatId}
                className="w-full py-3 shadow-lg"
              >
                {selectedSeatId ? 'Continue' : 'Select a seat to continue'}
              </Button>
            </div>
          </div>
        </>
      )}

      
    </div>
  )
}
