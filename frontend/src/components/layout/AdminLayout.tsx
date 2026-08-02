import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

const navItems = [
  { to: '/admin/routes', label: 'Routes' },
  { to: '/admin/schedules', label: 'Schedules' },
]

export default function AdminLayout() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-paper flex">
      <aside className="w-56 shrink-0 border-r border-line bg-paper-raised flex flex-col">
        <div className="px-5 py-5 border-b border-line">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="6" fill="var(--color-rail)" />
              <path d="M8 22 L16 8 L24 22 Z" fill="none" stroke="var(--color-brass)" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="16" cy="18" r="2" fill="var(--color-brass)" />
            </svg>
            <span className="font-display font-semibold text-ink">LSF Rail</span>
          </div>
          <p className="text-xs text-ink/50 font-mono mt-1">Admin console</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-rail text-white' : 'text-ink/70 hover:bg-white hover:text-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}a
        </nav>

        <div className="px-3 py-4 border-t border-line">
          <button
            onClick={logout}
            className="w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-ink/70 hover:bg-white hover:text-ink transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
