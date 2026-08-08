import { useState } from 'react'
import { useData } from '../lib/useData'
import { getAlerts, acknowledgeAlert } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'

const tierColor  = { critical: '#DC2626', warning: '#D97706', info: '#6B4EFF' }
const tierBg     = { critical: '#FEF2F2', warning: '#FFFBEB', info: '#EEF0FF' }
const tierBorder = { critical: '#FECACA', warning: '#FDE68A', info: '#C7C0FF' }
const tierIcon   = { critical: '▲', warning: '●', info: 'ℹ' }

export default function Alerts() {
  const { data, loading, error, refetch } = useData(getAlerts)
  const alerts = data ?? []
  const [acknowledging, setAcknowledging] = useState(null)
  const [toast, setToast] = useState(null)

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />

  const critical = alerts.filter(a => a.tier === 'critical').length
  const warning  = alerts.filter(a => a.tier === 'warning').length
  const info     = alerts.filter(a => a.tier === 'info').length
  const unread   = alerts.filter(a => !a.acknowledged).length

  function showToast(message, type = 'success') {
    setToast({ message, type, id: Date.now() })
  }

  async function handleAcknowledge(id) {
    setAcknowledging(id)
    await acknowledgeAlert(id)
    await refetch()
    setAcknowledging(null)
    showToast('Alert acknowledged.', 'success')
  }

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <PageHeader
        title="Alerts"
        subtitle="Platform-generated compliance alerts, warnings, and escalations."
      />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Unread', count: unread, color: '#0F1117', bg: '#F8F9FC', border: '#6B4EFF' },
          { label: 'Critical', count: critical, color: '#DC2626', bg: '#FEF2F2', border: '#DC2626' },
          { label: 'Warning', count: warning, color: '#D97706', bg: '#FFFBEB', border: '#D97706' },
          { label: 'Info', count: info, color: '#6B4EFF', bg: '#EEF0FF', border: '#6B4EFF' },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderTop: `3px solid ${s.border}` }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.count}</div>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#059669', marginBottom: 4 }}>All clear</div>
            <div style={{ fontSize: 13 }}>No alerts — everything looks good.</div>
          </div>
        )}
        {alerts.map(a => (
          <div key={a.id} style={{
            background: a.acknowledged ? '#F8F9FC' : '#fff',
            border: `1px solid ${a.acknowledged ? '#E4E6EF' : tierBorder[a.tier]}`,
            borderLeft: `4px solid ${a.acknowledged ? '#E4E6EF' : tierColor[a.tier]}`,
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', gap: 14, alignItems: 'flex-start',
            opacity: a.acknowledged ? 0.65 : 1,
            boxShadow: a.acknowledged ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
            transition: 'all .15s'
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: tierBg[a.tier], color: tierColor[a.tier],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, border: `1px solid ${tierBorder[a.tier]}`
            }}>
              {tierIcon[a.tier]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: tierColor[a.tier], textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {a.tier}
                </span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>·</span>
                <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{a.type?.toUpperCase()}</span>
                {!a.acknowledged && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '2px 7px', borderRadius: 99, border: '1px solid #FECACA' }}>
                    UNREAD
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, color: '#0F1117', fontWeight: 500, lineHeight: 1.5, marginBottom: 6 }}>
                {a.message}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
                {new Date(a.created_at).toLocaleString()}
              </div>
            </div>
            {!a.acknowledged && (
              <button
                onClick={() => handleAcknowledge(a.id)}
                disabled={acknowledging === a.id}
                style={{
                  padding: '7px 14px', borderRadius: 8,
                  border: '1px solid #E4E6EF', background: '#fff',
                  color: '#6B7280', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', flexShrink: 0, transition: 'all .12s',
                  opacity: acknowledging === a.id ? 0.5 : 1
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.color = '#059669' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#E4E6EF'; e.currentTarget.style.color = '#6B7280' }}
              >
                {acknowledging === a.id ? 'Saving…' : '✓ Acknowledge'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}