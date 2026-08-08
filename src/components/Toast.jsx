import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [])

  const colors = {
    success: { bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', icon: '✓' },
    error:   { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', icon: '✕' },
    info:    { bg: '#EEF0FF', border: '#C7C0FF', color: '#6B4EFF', icon: 'ℹ' },
  }

  const c = colors[type] || colors.success

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 10,
      background: c.bg, border: `1px solid ${c.border}`,
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      fontFamily: 'Inter, sans-serif',
      animation: 'slideIn .2s ease',
      minWidth: 220, maxWidth: 360
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        background: c.color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700
      }}>{c.icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: c.color, flex: 1 }}>{message}</div>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', color: c.color,
        cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, opacity: 0.6
      }}>×</button>
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}