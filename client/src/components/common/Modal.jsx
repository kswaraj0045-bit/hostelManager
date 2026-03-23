import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, onConfirm, confirmLabel = 'Confirm', cancelLabel = 'Cancel', hideFooter = false }) {
  useEffect(() => {
    if (open) {
      const handleKey = (e) => { if (e.key === 'Escape') onClose?.() }
      document.addEventListener('keydown', handleKey)
      return () => document.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <div
        className="glass scale-in"
        style={{ maxWidth: '512px', width: '100%', padding: '24px', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', color: '#FFFFFE' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#A7A9BE', cursor: 'pointer', padding: '4px', borderRadius: '8px', display: 'flex', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#FFFFFE'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A7A9BE'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ color: '#FFFFFE' }}>{children}</div>

        {/* Footer */}
        {!hideFooter && onConfirm && (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#A7A9BE', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#FFFFFE'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#A7A9BE'; }}
            >
              {cancelLabel}
            </button>
            <button onClick={onConfirm} className="gradient-btn" style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '14px' }}>
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
