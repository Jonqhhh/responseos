export function SkeletonBlock({ width = '100%', height = 16, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, #F3F4F8 25%, #E9EAEF 50%, #F3F4F8 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      ...style
    }} />
  )
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SkeletonBlock height={14} width="40%" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock key={i} height={12} width={i % 2 === 0 ? '100%' : '70%'} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', background: '#F8F9FC', borderBottom: '1px solid #E4E6EF', display: 'flex', gap: 16 }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} height={10} width={`${80 + Math.random() * 40}px`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '14px', borderBottom: '1px solid #F3F4F8', display: 'flex', gap: 16, alignItems: 'center' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonBlock key={j} height={12} width={j === 0 ? '120px' : `${60 + Math.random() * 60}px`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonBlock height={28} width={200} />
          <SkeletonBlock height={14} width={280} />
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SkeletonBlock height={10} width="60%" />
            <SkeletonBlock height={36} width="50%" />
            <SkeletonBlock height={10} width="80%" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <SkeletonBlock height={10} width="40%" style={{ marginBottom: 16 }} />
          <SkeletonBlock height={200} radius={8} />
        </div>
        <div className="card">
          <SkeletonBlock height={10} width="60%" style={{ marginBottom: 16 }} />
          <SkeletonBlock height={200} radius={8} />
        </div>
      </div>

      {/* Table */}
      <SkeletonTable rows={5} cols={5} />
    </div>
  )
}

export function SkeletonPage({ cards = 3 }) {
  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonBlock height={28} width={200} />
          <SkeletonBlock height={14} width={300} />
        </div>
        <SkeletonBlock height={38} width={140} radius={8} />
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SkeletonBlock height={32} width="50%" />
            <SkeletonBlock height={10} width="70%" />
          </div>
        ))}
      </div>

      {/* Table */}
      <SkeletonTable rows={6} cols={5} />
    </div>
  )
}