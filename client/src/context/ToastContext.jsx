import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext(null);

function ToastItem({ id, message, type, onRemove }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(id), 3500);
    return () => clearTimeout(timerRef.current);
  }, [id, onRemove]);

  const styles = {
    success: { border: 'rgba(44,182,125,0.4)',  color: '#2CB67D', symbol: '✓' },
    error:   { border: 'rgba(255,101,132,0.4)', color: '#FF6584', symbol: '✕' },
    warning: { border: 'rgba(255,137,6,0.4)',   color: '#FF8906', symbol: '⚠' },
    info:    { border: 'rgba(108,99,255,0.4)',   color: '#6C63FF', symbol: 'ℹ' },
  };
  const s = styles[type] || styles.info;

  return (
    <div
      className="slide-in"
      style={{
        minWidth: '280px', maxWidth: '380px',
        background: 'rgba(28,27,41,0.97)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${s.border}`,
        borderRadius: '14px',
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <span style={{ color: s.color, fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>{s.symbol}</span>
      <span style={{ flex: 1, fontSize: '14px', color: '#FFFFFE', lineHeight: 1.4 }}>{message}</span>
      <button
        onClick={() => onRemove(id)}
        style={{ background: 'transparent', border: 'none', color: '#A7A9BE', cursor: 'pointer', padding: '2px', display: 'flex', flexShrink: 0, transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#FFFFFE'}
        onMouseLeave={e => e.currentTarget.style.color = '#A7A9BE'}
      >
        <X size={15} />
      </button>
    </div>
  );
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error   = useCallback((msg) => addToast(msg, 'error'),   [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const info    = useCallback((msg) => addToast(msg, 'info'),    [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, success, error, warning, info }}>
      {children}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem {...t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
