import { useEffect, useState } from 'react'
import { listAllBookings, purgeBooking } from '../../api/bookings'
import type { BookingDetail } from '../../types/api'
import { ApiError } from '../../api/client'
import { Button } from '../../components/common/Button'
import { ErrorBanner, EmptyState } from '../../components/common/StatusBanner'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingDetail[] | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="font-display text-2xl text-ink mb-1">All Bookings</h1>
      <p className="text-sm text-ink/60 mb-6">Every booking across all passengers.</p>

      <div className="flex gap-2 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
        >
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30"
        />
        {(statusFilter || dateFilter) && (
          <Button variant="secondary" onClick={() => { setStatusFilter(''); setDateFilter('') }}>
            Clear filters
          </Button>
        )}
      </div>

      {error && <div className="mb-4"><ErrorBanner>{error}</ErrorBanner></div>}

      {bookings === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings match these filters" />
      ) : (
        <div className="rounded-xl border border-line bg-paper-raised overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/50 text-xs uppercase tracking-wide">
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
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-b-0">
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