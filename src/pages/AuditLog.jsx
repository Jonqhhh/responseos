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
    <div className="page-wrap" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Audit Log"
        subtitle="Immutable, time-stamped record of every action on the platform."
        action={
          <button className="btn btn-ghost mobile-full" onClick={() => exportCSV(logs)}>
            Export CSV
          </button>
        }
      />

      <div className="card" style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
        borderLeft: '3px solid var(--green)'
      }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>
          Audit log is <span style={{ color: 'var(--green)', fontWeight: 500 }}>tamper-protected</span> —
          records are immutable and time-stamped. Suitable for FERC regulatory review.
        </span>
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
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>
                No audit log entries yet.
              </td></tr>
            )}
            {logs.map(log => (
              <tr key={log.id}>
                <td className="mono" style={{ color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td style={{ fontWeight: 500 }}>
                  {!log.actor_id
                    ? <span style={{ color: 'var(--blue)', fontFamily: 'var(--mono)', fontSize: 12 }}>SYSTEM</span>
                    : log.actor_id}
                </td>
                <td className="mono" style={{ color: 'var(--text2)', fontSize: 12 }}>{log.action}</td>
                <td className="mono" style={{ color: 'var(--text3)', fontSize: 12 }}>{log.table_name}</td>
                <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 220 }}>
                  {log.after_state ? Object.values(log.after_state).join(' · ') : '—'}
                </td>
                <td className="mono" style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {log.ip_address || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-card-list">
        {logs.length === 0 && (
          <div className="mobile-card" style={{ textAlign: 'center', color: 'var(--text3)' }}>
            No audit log entries yet.
          </div>
        )}
        {logs.map(log => (
          <div key={log.id} className="mobile-card">
            <div className="mobile-card-row">
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--mono)' }}>
                {log.action}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                {log.table_name}
              </span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">Actor</span>
              <span className="mobile-card-value">
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