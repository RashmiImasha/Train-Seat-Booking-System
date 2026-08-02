import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

// Sends admins straight to the admin console if they somehow land on a
// passenger route -- admins have no reason to see the search/booking flow.
export function AdminRedirect() {
  const { role } = useAuth()
  if (role === 'admin') return <Navigate to="/admin/routes" replace />
  return <Outlet />
}
