import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
// import SearchPage from './pages/passenger/SearchPage'
// import SeatMapPage from './pages/passenger/SeatMapPage'
// import BookingConfirmPage from './pages/passenger/BookingConfirmPage'
// import MyBookingsPage from './pages/passenger/MyBookingsPage'
import RoutesPage from './pages/admin/RoutesPage'
import RouteDetailPage from './pages/admin/RouteDetailPage'
import SchedulesPage from './pages/admin/SchedulesPage'
import AdminLayout from './components/layout/AdminLayout'
import PassengerLayout from './components/layout/PassengerLayout'
import { RequireAuth } from './auth/RequireAuth'
import { RequireAdmin } from './auth/RequireAdmin'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RequireAuth />}>
        
        <Route element={<PassengerLayout />}>
          {/* <Route path="/" element={<SearchPage />} />
          <Route path="/seats" element={<SeatMapPage />} />
          <Route path="/confirm" element={<BookingConfirmPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} /> */}
        </Route>
        
      </Route>

      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="routes" element={<RoutesPage />} />
          <Route path="routes/:routeId" element={<RouteDetailPage />} />
          <Route path="schedules" element={<SchedulesPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
