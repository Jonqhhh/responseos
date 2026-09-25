import { useState } from 'react'
import { useData } from '../lib/useData'
import { getCertifications } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import PageHeader from '../components/PageHeader'
import AddCertificationModal from '../components/AddCertificationModal'
import EditCertificationModal from '../components/EditCertificationModal'
import Toast from '../components/Toast'
import { ChevronDown, ChevronUp } from 'lucide-react'

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function StatusPill({ status }) {
  const map = {
    valid:    { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
    expiring: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
    expired:  { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  }
  const s = map[status] || map.valid
  return (
    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}

export default function Certifications() {
  const { data, loading, error, refetch } = useData(getCertifications)
  const certs = data ?? []
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState(null)
  const [expandedOwners, setExpandedOwners] = useState({})
  const [viewMode, setViewMode] = useState('grouped')
  const [selectedOwner, setSelectedOwner] = useState('')

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  const valid    = certs.filter(c => c.status === 'valid').length
  const expiring = certs.filter(c => c.status === 'expiring').length
  const expired  = certs.filter(c => c.status === 'expired').length

  function showToast(message, type = 'success') {
    setToast({ message, type, id: Date.now() })
  }

  function toggleOwner(name) {
    setExpandedOwners(prev => ({ ...prev, [name]: !prev[name] }))
  }

  // Group by owner
  const grouped = certs.reduce((acc, cert) => {
    const name = cert.users?.full_name || 'Unassigned'
    if (!acc[name]) acc[name] = []
    acc[name].push(cert)
    return acc
  }, {})

  const allOwners = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  const owners = allOwners.filter(([name]) => !selectedOwner || name === selectedOwner)

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showAdd && (
        <AddCertificationModal
          onClose={() => setShowAdd(false)}
          onSaved={(msg) => { refetch(); showToast(msg || 'Certification added successfully.') }}
        />
      )}

      {!!editing && (
        <EditCertificationModal
          cert={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg, type) => { setEditing(null); refetch(); showToast(msg || 'Certification updated.', type || 'success') }}
        />
      )}

      <PageHeader
        title="Certifications"
        subtitle="Track employee credentials, expiry dates, and renewal status."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
              {[{ id: 'grouped', label: 'By owner' }, { id: 'table', label: 'Table' }].map(v => (
                <button key={v.id} onClick={() => setViewMode(v.id)} style={{
                  padding: '7px 14px', fontSize: 12, fontWeight: 600, border: 'none',
                  background: viewMode === v.id ? '#fff' : 'transparent',
                  color: viewMode === v.id ? '#7C3AED' : '#6B7280',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  boxShadow: viewMode === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all .12s'
                }}>{v.label}</button>
              ))}
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
              + Add certification
            </button>
          </div>
        }
      />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Valid',         count: valid,    color: '#065F46', border: '#059669' },
          { label: 'Expiring soon', count: expiring, color: '#92400E', border: '#D97706' },
          { label: 'Expired',       count: expired,  color: '#991B1B', border: '#DC2626' },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderTop: `3px solid ${s.border}` }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.count}</div>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Employee dropdown filter */}
      {viewMode === 'grouped' && certs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Filter by employee:</label>
          <select
            value={selectedOwner}
            onChange={e => setSelectedOwner(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB',
              background: '#fff', color: '#111827', fontSize: 13,
              fontFamily: 'Inter, sans-serif', outline: 'none', cursor: 'pointer',
              minWidth: 220, boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            <option value="">All employees ({allOwners.length})</option>
            {allOwners.map(([name, ownerCerts]) => {
              const hasIssues = ownerCerts.some(c => c.status === 'expired' || c.status === 'expiring')
              return (
                <option key={name} value={name}>
                  {name} — {ownerCerts.length} cert{ownerCerts.length !== 1 ? 's' : ''}{hasIssues ? ' ⚠' : ''}
                </option>
              )
            })}
          </select>
          {selectedOwner && (
            <button onClick={() => setSelectedOwner('')} style={{
              padding: '7px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
              background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif'
            }}>✕ Clear</button>
          )}
        </div>
      )}

      {certs.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#9CA3AF', padding: 48 }}>
          No certifications yet — click + Add certification to get started.
        </div>
      )}

      {/* Grouped by owner view */}
      {viewMode === 'grouped' && certs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {owners.map(([ownerName, ownerCerts]) => {
            const isOpen = expandedOwners[ownerName] !== false
            const ownerExpired  = ownerCerts.filter(c => c.status === 'expired').length
            const ownerExpiring = ownerCerts.filter(c => c.status === 'expiring').length
            const ownerValid    = ownerCerts.filter(c => c.status === 'valid').length
            const initials = ownerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

            return (
              <div key={ownerName} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Owner header */}
                <div
                  onClick={() => toggleOwner(ownerName)}
                  style={{
                    padding: '14px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: '#F9FAFB',
                    borderBottom: isOpen ? '1px solid #F3F4F6' : 'none',
                    transition: 'background .12s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseOut={e => e.currentTarget.style.background = '#F9FAFB'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, boxShadow: '0 2px 6px rgba(124,58,237,0.3)'
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{ownerName}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span>{ownerCerts.length} certification{ownerCerts.length !== 1 ? 's' : ''}</span>
                      {ownerExpired  > 0 && <span style={{ color: '#DC2626', fontWeight: 600 }}>· {ownerExpired} expired</span>}
                      {ownerExpiring > 0 && <span style={{ color: '#D97706', fontWeight: 600 }}>· {ownerExpiring} expiring</span>}
                      {ownerValid    > 0 && <span style={{ color: '#059669', fontWeight: 600 }}>· {ownerValid} valid</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {ownerExpired > 0 && (
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                        {ownerExpired} EXPIRED
                      </span>
                    )}
                    {ownerExpiring > 0 && (
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
                        {ownerExpiring} EXPIRING
                      </span>
                    )}
                    {isOpen ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
                  </div>
                </div>

                {/* Owner's certs */}
                {isOpen && (
                  <div>
                    {ownerCerts.map((c, i) => {
                      const days = daysUntil(c.expiry_date)
                      const daysColor = days < 0 ? '#DC2626' : days <= 7 ? '#DC2626' : days <= 30 ? '#D97706' : '#059669'
                      return (
                        <div key={c.id} style={{
                          padding: '12px 20px 12px 70px',
                          display: 'flex', alignItems: 'center', gap: 14,
                          borderBottom: i < ownerCerts.length - 1 ? '1px solid #F9FAFB' : 'none',
                          background: '#fff', transition: 'background .1s'
                        }}
                          onMouseOver={e => e.currentTarget.style.background = '#FAFAFA'}
                          onMouseOut={e => e.currentTarget.style.background = '#fff'}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{c.cert_name}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              {c.issuing_body && <span>{c.issuing_body}</span>}
                              {c.issued_date  && <span>Issued {c.issued_date}</span>}
                              {c.expiry_date  && <span>Expires {c.expiry_date}</span>}
                            </div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: daysColor, fontFamily: 'var(--mono)', flexShrink: 0 }}>
                            {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                          </div>
                          <StatusPill status={c.status} />
                          {c.doc_url && (
                            <a href={c.doc_url} target="_blank" rel="noopener noreferrer" style={{
                              padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB',
                              background: '#fff', color: '#6B7280', fontSize: 11, fontWeight: 600,
                              textDecoration: 'none', flexShrink: 0
                            }}>📎 Doc</a>
                          )}
                          <button type="button" onClick={() => setEditing(c)} style={{
                            padding: '4px 10px', borderRadius: 6,
                            border: '1px solid #E5E7EB', background: '#fff',
                            color: '#374151', fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', flexShrink: 0, transition: 'all .12s'
                          }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.color = '#7C3AED' }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151' }}
                          >Edit</button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Table view */}
      {viewMode === 'table' && certs.length > 0 && (
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
              {certs.map(c => {
                const days = daysUntil(c.expiry_date)
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: '#111827' }}>{c.users?.full_name}</td>
                    <td style={{ fontWeight: 500, color: '#111827' }}>{c.cert_name}</td>
                    <td style={{ color: '#6B7280', fontFamily: 'var(--mono)', fontSize: 12 }}>{c.issuing_body}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#374151' }}>{c.expiry_date}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
                      color: days < 0 ? '#DC2626' : days <= 7 ? '#DC2626' : days <= 30 ? '#D97706' : '#059669'
                    }}>
                      {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                    </td>
                    <td><StatusPill status={c.status} /></td>
                    <td>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(c) }}
                        style={{
                          padding: '5px 12px', borderRadius: 6,
                          border: '1px solid #E5E7EB', background: '#fff',
                          color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          transition: 'all .12s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.color = '#7C3AED' }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151' }}
                      >Edit</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      <div className="mobile-card-list">
        {certs.map(c => {
          const days = daysUntil(c.expiry_date)
          const borderColor = c.status === 'expired' ? '#DC2626' : c.status === 'expiring' ? '#D97706' : '#059669'
          return (
            <div key={c.id} className="mobile-card" style={{ borderLeft: `3px solid ${borderColor}` }}>
              <div className="mobile-card-row">
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{c.cert_name}</span>
                <StatusPill status={c.status} />
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Employee</span>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{c.users?.full_name}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Issuing body</span>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{c.issuing_body}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Expires</span>
                <span style={{ fontSize: 13, color: days < 0 ? '#DC2626' : days <= 30 ? '#D97706' : '#059669', fontWeight: 700 }}>
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