import { useState } from 'react'
import { useData } from '../lib/useData'
import { getCertifications } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import PageHeader from '../components/PageHeader'
import AddCertificationModal from '../components/AddCertificationModal'
import EditCertificationModal from '../components/EditCertificationModal'

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function Certifications() {
  const { data, loading, error, refetch } = useData(getCertifications)
  const certs = data ?? []
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  const valid    = certs.filter(c => c.status === 'valid').length
  const expiring = certs.filter(c => c.status === 'expiring').length
  const expired  = certs.filter(c => c.status === 'expired').length

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {showAdd && <AddCertificationModal onClose={() => setShowAdd(false)} onSaved={refetch} />}
      {!!editing && (
        <EditCertificationModal
          cert={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch() }}
        />
      )}

      <PageHeader
        title="Certifications"
        subtitle="Track employee credentials, expiry dates, and renewal status."
        action={
          <button type="button" className="btn btn-primary mobile-full" onClick={() => setShowAdd(true)}>
            + Add certification
          </button>
        }
      />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Valid', count: valid, color: '#059669', bg: '#ECFDF5', border: '#059669' },
          { label: 'Expiring soon', count: expiring, color: '#D97706', bg: '#FFFBEB', border: '#D97706' },
          { label: 'Expired', count: expired, color: '#DC2626', bg: '#FEF2F2', border: '#DC2626' },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderTop: `3px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: s.color }}>
              {s.count}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Certification</th>
              <th>Issuing body</th>
              <th>Expiry date</th>
              <th>Days remaining</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {certs.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9CA3AF', padding: 32 }}>
                No certifications yet — click + Add certification to get started.
              </td></tr>
            )}
            {certs.map(c => {
              const days = daysUntil(c.expiry_date)
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.users?.full_name}</td>
                  <td style={{ fontWeight: 500 }}>{c.cert_name}</td>
                  <td style={{ color: '#6B7280', fontFamily: 'var(--mono)', fontSize: 12 }}>{c.issuing_body}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#6B7280' }}>{c.expiry_date}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
                    color: days < 0 ? '#DC2626' : days <= 7 ? '#DC2626' : days <= 30 ? '#D97706' : '#059669'
                  }}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                  </td>
                  <td>
                    <span className={`pill ${c.status === 'expired' ? 'pill-red' : c.status === 'expiring' ? 'pill-amber' : 'pill-green'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(c) }}
                      style={{
                        padding: '5px 12px', borderRadius: 6,
                        border: '1px solid #E4E6EF', background: '#fff',
                        color: '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        transition: 'all .12s'
                      }}
                      onMouseOver={e => { e.target.style.borderColor = '#6B4EFF'; e.target.style.color = '#6B4EFF' }}
                      onMouseOut={e => { e.target.style.borderColor = '#E4E6EF'; e.target.style.color = '#6B7280' }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-card-list">
        {certs.length === 0 && (
          <div className="mobile-card" style={{ textAlign: 'center', color: '#9CA3AF' }}>
            No certifications yet — tap + Add certification.
          </div>
        )}
        {certs.map(c => {
          const days = daysUntil(c.expiry_date)
          const borderColor = c.status === 'expired' ? '#DC2626' : c.status === 'expiring' ? '#D97706' : '#059669'
          return (
            <div key={c.id} className="mobile-card" style={{ borderLeft: `3px solid ${borderColor}` }}>
              <div className="mobile-card-row">
                <span style={{ fontSize: 15, fontWeight: 600, color: '#0F1117' }}>{c.cert_name}</span>
                <span className={`pill ${c.status === 'expired' ? 'pill-red' : c.status === 'expiring' ? 'pill-amber' : 'pill-green'}`}>{c.status}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Employee</span>
                <span className="mobile-card-value">{c.users?.full_name}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Issuing body</span>
                <span className="mobile-card-value">{c.issuing_body}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Expires</span>
                <span className="mobile-card-value" style={{ color: days < 0 ? '#DC2626' : days <= 30 ? '#D97706' : '#059669', fontWeight: 600 }}>
                  {c.expiry_date} ({days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`})
                </span>
              </div>
              <div style={{ marginTop: 10 }}>
                <button type="button" onClick={() => setEditing(c)} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
                  Edit
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}