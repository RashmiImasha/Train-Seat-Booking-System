import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

const navItems = [
  { to: '/', label: 'Search', icon: SearchIcon },
  { to: '/seat-map', label: 'Seat Map', icon: MapIcon }, 
  { to: '/my-bookings', label: 'My Bookings', icon: TicketIcon },
]

export default function PassengerLayout() {

  const { logout } = useAuth()
  
  return (    
    <div className="w-full flex flex-col justify-center bg-linear-to-r from-paper-raised to-gray-green">
      <header className="px-4 py-2.5 w-full border-b border-gray-green flex items-center justify-between bg-rail-green/40">
        <div className='flex items-center gap-1'>
          <img src='/trainlogo.jpg' className='w-10 h-10'/>
          <span className="font-display font-semibold text-ink">GoRail</span>
        </div>
        <div>
          <div className="px-3 h- border hover:scale-105">
            <button
              onClick={logout}
              className="w-full text-left rounded-lg px-3 py-2 text-sm font-semibold  "
            >Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 border-t border-gray-green flex safe-area-bottom bg-rail-green/40">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-bold transition-colors ${
                isActive ? 'text-rail-green' : 'text-ink/50'
              }`
            }
          >
            <item.icon />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

function TicketIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z"
        strokeLinejoin="round"
      />
      <path d="M12 6v2m0 3v2m0 3v2" strokeLinecap="round" />
    </svg>
  )
}


function MapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z" strokeLinejoin="round" />
      <path d="M9 3v16M15 5v16" strokeLinecap="round" />
    </svg>
  )
}