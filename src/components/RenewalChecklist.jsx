import { useState } from 'react'
import { Loader2, Mail, AlertTriangle } from 'lucide-react'
import { daysBetween, prettyDate, formatTime, renewalFor, checkRenewal, uncheckRenewal } from '../lib/training'

export default function RenewalChecklist({ user, certs, assignments, onChanged, compact = false, limit }) {
  const [busyId, setBusyId] = useState(null)
  const [msg, setMsg] = useState(null) // { text, error }

  const rows = (certs || [])
    .filter(c => c.user_id)
    .sort((a, b) => String(a.expiry_date || '').localeCompare(String(b.expiry_date || '')))
  const shown = limit ? rows.slice(0, limit) : rows

  async function toggle(cert, isChecked) {
    const name = cert.users?.full_name || 'Employee'
    setBusyId(cert.id); setMsg(null)
    try {
      if (isChecked) {
        const r = await uncheckRenewal(user, cert, assignments)
        setMsg({ text: `${name} removed from ${cert.cert_name} renewal${r.emailError ? ' · email failed' : ' · notified'}.`, error: !!r.emailError })
      } else {
        const r = await checkRenewal(user, cert, assignments)
        const when = `${prettyDate(r.date)}${r.start_time ? ` · ${formatTime(r.start_time)}` : ''}`
        setMsg({
          text: `${name} rescheduled for ${when}${r.joined ? ' (joined existing session)' : ''}${r.emailError ? ' · email failed' : r.emailed ? ' · emails sent' : ''}.`,
          error: !!r.emailError,
        })
      }
      await onChanged?.()
    } catch (e) {
      setMsg({ text: e.message, error: true })
    }
    setBusyId(null)
  }

  if (rows.length === 0) {
    return <div style={{ fontSize: 13, color: '#9CA3AF', padding: compact ? '8px 0' : '16px 20px' }}>No certifications need renewal.</div>
  }

  return (
    <div>
      {shown.map((c, i) => {
        const session = renewalFor(assignments, c)
        const checked = !!session
        const busy = busyId === c.id
        const days = c.expiry_date ? daysBetween(c.expiry_date) : null
        const expired = days !== null && days < 0
        const dot = checked ? '#7C3AED' : expired ? '#DC2626' : '#D97706'

        return (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: compact ? 8 : 12,
            padding: compact ? '7px 0' : '11px 20px',
            borderBottom: !compact && i < shown.length - 1 ? '1px solid #F3F4F6' : 'none',
            background: !compact && checked ? '#FAFAFF' : 'transparent',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: dot }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: compact ? 12 : 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.users?.full_name || 'Unassigned'} <span style={{ color: '#9CA3AF', fontWeight: 500 }}>· {c.cert_name}</span>
              </div>
              {!compact && (
                <div style={{ fontSize: 12, color: expired ? '#B91C1C' : '#6B7280', marginTop: 1 }}>
                  {days === null ? 'No expiry date' : expired ? `Expired ${Math.abs(days)}d ago` : `Expires in ${days}d`}
                </div>
              )}
            </div>

            {compact && (
              <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', color: expired ? '#B91C1C' : '#B45309' }}>
                {days === null ? '' : expired ? `${Math.abs(days)}d overdue` : `${days}d left`}
              </span>
            )}

            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0,
              cursor: busyId ? 'not-allowed' : 'pointer', userSelect: 'none',
              padding: compact ? '3px 8px' : '5px 10px', borderRadius: 8,
              border: `1px solid ${checked ? '#DDD6FE' : '#E5E7EB'}`,
              background: checked ? '#F5F3FF' : '#fff',
              minWidth: compact ? 0 : 118, justifyContent: 'flex-start',
            }}>
              {busy
                ? <Loader2 size={14} color="#7C3AED" className="spin" />
                : <input type="checkbox" checked={checked} disabled={!!busyId}
                    onChange={() => toggle(c, checked)}
                    style={{ width: 15, height: 15, margin: 0, accentColor: '#7C3AED', cursor: 'inherit' }} />}
              <span style={{ fontSize: compact ? 11 : 12, fontWeight: 600, color: checked ? '#5B21B6' : '#374151', whiteSpace: 'nowrap' }}>
                {checked
                  ? `Rescheduled · ${prettyDate(session.scheduled_date)}${!compact && session.start_time ? ` · ${formatTime(session.start_time)}` : ''}`
                  : 'Reschedule'}
              </span>
            </label>
          </div>
        )
      })}

      {msg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600,
          margin: compact ? '6px 0 0' : '10px 20px 12px', padding: '7px 10px', borderRadius: 8,
          background: msg.error ? '#FEF2F2' : '#F5F3FF', color: msg.error ? '#B91C1C' : '#5B21B6',
          border: `1px solid ${msg.error ? '#FECACA' : '#DDD6FE'}`,
        }}>
          {msg.error ? <AlertTriangle size={13} /> : <Mail size={13} />} {msg.text}
        </div>
      )}

      <style>{`@keyframes ros-spin { to { transform: rotate(360deg) } } .spin { animation: ros-spin 0.8s linear infinite }`}</style>
    </div>
  )
}