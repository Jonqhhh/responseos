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
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Audit Log"
        subtitle="Immutable, time-stamped record of every action on the platform."
        action={
          <button className="btn btn-ghost" onClick={() => exportCSV(logs)}>
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

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th><th>Actor</th><th>Action</th><th>Table</th><th>Detail</th><th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>
                  No audit log entries yet.
                </td>
              </tr>
            )}
            {logs.map(log => (
              <tr key={log.id}>
                <td className="mono" style={{ color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td style={{ fontWeight: 500 }}>
                  {!log.actor_id ? (
                    <span style={{ color: 'var(--blue)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                      SYSTEM
                    </span>
                  ) : log.actor_id}
                </td>
                <td className="mono" style={{ color: 'var(--text2)', fontSize: 12 }}>
                  {log.action}
                </td>
                <td className="mono" style={{ color: 'var(--text3)', fontSize: 12 }}>
                  {log.table_name}
                </td>
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
    </div>
  )
}