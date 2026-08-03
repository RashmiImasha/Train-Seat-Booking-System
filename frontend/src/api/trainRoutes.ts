import { apiRequest } from './client'
import type { Coach, Route, Station } from '../types/api'

export function listRoutes() {
  return apiRequest<Route[]>('/routes')
}

export function createRoute(name: string, train_name: string) {
  return apiRequest<Route>('/routes', { method: 'POST', body: { name, train_name } })
}

export function listStations(routeId: string) {
  return apiRequest<Station[]>(`/routes/${routeId}/stations`)
}   

export function addStation(
  routeId: string,
  payload: { name: string; sequence_order: number; distance_from_previous_km: number },
) {
  return apiRequest<Station>(`/routes/${routeId}/stations`, { method: 'POST', body: payload })
}

export function listCoaches(routeId: string) {
  return apiRequest<Coach[]>(`/routes/${routeId}/coaches`)
}

export function addCoach(
  routeId: string,
  payload: { 
    coach_number: number; 
    coach_type: 'reserved' | 'unreserved'; 
    coach_name: '1st_class' | '2nd_class' | '3rd_class'; 
    seat_count: number },
) {
  return apiRequest<Coach>(`/routes/${routeId}/coaches`, { method: 'POST', body: payload })
}
