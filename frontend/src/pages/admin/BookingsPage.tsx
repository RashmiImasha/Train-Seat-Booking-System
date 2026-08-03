import { useEffect, useState } from 'react'
import { listAllBookings, purgeBooking } from '../../api/bookings'
import type { BookingDetail } from '../../types/api'
import { ApiError } from '../../api/client'
import { Button } from '../../components/common/Button'
import { ErrorBanner, EmptyState } from '../../components/common/StatusBanner'
import { SectionHeader } from '../../components/common/SectionHeader.tsx'
import { TextInput } from '../../components/common/TextInput.tsx'
import { SelectInput } from '../../components/common/SelectInput'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingDetail[] | null>(null)
  const [statusFilter, setStatusFilter] = useState('confirmed')
  // const [dateFilter, setDateFilter] = useState('')
  const [dateFilter, setDateFilter] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const totalCount = bookings?.length ?? 0
  const totalIncome = (bookings ?? []).reduce((sum, b) => sum + parseFloat(b.fare), 0)

  async function load() {
    try {
      setBookings(
        await listAllBookings({
          status: statusFilter || undefined,
          travel_date: dateFilter || undefined,
        }),
      )
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to load bookings')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateFilter])

  async function handleDelete(id: string) {
    if (!confirm('Permanently delete this booking? This cannot be undone.')) return
    setDeletingId(id)
    setError(null)
    try {
      await purgeBooking(id)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to delete booking')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col w-full">
      <div className="pb-7">
        <SectionHeader
          title="All Bookings"
          description="Every booking across all passengers"
        />
      </div>
      
      <div className="flex items-center gap-10 mb-4 p-3 rounded-lg bg-form-green w-full">
        <div className="flex items-center gap-x-10 w-1/2 ">
          <SelectInput
            label='Booking Status:'
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            
          </SelectInput>

          <TextInput
            label='Travel Date:'
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>       
        
        
      </div>

      {bookings !== null && dateFilter && (
        <div className='flex items-center gap-10 mb-8 p-3 rounded-lg bg-form-green w-full'>
          <div className="flex gap-10 w-1/2">
          <div className="flex items-center">
            <p className="text-sm font-medium text-ink">
              {statusFilter === 'cancelled' ? 'Cancelled bookings :' : 'Confirmed bookings :'}
            </p>
            <div className="rounded-lg border border-gray-green bg-paper-raised px-3 py-2 ml-2">            
              <p className="font-mono text-sm text-ink">{totalCount}</p>
            </div>
          </div>
          
          
          <div className="flex items-center">
            <p className="text-sm font-medium text-ink">
              {statusFilter === 'cancelled' ? 'Lost revenue :' : 'Total income :'}
            </p>
            <div className="rounded-lg border border-gray-green bg-paper-raised px-3 py-2 ml-2">
            
              <p className="font-mono text-sm text-ink">LKR {totalIncome.toFixed(2)}</p>
            </div>
          </div>
        </div>
        </div>
      )}

      {error && <div className="mb-4"><ErrorBanner>{error}</ErrorBanner></div>}

      {bookings === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : bookings.length === 0 ? (
        (statusFilter === 'cancelled' ? (
            <EmptyState title="No cancelled bookings for the selected date" />
          ) : (
            <EmptyState title="No confirmed bookings for the selected date" />
          )
        )
      ) : (
        <div className="rounded-xl border border-gray-green bg-paper-raised overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-green text-left text-ink/50 text-xs uppercase tracking-wide">
                <th className="px-4 py-2.5">No.</th>
                <th className="px-4 py-2.5">Passenger</th>
                <th className="px-4 py-2.5">Route</th>
                <th className="px-4 py-2.5">Leg</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Coach/Seat</th>
                <th className="px-4 py-2.5">Fare</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr key={b.id} className={`border-b border-gray-green last:border-b-0 
                  ${i % 2 === 0 ? "bg-white" : "bg-gray-100"}`}>
                  <td className="px-4 py-2.5 text-ink/50 font-mono">{i + 1}</td>
                  <td className="px-4 py-2.5 font-mono">{b.username}</td>
                  <td className="px-4 py-2.5">{b.route_name}</td>
                  <td className="px-4 py-2.5">
                    {b.origin_station_name} → {b.destination_station_name}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{b.travel_date}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {b.coach_number}/{b.seat_number}
                  </td>
                  <td className="px-4 py-2.5 font-mono">LKR {b.fare}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                        b.status === 'confirmed' ? 'bg-leaf-bg text-leaf' : 'bg-line/60 text-ink/50'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {b.status === 'cancelled' && (
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(b.id)}
                        disabled={deletingId === b.id}
                        className="text-xs py-1"
                      >
                        {deletingId === b.id ? 'Deleting…' : 'Delete'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}