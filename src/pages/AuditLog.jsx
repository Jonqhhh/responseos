import { useData } from '../lib/useData'
import { getAuditLogs } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import PageHeader from '../components/PageHeader'

function exportCSV(logs) {
  const headers = ['Timestamp', 'Actor', 'Action', 'Table', 'Detail', 'IP']
  const rows = logs.map(log => [
    new Date(log.created_at).toLocaleString(),
    log.actor_id || 'SYSTEM',
    log.action,
    log.table_name || '',
    log.after_state ? Object.values(log.after_state).join(' | ') : '',
    log.ip_address || ''
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `responseos-audit-log-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AuditLog() {
  const { data, loading, error } = useData(getAuditLogs)
  const logs = data ?? []

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Audit Log"
        subtitle="Immutable, time-stamped record of every action on the platform."
        action={
          <button className="btn btn-ghost mobile-full" onClick={() => exportCSV(logs)}>
            ↓ Export CSV
          </button>
        }
      />

      {/* FERC badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#ECFDF5', border: '1px solid #A7F3D0',
        borderRadius: 10, padding: '12px 16px'
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#059669', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0
        }}>✓</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>Tamper-protected audit log</div>
          <div style={{ fontSize: 12, color: '#059669' }}>Records are immutable and time-stamped. Suitable for FERC regulatory review.</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {['FERC', 'NERC', 'SOC 2'].map(b => (
            <span key={b} style={{
              padding: '3px 10px', borderRadius: 99, fontSize: 11,
              fontWeight: 700, background: '#fff', color: '#059669',
              border: '1px solid #A7F3D0'
            }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th><th>Actor</th><th>Action</th><th>Table</th><th>Detail</th><th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF', padding: 32 }}>
                No audit log entries yet.
              </td></tr>
            )}
            {logs.map(log => (
              <tr key={log.id}>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td style={{ fontWeight: 600 }}>
                  {!log.actor_id ? (
                    <span style={{ color: '#6B4EFF', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, background: '#EEF0FF', padding: '2px 8px', borderRadius: 4 }}>
                      SYSTEM
                    </span>
                  ) : log.actor_id.substring(0, 8) + '...'}
                </td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#0F1117', fontWeight: 500 }}>
                  {log.action}
                </td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#9CA3AF' }}>
                  {log.table_name}
                </td>
                <td style={{ fontSize: 12, color: '#6B7280', maxWidth: 240 }}>
                  {log.after_state ? Object.values(log.after_state).join(' · ') : '—'}
                </td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#9CA3AF' }}>
                  {log.ip_address || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-card-list">
        {logs.map(log => (
          <div key={log.id} className="mobile-card">
            <div className="mobile-card-row">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1117', fontFamily: 'var(--mono)' }}>
                {log.action}
              </span>
              <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--mono)' }}>
                {log.table_name}
              </span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">Actor</span>
              <span className="mobile-card-value" style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                {!log.actor_id ? 'SYSTEM' : log.actor_id.substring(0, 8) + '...'}
              </span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">Time</span>
              <span className="mobile-card-value" style={{ fontSize: 12 }}>
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
            {log.after_state && (
              <div className="mobile-card-row">
                <span className="mobile-card-label">Detail</span>
                <span className="mobile-card-value" style={{ fontSize: 12 }}>
                  {Object.values(log.after_state).join(' · ')}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}