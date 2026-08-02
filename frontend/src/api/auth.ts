import { apiRequest } from './client'
import type { TokenResponse, User } from '../types/api'

export function login(username: string, password: string) {
  return apiRequest<TokenResponse>('/auth/login', { method: 'POST', body: { username, password } })
}

export function registerPassenger(username: string, password: string) {
  return apiRequest<User>('/auth/register', { method: 'POST', body: { username, password } })
}
