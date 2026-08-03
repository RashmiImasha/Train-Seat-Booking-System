import { apiRequest } from './client'
import type { SeatMapEntry } from '../types/api'

export function getSeatMap(scheduleId: string, coachId?: string) {
  return apiRequest<SeatMapEntry[]>(`/schedules/${scheduleId}/seat-map`, {
    params: coachId ? { coach_id: coachId } : {},
  })
}