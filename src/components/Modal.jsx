export default function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 12, padding: '28px 28px',
        width: 480, maxWidth: '90vw',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 20
        }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{title}</div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text2)',
            fontSize: 20, cursor: 'pointer', lineHeight: 1
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}