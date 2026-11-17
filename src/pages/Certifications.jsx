import { useState, useRef, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { useData } from '../lib/useData'
import { getCertifications, supabase } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import PageHeader from '../components/PageHeader'
import AddCertificationModal from '../components/AddCertificationModal'
import EditCertificationModal from '../components/EditCertificationModal'
import Toast from '../components/Toast'
import {
  ChevronDown, ChevronUp, MoreVertical, Pencil, Eye, Download,
  Paperclip, X, FileText, ExternalLink, ShieldCheck, UserX, UserPlus
} from 'lucide-react'

const UNASSIGNED = 'Unassigned'

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function fmtDate(d) {
  if (!d) return '—'
  const dt = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T00:00:00') : new Date(d)
  if (isNaN(dt)) return d
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysLabel(days) {
  if (days === null || isNaN(days)) return '—'
  return days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`
}

function daysColor(days) {
  if (days === null || isNaN(days)) return '#9CA3AF'
  return days <= 7 ? '#DC2626' : days <= 30 ? '#D97706' : '#059669'
}

function safeName(s) {
  return String(s || 'record').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')
}

function ownerOf(c) {
  return c.users?.full_name || UNASSIGNED
}

function OwnerName({ cert, style }) {
  if (cert.users?.full_name) return <span style={style}>{cert.users.full_name}</span>
  return <span style={{ ...style, color: '#9CA3AF', fontStyle: 'italic', fontWeight: 500 }}>Unassigned</span>
}

const STATUS = {
  valid:    { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  expiring: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  expired:  { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
}

function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.valid
  return (
    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}

/* ---------- Downloads ---------- */

function downloadCertPdf(c) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const days = daysUntil(c.expiry_date)

  doc.setFillColor(19, 8, 42); doc.rect(0, 0, W, 26, 'F')
  doc.setFillColor(124, 58, 237); doc.rect(0, 26, W, 1.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text('ResponseOS', 14, 16)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text('CERTIFICATION RECORD', W - 14, 16, { align: 'right' })

  doc.setTextColor(17, 24, 39)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18)
  const titleLines = doc.splitTextToSize(c.cert_name || 'Certification', W - 28)
  doc.text(titleLines, 14, 42)
  let y = 42 + titleLines.length * 7 + 2

  const st = (c.status || 'valid').toUpperCase()
  const stColor = c.status === 'expired' ? [185, 28, 28] : c.status === 'expiring' ? [180, 83, 9] : [4, 120, 87]
  doc.setFontSize(9); doc.setFont('helvetica', 'bold')
  const bw = doc.getTextWidth(st) + 8
  doc.setDrawColor(...stColor); doc.setTextColor(...stColor)
  doc.roundedRect(14, y - 4.5, bw, 7, 2, 2, 'S')
  doc.text(st, 18, y)
  y += 14

  const rows = [
    ['Employee',          c.users?.full_name || 'Unassigned'],
    ['Issuing body',      c.issuing_body || '—'],
    ['Issued',            fmtDate(c.issued_date)],
    ['Expires',           fmtDate(c.expiry_date)],
    ['Days remaining',    daysLabel(days)],
    ['Document on file',  c.doc_url ? 'Yes' : 'No'],
    ['Record ID',         c.id || '—'],
  ]
  rows.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(107, 114, 128)
    doc.text(k.toUpperCase(), 14, y)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(17, 24, 39)
    doc.text(String(v), 70, y)
    doc.setDrawColor(229, 231, 235); doc.line(14, y + 4, W - 14, y + 4)
    y += 12
  })

  y += 16
  doc.setDrawColor(156, 163, 175)
  doc.line(14, y, 95, y); doc.line(W - 95, y, W - 14, y)
  doc.setFontSize(8.5); doc.setTextColor(107, 114, 128)
  doc.text('Verified by (Admin / Supervisor)', 14, y + 5)
  doc.text('Date', W - 95, y + 5)

  doc.setFontSize(8); doc.setTextColor(156, 163, 175)
  doc.text(`Generated ${new Date().toLocaleString('en-US')} · responseos.net`, 14, H - 12)

  doc.save(`${safeName(c.users?.full_name || 'Unassigned')}_${safeName(c.cert_name)}.pdf`)
}

async function downloadDocFile(c) {
  try {
    const res = await fetch(c.doc_url)
    if (!res.ok) throw new Error('fetch failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const fromUrl = decodeURIComponent(c.doc_url.split('?')[0].split('/').pop() || '')
    a.href = url
    a.download = fromUrl || `${safeName(c.cert_name)}`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch {
    window.open(c.doc_url, '_blank', 'noopener,noreferrer')
  }
}

/* ---------- Three-dot row menu ---------- */

function RowMenu({ cert, onEdit, onView, onDownload, onAssign }) {
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  const items = [
    ...(onAssign ? [{ icon: UserPlus, label: 'Assign to employee', fn: onAssign, accent: true }] : []),
    { icon: Pencil,   label: 'Edit',         fn: onEdit },
    { icon: Eye,      label: 'View details', fn: onView },
    { icon: Download, label: cert.doc_url ? 'Download document' : 'Download record (PDF)', fn: onDownload },
  ]

  useEffect(() => {
    if (!pos) return
    const close = () => setPos(null)
    const onDown = e => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return
      close()
    }
    const onKey = e => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [pos])

  function toggle(e) {
    e.stopPropagation()
    if (pos) { setPos(null); return }
    const r = btnRef.current.getBoundingClientRect()
    const MW = 210, MH = items.length * 38 + 10
    const openUp = r.bottom + MH + 8 > window.innerHeight
    setPos({ top: openUp ? r.top - MH - 4 : r.bottom + 4, left: Math.max(8, r.right - MW) })
  }

  return (
    <>
      <button ref={btnRef} type="button" onClick={toggle} aria-label="Certification actions" title="Actions"
        style={{
          width: 30, height: 30, borderRadius: 7, flexShrink: 0,
          border: `1px solid ${pos ? '#7C3AED' : '#E5E7EB'}`,
          background: pos ? '#F5F3FF' : '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s'
        }}
        onMouseOver={e => { if (!pos) e.currentTarget.style.borderColor = '#C4B5FD' }}
        onMouseOut={e => { if (!pos) e.currentTarget.style.borderColor = '#E5E7EB' }}
      >
        <MoreVertical size={15} color={pos ? '#7C3AED' : '#6B7280'} />
      </button>

      {pos && (
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left, width: 210, zIndex: 1000,
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 5,
          boxShadow: '0 12px 32px rgba(17,24,39,0.14)'
        }}>
          {items.map(({ icon: Icon, label, fn, accent }) => (
            <button key={label} type="button"
              onClick={e => { e.stopPropagation(); setPos(null); fn() }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 7, border: 'none', background: 'transparent',
                fontSize: 13, fontWeight: accent ? 600 : 500, color: accent ? '#7C3AED' : '#374151',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left'
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.color = '#7C3AED' }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = accent ? '#7C3AED' : '#374151' }}
            >
              <Icon size={15} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/* ---------- Shared modal shell ---------- */

function ModalShell({ onClose, maxWidth = 480, children }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(17,24,39,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth, background: '#fff', borderRadius: 16,
        boxShadow: '0 24px 60px rgba(17,24,39,0.25)', overflow: 'hidden'
      }}>
        {children}
      </div>
    </div>
  )
}

/* ---------- Assign owner modal ---------- */

function AssignOwnerModal({ cert, onClose, onSaved }) {
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [userId, setUserId] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, is_demo')
        .order('full_name', { ascending: true })
      if (!alive) return
      if (error) setErr(error.message)
      else setUsers((data || []).filter(u => !!u.is_demo === !!cert.is_demo && u.full_name))
      setLoadingUsers(false)
    })()
    return () => { alive = false }
  }, [cert.is_demo])

  async function save() {
    if (!userId) return
    setSaving(true); setErr(null)
    const { error } = await supabase.from('certifications').update({ user_id: userId }).eq('id', cert.id)
    setSaving(false)
    if (error) { setErr(error.message); return }
    const name = users.find(u => u.id === userId)?.full_name || 'employee'
    onSaved(`Assigned to ${name}.`)
  }

  return (
    <ModalShell onClose={onClose} maxWidth={440}>
      <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UserPlus size={19} color="#7C3AED" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Assign certification</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>{cert.cert_name}</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF' }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '18px 22px' }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Employee</label>
        <select value={userId} onChange={e => setUserId(e.target.value)} disabled={loadingUsers}
          style={{
            width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid #E5E7EB',
            background: '#fff', color: userId ? '#111827' : '#9CA3AF', fontSize: 14,
            fontFamily: 'Inter, sans-serif', outline: 'none', cursor: 'pointer'
          }}>
          <option value="">{loadingUsers ? 'Loading employees...' : 'Select an employee...'}</option>
          {users.map(u => (
            <option key={u.id} value={u.id} style={{ color: '#111827' }}>
              {u.full_name}{u.email ? ` — ${u.email}` : ''}
            </option>
          ))}
        </select>
        {!loadingUsers && users.length === 0 && !err && (
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>No employees found.</div>
        )}
        {err && (
          <div style={{ marginTop: 10, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#B91C1C' }}>{err}</div>
        )}
      </div>

      <div style={{ padding: '14px 22px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} className="btn btn-ghost" style={{ fontSize: 13 }}>Cancel</button>
        <button type="button" onClick={save} disabled={!userId || saving} className="btn btn-primary"
          style={{ fontSize: 13, opacity: !userId || saving ? 0.55 : 1, cursor: !userId || saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving...' : 'Assign'}
        </button>
      </div>
    </ModalShell>
  )
}

/* ---------- View details modal ---------- */

function CertViewModal({ cert, onClose, onEdit, onAssign, onDownloadDoc, onDownloadPdf }) {
  const days = daysUntil(cert.expiry_date)
  const unassigned = !cert.users?.full_name
  const rows = [
    ['Employee',       <OwnerName cert={cert} />],
    ['Issuing body',   cert.issuing_body || '—'],
    ['Issued',         fmtDate(cert.issued_date)],
    ['Expires',        fmtDate(cert.expiry_date)],
  ]

  return (
    <ModalShell onClose={onClose}>
      <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={19} color="#7C3AED" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 6, lineHeight: 1.3 }}>{cert.cert_name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusPill status={cert.status} />
            <span style={{ fontSize: 12, fontWeight: 700, color: daysColor(days), fontFamily: 'var(--mono)' }}>{daysLabel(days)}</span>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF' }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '6px 22px' }}>
        {rows.map(([k, v], i) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '11px 0', borderBottom: i < rows.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{k}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'right' }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ margin: '6px 22px 18px', padding: '12px 14px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10 }}>
        <FileText size={17} color={cert.doc_url ? '#7C3AED' : '#9CA3AF'} />
        <span style={{ flex: 1, fontSize: 13, color: cert.doc_url ? '#111827' : '#9CA3AF', fontWeight: 500 }}>
          {cert.doc_url ? 'Certificate document on file' : 'No document uploaded'}
        </span>
        {cert.doc_url && (
          <a href={cert.doc_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#7C3AED', textDecoration: 'none' }}>
            Open <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div style={{ padding: '14px 22px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {cert.doc_url && (
          <button type="button" onClick={onDownloadDoc} className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Paperclip size={14} /> Document
          </button>
        )}
        <button type="button" onClick={onDownloadPdf} className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Download size={14} /> PDF record
        </button>
        {unassigned ? (
          <button type="button" onClick={onAssign} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <UserPlus size={14} /> Assign
          </button>
        ) : (
          <button type="button" onClick={onEdit} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Pencil size={14} /> Edit
          </button>
        )}
      </div>
    </ModalShell>
  )
}

/* ---------- Page ---------- */

export default function Certifications() {
  const { data, loading, error, refetch } = useData(getCertifications)
  const certs = data ?? []
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [assigning, setAssigning] = useState(null)
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

  async function handleDownload(c) {
    if (c.doc_url) {
      await downloadDocFile(c)
      showToast('Document downloaded.')
    } else {
      downloadCertPdf(c)
      showToast('No document on file — downloaded PDF record instead.')
    }
  }

  function menuFor(c) {
    const unassigned = !c.users?.full_name
    return (
      <RowMenu
        cert={c}
        onAssign={unassigned ? () => setAssigning(c) : null}
        onEdit={() => setEditing(c)}
        onView={() => setViewing(c)}
        onDownload={() => handleDownload(c)}
      />
    )
  }

  // Group by owner — Unassigned always last
  const grouped = certs.reduce((acc, cert) => {
    const name = ownerOf(cert)
    if (!acc[name]) acc[name] = []
    acc[name].push(cert)
    return acc
  }, {})

  const allOwners = Object.entries(grouped).sort(([a], [b]) => {
    if (a === UNASSIGNED) return 1
    if (b === UNASSIGNED) return -1
    return a.localeCompare(b)
  })
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

      {!!assigning && (
        <AssignOwnerModal
          cert={assigning}
          onClose={() => setAssigning(null)}
          onSaved={(msg) => { setAssigning(null); refetch(); showToast(msg) }}
        />
      )}

      {!!viewing && (
        <CertViewModal
          cert={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { const c = viewing; setViewing(null); setEditing(c) }}
          onAssign={() => { const c = viewing; setViewing(null); setAssigning(c) }}
          onDownloadDoc={async () => { await downloadDocFile(viewing); showToast('Document downloaded.') }}
          onDownloadPdf={() => { downloadCertPdf(viewing); showToast('PDF record downloaded.') }}
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
            <option value="">All employees ({allOwners.filter(([n]) => n !== UNASSIGNED).length})</option>
            {allOwners.map(([name, ownerCerts]) => {
              const hasIssues = ownerCerts.some(c => c.status === 'expired' || c.status === 'expiring')
              return (
                <option key={name} value={name}>
                  {name} — {ownerCerts.length} cert{ownerCerts.length !== 1 ? 's' : ''}{hasIssues ? ' (needs attention)' : ''}
                </option>
              )
            })}
          </select>
          {selectedOwner && (
            <button onClick={() => setSelectedOwner('')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
              background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif'
            }}><X size={13} /> Clear</button>
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
            const isUnassigned = ownerName === UNASSIGNED
            const isOpen = expandedOwners[ownerName] !== false
            const ownerExpired  = ownerCerts.filter(c => c.status === 'expired').length
            const ownerExpiring = ownerCerts.filter(c => c.status === 'expiring').length
            const ownerValid    = ownerCerts.filter(c => c.status === 'valid').length
            const initials = ownerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

            return (
              <div key={ownerName} className="card" style={{
                padding: 0, overflow: 'hidden',
                ...(isUnassigned ? { border: '1px dashed #D1D5DB', boxShadow: 'none' } : {})
              }}>
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
                  {isUnassigned ? (
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: '#F3F4F6', border: '1px solid #E5E7EB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <UserX size={17} color="#9CA3AF" />
                    </div>
                  ) : (
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, boxShadow: '0 2px 6px rgba(124,58,237,0.3)'
                    }}>
                      {initials}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isUnassigned ? '#6B7280' : '#111827' }}>
                      {ownerName}
                      {isUnassigned && <span style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', marginLeft: 8 }}>No employee linked — use ⋮ → Assign</span>}
                    </div>
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
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {c.cert_name}
                              {c.doc_url && <Paperclip size={12} color="#9CA3AF" />}
                            </div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              {c.issuing_body && <span>{c.issuing_body}</span>}
                              {c.issued_date  && <span>Issued {c.issued_date}</span>}
                              {c.expiry_date  && <span>Expires {c.expiry_date}</span>}
                            </div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: daysColor(days), fontFamily: 'var(--mono)', flexShrink: 0 }}>
                            {daysLabel(days)}
                          </div>
                          <StatusPill status={c.status} />
                          {menuFor(c)}
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
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {certs.map(c => {
                const days = daysUntil(c.expiry_date)
                return (
                  <tr key={c.id}>
                    <td><OwnerName cert={c} style={{ fontWeight: 600, color: '#111827' }} /></td>
                    <td style={{ fontWeight: 500, color: '#111827' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {c.cert_name}
                        {c.doc_url && <Paperclip size={12} color="#9CA3AF" />}
                      </span>
                    </td>
                    <td style={{ color: '#6B7280', fontFamily: 'var(--mono)', fontSize: 12 }}>{c.issuing_body}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#374151' }}>{c.expiry_date}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: daysColor(days) }}>
                      {days === null ? '—' : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                    </td>
                    <td><StatusPill status={c.status} /></td>
                    <td>{menuFor(c)}</td>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusPill status={c.status} />
                  {menuFor(c)}
                </div>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Employee</span>
                <OwnerName cert={c} style={{ fontSize: 13, color: '#374151', fontWeight: 500 }} />
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Issuing body</span>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{c.issuing_body}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Expires</span>
                <span style={{ fontSize: 13, color: daysColor(days), fontWeight: 700 }}>
                  {c.expiry_date} ({daysLabel(days)})
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}