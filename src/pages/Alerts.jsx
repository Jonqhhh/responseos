import { useState } from 'react'
import { useData } from '../lib/useData'
import { getAlerts, acknowledgeAlert } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import PageHeader from '../components/PageHeader'

const tierColor = { critical: 'var(--red)', warning: 'var(--amber)', info: 'var(--blue)' }
const tierBg    = { critical: 'var(--red-dim)', warning: 'var(--amber-dim)', info: 'var(--blue-dim)' }
const tierIcon  = { critical: '▲', warning: '●', info: 'ℹ' }

export default function Alerts() {
  const { data, loading, error, refetch } = useData(getAlerts)
  const alerts = data ?? []
  const [acknowledging, setAcknowledging] = useState(null)

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />

  async function handleAcknowledge(id) {
    setAcknowledging(id)
    await acknowledgeAlert(id)
    await refetch()
    setAcknowledging(null)
  }

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Alerts"
        subtitle="Platform-generated compliance alerts, warnings, and escalations."
      />

      <div style={{ display: 'flex', gap: 10 }}>
        {['critical', 'warning', 'info'].map(t => (
          <span key={t} className="pill" style={{
            fontSize: 13, padding: '5px 12px',
            background: tierBg[t], color: tierColor[t]
          }}>
            {alerts.filter(a => a.tier === t).length} {t}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.map(a => (
          <div key={a.id} className="card" style={{
            display: 'flex', gap: 14, alignItems: 'flex-start',
            opacity: a.acknowledged ? 0.6 : 1,
            borderLeft: `3px solid ${tierColor[a.tier]}`
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: tierBg[a.tier], color: tierColor[a.tier],
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
            }}>
              {tierIcon[a.tier]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, marginBottom: 4 }}>
                {a.message}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                {a.tier.toUpperCase()} · {a.type.toUpperCase()} · {new Date(a.created_at).toLocaleString()}
                {!a.acknowledged && (
                  <span style={{ color: 'var(--red)', marginLeft: 8 }}>● Unread</span>
                )}
              </div>
            </div>
            {!a.acknowledged && (
              <button
                className="btn btn-ghost"
                style={{ fontSize: 12, padding: '5px 12px', opacity: acknowledging === a.id ? 0.5 : 1 }}
                onClick={() => handleAcknowledge(a.id)}
                disabled={acknowledging === a.id}
              >
                {acknowledging === a.id ? 'Saving…' : 'Acknowledge'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}