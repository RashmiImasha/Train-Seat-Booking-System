import { apiRequest } from './client'

export function getFarePreview(scheduleId: string, seatId: string, origin: string, destination: string) {
  return apiRequest<{ fare: string }>(`/schedules/${scheduleId}/seats/${seatId}/fare`, {
    params: { origin, destination },
  })
}