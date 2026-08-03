// Mirrors the backend's Pydantic schemas (app/schemas/*.py). Kept in one
// file for now while the surface is small; can be split per-domain later
// if it grows unwieldy.

export type CoachType = 'reserved' | 'unreserved'
export type CoachName = '1st_class' | '2nd_class' | '3rd_class'
export type UserRole = 'admin' | 'passenger'
export type BookingStatus = 'confirmed' | 'cancelled'

export interface Route {
  id: string
  name: string
  train_name: string
}

export interface Station {
  id: string
  route_id: string
  name: string
  sequence_order: number
  distance_from_previous_km: number
}

export interface Coach {
  id: string
  route_id: string
  coach_number: number
  coach_type: CoachType
  coach_name: CoachName
  seat_count: number
}

export interface Seat {
  id: string
  coach_id: string
  seat_number: number
}

export interface CoachWithSeats {
  id: string
  coach_number: number
  coach_type: CoachType
  coach_name: CoachName
  seat_count: number
  seats: Seat[]
}

export interface TrainSchedule {
  id: string
  route_id: string
  travel_date: string
}

export interface AvailableSeat {
  seat_id: string
  seat_number: number
  coach_id: string
  coach_number: number
  coach_name: CoachName
}

export interface Booking {
  id: string
  seat_id: string
  train_schedule_id: string
  origin_station_id: string
  destination_station_id: string
  user_id: string
  fare: string
  status: BookingStatus
  booked_at: string
}

export interface BookingDetail extends Booking {
  route_name: string
  origin_station_name: string
  destination_station_name: string
  coach_number: number
  coach_name: CoachName
  seat_number: number
  travel_date: string
  username: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  role: UserRole
}

export interface User {
  id: string
  username: string
  role: UserRole
}

export interface BookedSegment {
  origin_station_name: string
  destination_station_name: string
}

export interface SeatMapEntry {
  seat_id: string
  seat_number: number
  coach_id: string
  coach_number: number
  status: 'free' | 'partial' | 'full'
  booked_segments: BookedSegment[]
}