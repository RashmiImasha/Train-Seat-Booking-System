import { apiRequest } from './client'
import type { AvailableSeat } from '../types/api'

export function getAvailability(scheduleId: string, origin: string, destination: string) {
  return apiRequest<AvailableSeat[]>(`/schedules/${scheduleId}/availability`, {
    params: { origin, destination },
  })
}
