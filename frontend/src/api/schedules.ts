import { apiRequest } from './client'
import type { CoachWithSeats, TrainSchedule } from '../types/api'

export function findSchedules(params: { route_id?: string; travel_date?: string }) {
  return apiRequest<TrainSchedule[]>('/schedules', { params })
}

export function createSchedule(routeId: string, travelDate: string) {
  return apiRequest<TrainSchedule>('/schedules', {
    method: 'POST',
    body: { route_id: routeId, travel_date: travelDate },
  })
}

export function getScheduleCoaches(scheduleId: string) {
  return apiRequest<CoachWithSeats[]>(`/schedules/${scheduleId}/coaches`)
}