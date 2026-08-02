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

// export function listAllBookings() {
//   return apiRequest<BookingDetail[]>('/bookings')
// }

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
