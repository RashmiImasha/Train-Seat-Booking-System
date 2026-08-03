import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { FaRoad, FaArrowLeft } from "react-icons/fa";
import { GrSchedulePlay } from "react-icons/gr";
import { SiBookingdotcom } from "react-icons/si";
import { MdAirlineSeatLegroomNormal } from "react-icons/md";
import type { IconType } from 'react-icons/lib';

interface NavItem {
  to: string;
  label: string;
  icon: IconType;
}

const navItems: NavItem[] = [
  { to: '/admin/routes', label: 'Routes', icon: FaRoad },
  { to: '/admin/schedules', label: 'Schedules', icon: GrSchedulePlay },
  { to: '/admin/bookings', label: 'Bookings', icon: SiBookingdotcom },
  { to: '/admin/seat-map', label: 'Seat Map', icon: MdAirlineSeatLegroomNormal },
]

export default function AdminLayout() {
  const { logout } = useAuth()

  return (
    <div className=" w-full flex justify-center ">
      <aside className="w-56 shrink-0  bg-linear-to-b from-soft-mint-green via-light-green to-deep-rail-green flex flex-col ">
        <div className="px-5 pt-4 pb-2 border-b border-rail">
          <div className="flex flex-col items-center gap-2">

            <div className='w-16 h-12'>
              <img src="/trainlogo.jpg" alt="GoRail Logo" className='overflow-hidden'/>
            </div>
            
            <p className="font-mono font-semibold text-ink text-xl mt-3">GoRail</p>
            {/* <p className="text-xs text-ink/50 font-mono">Admin console</p> */}

          </div>
        </div>

        <nav className="flex-1 px-3 space-y-4 mt-8">
          {navItems.map((item) => {

            const Icon = item.icon;
            return (
              <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-3 text-sm font-semibold transition-colors 
              ${isActive ? 'bg-rail-green text-white' : 'text-ink/70 hover:bg-white/90 hover:text-ink'}`
              }
            >
              <Icon className="inline-block w-4 h-4 mr-4" />
              
              {item.label}
            </NavLink>
            )
        })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-green bg-rail-green  hover:bg-[#92AA92] text-white hover:text-ink transition-colors">
          <button
            onClick={logout}
            className="w-full text-left rounded-lg px-3 py-2 text-sm font-semibold "
          >
            <FaArrowLeft className="inline-block w-4 h-4 mr-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 m-1.5">
        <Outlet />
      </main>
    </div>
  )
}
