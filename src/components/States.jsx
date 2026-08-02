import { SkeletonPage, SkeletonDashboard } from './Skeleton'

export function LoadingState({ type = 'page' }) {
  if (type === 'dashboard') return <SkeletonDashboard />
  return <SkeletonPage />
}

export function ErrorState({ message }) {
  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{
        background: '#FEF2F2', border: '1px solid #FECACA',
        borderLeft: '4px solid #DC2626',
        borderRadius: '10px', padding: '16px 20px'
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>
          Failed to load data
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', fontFamily: 'var(--mono)' }}>
          {message}
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8, fontWeight: 500 }}>
          Check your Supabase connection and try refreshing.
        </div>
      </div>
    </div>
  )
}