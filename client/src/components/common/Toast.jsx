import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

function ToastItem({ id, message, type = 'success', onClose }) {
  const timer = useRef(null)

  useEffect(() => {
    timer.current = setTimeout(() => onClose(id), 3000)
    return () => clearTimeout(timer.current)
  }, [id, onClose])

  const colors = {
    success: { border: 'rgba(44,182,125,0.3)', color: '#2CB67D', symbol: '✓' },
    error: { border: 'rgba(255,101,132,0.3)', color: '#FF6584', symbol: '✕' },
    warning: { border: 'rgba(255,137,6,0.3)', color: '#FF8906', symbol: '⚠' },
    info: { border: 'rgba(108,99,255,0.3)', color: '#6C63FF', symbol: 'ℹ' },
  }
  const c = colors[type] || colors.info

  return (
    <div
      className="glass slide-in"
      style={{ minWidth: '288px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderColor: c.border }}
      role="alert"
    >
      <span style={{ color: c.color, fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>{c.symbol}</span>
      <span style={{ flex: 1, fontSize: '14px', color: '#FFFFFE' }}>{message}</span>
      <button
        onClick={() => onClose(id)}
        style={{ background: 'transparent', border: 'none', color: '#A7A9BE', cursor: 'pointer', padding: '2px', display: 'flex', transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#FFFFFE'}
        onMouseLeave={e => e.currentTarget.style.color = '#A7A9BE'}
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default function Toast({ toasts = [], onClose }) {
  // Support both old single-toast usage and new multi-toast array
  if (!Array.isArray(toasts)) {
    // legacy fallback
    return (
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <ToastItem id="1" message={toasts} type="success" onClose={() => onClose?.()} />
      </div>
    )
  }

  if (!toasts.length) return null

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onClose={onClose} />
      ))}
    </div>
  )
}
