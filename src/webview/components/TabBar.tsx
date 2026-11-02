import { NavLink } from 'react-router-dom'
import { HomeIcon, PersonIcon, TicketIcon } from './icons'

const TABS = [
  { to: '/easywallet', label: '今日', Icon: HomeIcon, end: true },
  { to: '/easywallet/orders', label: '訂單', Icon: TicketIcon, end: false },
  { to: '/easywallet/me', label: '我的', Icon: PersonIcon, end: false },
]

/**
 * The flow's own bottom navigation.
 *
 * The host app owns the chrome above this page, which is why there is still no brand bar at the
 * top — but the three sections below are this product's own, and a mini-app inside a wallet is
 * expected to carry its own tabs the way one inside any other super-app does. Without them the
 * whole thing reads as a single embedded feature rather than the app it is proposing to be.
 */
export default function TabBar() {
  return (
    <nav className="ew-tabbar" aria-label="主要導覽">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `ew-tab ${isActive ? 'ew-tab-active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <Icon />
              <span className="ew-tab-label">{label}</span>
              {isActive && <span className="ew-tab-dot" aria-hidden="true" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
