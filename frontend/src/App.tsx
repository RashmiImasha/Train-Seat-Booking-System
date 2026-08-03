import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import SearchPage from './pages/passenger/SearchPage'
import SeatMapPage from './pages/passenger/SeatMapPage'
import SeatExplorerPage from './pages/passenger/SeatExplorerPage'
import BookingConfirmPage from './pages/passenger/BookingConfirmPage'
import MyBookingsPage from './pages/passenger/MyBookingPage'
import BookingsPage from './pages/admin/BookingsPage'
import RoutesPage from './pages/admin/RoutesPage'
import RouteDetailPage from './pages/admin/RouteDetailPage'
import SchedulesPage from './pages/admin/SchedulesPage'
import SeatMapViewPage from './pages/admin/SeatmapviewPage'
import AdminLayout from './components/layout/AdminLayout'
import PassengerLayout from './components/layout/PassengerLayout'
import { RequireAuth } from './auth/RequireAuth'
import { RequireAdmin } from './auth/RequireAdmin'

function App() {
  return (
    <div className="flex max-w-full min-h-screen "         
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          
          <Route element={<PassengerLayout />}>
            <Route path="/" element={<SearchPage />} />
            <Route path="/seats" element={<SeatMapPage />} />
            <Route path="/seat-map" element={<SeatExplorerPage />} />
            <Route path="/confirm" element={<BookingConfirmPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
          </Route>
          
        </Route>

        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="routes" element={<RoutesPage />} />
            <Route path="routes/:routeId" element={<RouteDetailPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="seat-map" element={<SeatMapViewPage />} />
          </Route>
        </Route>
      </Routes>

    </div>
    
  )
}

export default App
