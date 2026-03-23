import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard, Users, Receipt, CheckSquare,
  UtensilsCrossed, Zap, Bot, User, LogOut, Home,
  CalendarDays, BarChart2, ShoppingCart, Scale, History
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/groups', icon: Users, label: 'Groups' },
  { path: '/expenses', icon: Receipt, label: 'Expenses' },
  { path: '/chores', icon: CheckSquare, label: 'Chores' },
  { path: '/mess', icon: UtensilsCrossed, label: 'Mess & Laundry' },
  { path: '/bills', icon: Zap, label: 'Bills' },
  { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { path: '/ai-assistant', icon: Bot, label: 'AI Assistant' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100%',
          width: '240px',
          background: '#1C1B29',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.3s ease',
        }}
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="gradient-bg" style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Home size={18} color="white" />
          </div>
          <span className="gradient-text" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px' }}>
            HostelLife
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'gradient-bg text-white shadow-lg'
                    : 'text-muted hover:text-white'
                }`
              }
              style={({ isActive }) => isActive ? {} : {}}
            >
              {({ isActive }) => (
                <>
                  {!isActive && (
                    <span className="hover-nav-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', borderRadius: '12px', transition: 'background 0.2s' }}>
                      <Icon size={18} />
                      {label}
                    </span>
                  )}
                  {isActive && (
                    <>
                      <Icon size={18} />
                      {label}
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '8px' }}>
            {user?.avatar ? (
              <img
                src={`${import.meta.env.VITE_API_URL}${user.avatar}`}
                alt="avatar"
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
              <p style={{ fontSize: '12px', color: '#A7A9BE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: '#FF6584', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,101,132,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
