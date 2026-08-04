import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Search', icon: SearchIcon },
  { to: '/seat-map', label: 'Seat Map', icon: MapIcon }, 
  { to: '/my-bookings', label: 'My Bookings', icon: TicketIcon },
]

export default function PassengerLayout() {
  return (
    <div className="min-h-screen bg-paper flex flex-col border border-red-600">
      <header className="px-4 py-3 border-b border-gray-green bg-paper-raised flex items-center gap-2 border">
        <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="6" fill="var(--color-rail)" />
          <path d="M8 22 L16 8 L24 22 Z" fill="none" stroke="var(--color-brass)" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="16" cy="18" r="2" fill="var(--color-brass)" />
        </svg>
        <span className="font-display font-semibold text-ink">LSF Rail</span>
      </header>

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 border-t border-gray-green bg-paper-raised flex safe-area-bottom">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                isActive ? 'text-rail' : 'text-ink/50'
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