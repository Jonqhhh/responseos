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

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {showAdd && (
        <AddCertificationModal
          onClose={() => setShowAdd(false)}
          onSaved={refetch}
        />
      )}

      {!!editing && (
        <EditCertificationModal
          cert={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}

      <PageHeader
        title="Certifications"
        subtitle="Track employee credentials, expiry dates, and renewal status."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + Add certification
          </button>
        }
      />

      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: 'Valid', count: certs.filter(c => c.status === 'valid').length, cls: 'pill-green' },
          { label: 'Expiring soon', count: certs.filter(c => c.status === 'expiring').length, cls: 'pill-amber' },
          { label: 'Expired', count: certs.filter(c => c.status === 'expired').length, cls: 'pill-red' },
        ].map(s => (
          <span key={s.label} className={`pill ${s.cls}`} style={{ fontSize: 13, padding: '5px 12px' }}>
            {s.count} {s.label}
          </span>
        ))}
      </div>

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
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>
                  No certifications yet — click + Add certification to get started.
                </td>
              </tr>
            )}
            {certs.map(c => {
              const days = daysUntil(c.expiry_date)
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.users?.full_name}</td>
                  <td>{c.cert_name}</td>
                  <td className="mono" style={{ color: 'var(--text2)' }}>{c.issuing_body}</td>
                  <td className="mono">{c.expiry_date}</td>
                  <td className="mono" style={{
                    color: days < 0 ? 'var(--red)' : days <= 7 ? 'var(--red)' : days <= 30 ? 'var(--amber)' : 'var(--green)'
                  }}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                  </td>
                  <td>
                    <span className={`pill ${
                      c.status === 'expired' ? 'pill-red' :
                      c.status === 'expiring' ? 'pill-amber' : 'pill-green'
                    }`}>{c.status}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditing(c); }}
                      style={{
                        padding: '4px 10px', borderRadius: 4,
                        border: '0.5px solid var(--border2)',
                        background: 'transparent', color: 'var(--text2)',
                        fontSize: 12, cursor: 'pointer'
                      }}>
                      Edit
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}