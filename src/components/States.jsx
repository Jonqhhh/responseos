export function LoadingState() {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 60
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--blue)',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 12px'
        }} />
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function ErrorState({ message }) {
  return (
    <div style={{ padding: '24px 28px' }}>
      <div className="card" style={{ borderLeft: '3px solid var(--red)', padding: '14px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--red)', marginBottom: 4 }}>
          Failed to load data
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
          {message}
        </div>
      </div>
    </div>
  )
}