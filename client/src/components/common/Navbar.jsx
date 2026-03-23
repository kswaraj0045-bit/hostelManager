import { useLocation } from 'react-router-dom'
import { useRef, useEffect, useState } from 'react'
import { Menu, Bell } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'

const routeNames = {
  '/dashboard': 'Dashboard',
  '/groups': 'My Groups',
  '/expenses': 'Expenses',
  '/chores': 'Chores',
  '/mess': 'Mess & Laundry',
  '/bills': 'Bills',
  '/ai-assistant': 'AI Assistant',
  '/ai': 'AI Assistant',
  '/profile': 'Profile',
  '/activity': 'Activity',
  '/room-setup': 'Room Setup',
}

export default function Navbar({ onMenuClick }) {
  const location = useLocation()
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const notificationRef = useRef(null)

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/reminders')
      const reminders = res.data?.data || []
      const upcoming = reminders
        .filter(r => !r.isCompleted)
        .filter(r => {
          const reminderDate = new Date(r.remind_at)
          const now = new Date()
          const diff = reminderDate - now
          return diff > 0 && diff < 24 * 60 * 60 * 1000
        })
        .sort((a, b) => new Date(a.remind_at) - new Date(b.remind_at))
      setNotifications(upcoming)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  useEffect(() => { fetchNotifications() }, [])

  // handle dynamic routes like /groups/:id or /settle/:groupId
  const pathname = location.pathname
  let title = routeNames[pathname] || 'HostelLife'
  if (pathname.startsWith('/groups/')) title = 'Group Detail'
  if (pathname.startsWith('/settle/')) title = 'Settle Up'

  return (
    <header
      style={{
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(15,14,23,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onMenuClick}
          className="md:hidden"
          style={{ padding: '8px', borderRadius: '12px', background: 'transparent', border: 'none', color: '#A7A9BE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#FFFFFE'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A7A9BE'; }}
        >
          <Menu size={20} />
        </button>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '20px', color: '#FFFFFE' }}>{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); fetchNotifications() }}
            style={{
              position: 'relative',
              padding: '8px',
              borderRadius: '10px',
              background: 'none',
              border: 'none',
              color: '#A7A9BE',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6584, #FF4465)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: '0',
              width: '320px',
              background: '#1C1B29',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              overflow: 'hidden',
              zIndex: 1000,
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px', color: '#FFFFFE' }}>Notifications</h3>
                <span style={{ fontSize: '12px', color: '#A7A9BE' }}>Next 24 hours</span>
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</p>
                    <p style={{ color: '#A7A9BE', fontSize: '14px' }}>No upcoming reminders</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n._id}
                      style={{
                        padding: '14px 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        background: 'rgba(108,99,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '18px'
                      }}>
                        🔔
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ color: '#FFFFFE', fontSize: '14px', fontWeight: 500, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {n.title}
                        </p>
                        <p style={{ color: '#A7A9BE', fontSize: '12px' }}>
                          {new Date(n.remind_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' · '}
                          {new Date(n.remind_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <a
                  href="/calendar"
                  style={{ color: '#6C63FF', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}
                  onClick={() => setShowNotifications(false)}
                >
                  View Calendar →
                </a>
              </div>
            </div>
          )}
        </div>

        {user?.avatar ? (
          <img
            src={`${import.meta.env.VITE_API_URL}${user.avatar}`}
            alt="avatar"
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
          />
        ) : (
          <div
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  )
}
