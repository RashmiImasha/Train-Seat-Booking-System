import { apiRequest } from './client'
import type { Booking, BookingDetail } from '../types/api'

export function createBooking(
  scheduleId: string,
  seatId: string,
  payload: { origin_station_id: string; destination_station_id: string },
) {
  return apiRequest<Booking>(`/schedules/${scheduleId}/seats/${seatId}/bookings`, {
    method: 'POST',
    body: payload,
  })
}

// for user
export function listMyBookings() {
  return apiRequest<BookingDetail[]>('/bookings/me')
}

export function getBooking(bookingId: string) {
  return apiRequest<Booking>(`/bookings/${bookingId}`)
}

export function cancelBooking(bookingId: string) {
  return apiRequest<Booking>(`/bookings/${bookingId}`, { method: 'DELETE' })
}

export function listAllBookings(filters: { status?: string; travel_date?: string }) {
  return apiRequest<BookingDetail[]>('/bookings', { params: filters })
}

export function purgeBooking(bookingId: string) {
  return apiRequest<void>(`/bookings/${bookingId}/purge`, { method: 'DELETE' })
}