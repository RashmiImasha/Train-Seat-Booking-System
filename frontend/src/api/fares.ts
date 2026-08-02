import { apiRequest } from './client'

export function getFarePreview(scheduleId: string, origin: string, destination: string) {
  return apiRequest<{ fare: string }>(`/schedules/${scheduleId}/fare`, {
    params: { origin, destination },
  })
}