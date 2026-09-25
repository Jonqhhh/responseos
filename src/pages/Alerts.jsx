import { useState } from 'react'
import { useData } from '../lib/useData'
import { getAlerts, acknowledgeAlert } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'

const tierColor  = { critical: '#DC2626', warning: '#D97706', info: '#7C3AED' }
const tierBg     = { critical: '#FEF2F2', warning: '#FFFBEB', info: '#F5F3FF' }
const tierBorder = { critical: '#FECACA', warning: '#FDE68A', info: '#DDD6FE' }
const tierIcon   = { critical: '▲', warning: '●', info: 'ℹ' }

export default function Alerts() {
  const { data, loading, error, refetch } = useData(getAlerts)
  const alerts = data ?? []
  const [acknowledging, setAcknowledging] = useState(null)
  const [ackingAll, setAckingAll] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [toast, setToast] = useState(null)

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />

  const critical  = alerts.filter(a => a.tier === 'critical').length
  const warning   = alerts.filter(a => a.tier === 'warning').length
  const info      = alerts.filter(a => a.tier === 'info').length
  const unread    = alerts.filter(a => !a.acknowledged).length
  const unreadAlerts = alerts.filter(a => !a.acknowledged)

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

  async function handleAcknowledgeAll() {
    setAckingAll(true)
    setShowConfirm(false)
    for (const alert of unreadAlerts) {
      await supabase.from('alerts').update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString()
      }).eq('id', alert.id)
    }
    await supabase.from('audit_logs').insert({
      action: 'alerts_acknowledged_all',
      table_name: 'alerts',
      after_state: { count: unreadAlerts.length }
    })
    await refetch()
    setAckingAll(false)
    showToast(`All ${unreadAlerts.length} alerts acknowledged.`, 'success')
  }

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: '28px 28px',
            border: '1px solid #F3F4F6'
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 10 }}>
              Acknowledge all alerts?
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>
              This will acknowledge all <strong style={{ color: '#111827' }}>{unreadAlerts.length} unread alerts</strong> at once. This action will be recorded in the audit log.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleAcknowledgeAll} style={{
                flex: 1, padding: '11px', borderRadius: 9,
                background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                boxShadow: '0 2px 8px rgba(124,58,237,0.3)'
              }}>
                Yes, acknowledge all
              </button>
              <button onClick={() => setShowConfirm(false)} style={{
                flex: 1, padding: '11px', borderRadius: 9,
                background: '#F9FAFB', color: '#374151',
                border: '1px solid #E5E7EB', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif'
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Alerts"
        subtitle="Platform-generated compliance alerts, warnings, and escalations."
        action={
          unread > 0 && (
            <button
              className="btn btn-ghost"
              onClick={() => setShowConfirm(true)}
              disabled={ackingAll}
              style={{ opacity: ackingAll ? 0.6 : 1 }}
            >
              {ackingAll ? 'Acknowledging...' : `✓ Acknowledge all (${unread})`}
            </button>
          )
        }
      />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Unread',   count: unread,   color: '#111827', border: '#7C3AED' },
          { label: 'Critical', count: critical,  color: '#DC2626', border: '#DC2626' },
          { label: 'Warning',  count: warning,   color: '#D97706', border: '#D97706' },
          { label: 'Info',     count: info,      color: '#7C3AED', border: '#7C3AED' },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderTop: `3px solid ${s.border}` }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.count}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#059669', marginBottom: 4 }}>All clear</div>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>No alerts — everything looks good.</div>
          </div>
        )}
        {alerts.map(a => (
          <div key={a.id} style={{
            background: a.acknowledged ? '#F9FAFB' : '#fff',
            border: `1px solid ${a.acknowledged ? '#E5E7EB' : tierBorder[a.tier]}`,
            borderLeft: `4px solid ${a.acknowledged ? '#E5E7EB' : tierColor[a.tier]}`,
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', gap: 14, alignItems: 'flex-start',
            opacity: a.acknowledged ? 0.65 : 1,
            boxShadow: a.acknowledged ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all .15s'
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: a.acknowledged ? '#F3F4F6' : tierBg[a.tier],
              color: a.acknowledged ? '#9CA3AF' : tierColor[a.tier],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700,
              border: `1px solid ${a.acknowledged ? '#E5E7EB' : tierBorder[a.tier]}`
            }}>
              {tierIcon[a.tier]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
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
              <div style={{ fontSize: 14, color: '#111827', fontWeight: 500, lineHeight: 1.5, marginBottom: 6 }}>
                {a.message}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
                {new Date(a.created_at).toLocaleString()}
              </div>
            </div>
            {!a.acknowledged && (
              <button
                onClick={() => handleAcknowledge(a.id)}
                disabled={acknowledging === a.id || ackingAll}
                style={{
                  padding: '7px 14px', borderRadius: 8,
                  border: '1px solid #E5E7EB', background: '#fff',
                  color: '#6B7280', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', flexShrink: 0, transition: 'all .12s',
                  opacity: acknowledging === a.id || ackingAll ? 0.5 : 1
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.color = '#059669' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280' }}
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