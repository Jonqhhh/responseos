import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import {
  Upload, X, Search, FileText, Paperclip, FolderOpen, Lock, Eye, Globe,
  MoreVertical, ExternalLink, Download, Trash2,
  ScrollText, ClipboardCheck, ShieldCheck, SearchCheck, Scale, Folder
} from 'lucide-react'

// Same neutral palette as Training Tracker
const N = { text: '#111827', sub: '#6B7280', muted: '#9CA3AF', border: '#E5E7EB', soft: '#F9FAFB', iconBg: '#F3F4F6', icon: '#4B5563', accent: '#7C3AED', accentBg: '#F5F3FF', accentBorder: '#DDD6FE' }
const DANGER = { color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' }

const SUPER_EMAILS = ['jlane@responseos.net', 'hseals@responseos.net']

const CATEGORIES = [
  { id: 'All',           Icon: Folder },
  { id: 'Policy',        Icon: ScrollText },
  { id: 'Audit',         Icon: ClipboardCheck },
  { id: 'Certification', Icon: ShieldCheck },
  { id: 'Inspection',    Icon: SearchCheck },
  { id: 'Legal',         Icon: Scale },
  { id: 'General',       Icon: FileText },
]
const catIcon = id => (CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]).Icon

const ACCESS = {
  admin:   { label: 'Admin only',      Icon: Lock },
  auditor: { label: 'Admin + Auditor', Icon: Eye },
  all:     { label: 'All users',       Icon: Globe },
}

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function downloadFile(doc) {
  try {
    const res = await fetch(doc.file_url)
    if (!res.ok) throw new Error('fetch failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.file_name || doc.name || 'document'
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return true
  } catch {
    window.open(doc.file_url, '_blank', 'noopener,noreferrer')
    return false
  }
}

/* ---------- Three-dot row menu ---------- */

function RowMenu({ items }) {
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const menuRef = useRef(null)

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
    const MW = 190, MH = items.length * 38 + 14
    const openUp = r.bottom + MH + 8 > window.innerHeight
    setPos({ top: openUp ? r.top - MH - 4 : r.bottom + 4, left: Math.max(8, r.right - MW) })
  }

  return (
    <>
      <button ref={btnRef} type="button" onClick={toggle} aria-label="Document actions" title="Actions"
        style={{
          width: 30, height: 30, borderRadius: 7, flexShrink: 0,
          border: `1px solid ${pos ? N.accent : N.border}`,
          background: pos ? N.accentBg : '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s'
        }}
        onMouseOver={e => { if (!pos) e.currentTarget.style.borderColor = '#C4B5FD' }}
        onMouseOut={e => { if (!pos) e.currentTarget.style.borderColor = N.border }}
      >
        <MoreVertical size={15} color={pos ? N.accent : N.sub} />
      </button>

      {pos && (
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left, width: 190, zIndex: 1000,
          background: '#fff', border: `1px solid ${N.border}`, borderRadius: 10, padding: 5,
          boxShadow: '0 12px 32px rgba(17,24,39,0.14)'
        }}>
          {items.map(({ icon: Icon, label, fn, danger, divider }) => (
            <div key={label}>
              {divider && <div style={{ height: 1, background: '#F3F4F6', margin: '4px 2px' }} />}
              <button type="button"
                onClick={e => { e.stopPropagation(); setPos(null); fn() }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 7, border: 'none', background: 'transparent',
                  fontSize: 13, fontWeight: 500, color: danger ? DANGER.color : '#374151',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left'
                }}
                onMouseOver={e => { e.currentTarget.style.background = danger ? DANGER.bg : N.accentBg; e.currentTarget.style.color = danger ? DANGER.color : N.accent }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = danger ? DANGER.color : '#374151' }}
              >
                <Icon size={15} strokeWidth={2} />
                {label}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ---------- Page ---------- */

export default function DocumentVault() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState('All')
  const [toast, setToast] = useState(null)
  const [user, setUser] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', category: 'General', access_level: 'admin' })
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadUser()
    loadDocuments()
  }, [])

  async function loadUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(profile)
    }
  }

  async function loadDocuments() {
    setLoading(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    let isDemo = false
    if (authUser) {
      const { data: profile } = await supabase.from('users').select('is_demo').eq('id', authUser.id).single()
      isDemo = profile?.is_demo === true
    }
    const { data } = await supabase
      .from('documents')
      .select('*, users(full_name)')
      .eq('is_demo', isDemo)
      .order('created_at', { ascending: false })
    setDocuments(data || [])
    setLoading(false)
  }

  function showToast(message, type = 'success') {
    setToast({ message, type, id: Date.now() })
  }

  function pickFile(f) {
    if (!f) return
    if (f.size > 50 * 1024 * 1024) { showToast('File is over 50MB.', 'error'); return }
    setFile(f)
    if (!form.name) setForm(p => ({ ...p, name: f.name.replace(/\.[^.]+$/, '') }))
  }

  function closeUpload() {
    setShowUpload(false)
    setFile(null)
    setForm({ name: '', description: '', category: 'General', access_level: 'admin' })
  }

  async function handleUpload() {
    if (!form.name || !file) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('documents').upload(fileName, file, { upsert: true })

    if (uploadError) { showToast(uploadError.message, 'error'); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName)

    const { error } = await supabase.from('documents').insert({
      name: form.name,
      description: form.description,
      category: form.category,
      access_level: form.access_level,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      uploaded_by: user?.id,
      is_demo: user?.is_demo === true
    })

    if (error) { showToast(error.message, 'error'); setUploading(false); return }

    setUploading(false)
    closeUpload()
    await loadDocuments()
    showToast('Document uploaded successfully.')
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    setDeleting(doc.id)
    const { error } = await supabase.from('documents').delete().eq('id', doc.id)
    if (error) { setDeleting(null); showToast(error.message, 'error'); return }
    await loadDocuments()
    setDeleting(null)
    showToast('Document deleted.', 'error')
  }

  async function handleDownload(doc) {
    const ok = await downloadFile(doc)
    if (ok) showToast('Document downloaded.')
  }

  const isAdmin = ['admin', 'supervisor'].includes(String(user?.role || '').toLowerCase())
    || SUPER_EMAILS.includes(String(user?.email || '').toLowerCase())

  const filtered = documents.filter(d => {
    const matchCat = category === 'All' || d.category === category
    const q = search.toLowerCase()
    const matchSearch = !q || d.name?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  function menuItems(doc) {
    const items = [
      { icon: ExternalLink, label: 'Open', fn: () => window.open(doc.file_url, '_blank', 'noopener,noreferrer') },
      { icon: Download,     label: 'Download', fn: () => handleDownload(doc) },
    ]
    if (isAdmin) items.push({ icon: Trash2, label: 'Delete', fn: () => handleDelete(doc), danger: true, divider: true })
    return items
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: `1px solid ${N.border}`, background: '#fff', color: N.text,
    fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color .12s'
  }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: N.sub, marginBottom: 5, display: 'block' }
  const focusOn = e => e.target.style.borderColor = N.accent
  const focusOff = e => e.target.style.borderColor = N.border
  const chip = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: N.iconBg, color: N.sub, border: `1px solid ${N.border}`, whiteSpace: 'nowrap' }

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Document vault"
        subtitle="Secure storage for compliance policies, audit reports, and certifications."
        action={isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <Upload size={14} strokeWidth={2} /> Upload document
          </button>
        )}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total documents', value: documents.length,                                         Icon: FolderOpen },
          { label: 'Policies',        value: documents.filter(d => d.category === 'Policy').length,        Icon: ScrollText },
          { label: 'Audit reports',   value: documents.filter(d => d.category === 'Audit').length,         Icon: ClipboardCheck },
          { label: 'Certifications',  value: documents.filter(d => d.category === 'Certification').length, Icon: ShieldCheck },
        ].map(s => (
          <div key={s.label} className="card">
            <div style={{ width: 36, height: 36, borderRadius: 9, background: N.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <s.Icon size={16} color={N.accent} strokeWidth={2} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: N.text, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: N.muted, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="card" style={{ borderTop: `3px solid ${N.accent}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: N.text }}>Upload document</div>
            <button onClick={closeUpload} style={{ background: 'none', border: 'none', cursor: 'pointer', color: N.muted }}><X size={18} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Drop zone */}
            <div>
              <label style={labelStyle}>File *</label>
              <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={e => { pickFile(e.target.files[0]); e.target.value = '' }} />
              <div
                onClick={() => !file && fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]) }}
                style={{
                  border: `2px dashed ${dragOver ? N.accent : N.border}`, borderRadius: 10, padding: 20,
                  textAlign: 'center', background: dragOver ? N.accentBg : N.soft,
                  cursor: file ? 'default' : 'pointer', transition: 'all .12s'
                }}
              >
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fff', border: `1px solid ${N.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={17} color={N.accent} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: N.text }}>{file.name}</div>
                      <div style={{ fontSize: 11, color: N.sub }}>{formatBytes(file.size)}</div>
                    </div>
                    <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}
                      style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: `1px solid ${N.border}`, background: '#fff', color: N.sub, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      <X size={12} /> Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: `1px solid ${N.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <Paperclip size={18} color={N.icon} />
                    </div>
                    <div style={{ fontSize: 13, color: N.text, fontWeight: 600, marginBottom: 2 }}>
                      Drop a file here or <span style={{ color: N.accent }}>browse</span>
                    </div>
                    <div style={{ fontSize: 11, color: N.muted }}>PDF, DOC, DOCX, XLS, PNG, JPG — max 50MB</div>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Document name *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. FERC Compliance Policy 2026" style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                  {CATEGORIES.filter(c => c.id !== 'All').map(c => <option key={c.id}>{c.id}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Description</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of this document" style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
              </div>
              <div>
                <label style={labelStyle}>Access level</label>
                <select value={form.access_level} onChange={e => setForm(p => ({ ...p, access_level: e.target.value }))} style={inputStyle}>
                  <option value="admin">Admin only</option>
                  <option value="auditor">Admin + Auditor</option>
                  <option value="all">All users</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={closeUpload}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload}
                disabled={uploading || !form.name || !file}
                style={{ opacity: uploading || !form.name || !file ? 0.5 : 1 }}>
                {uploading ? 'Uploading...' : 'Upload document →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} color={N.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..."
            style={{ ...inputStyle, paddingLeft: 32 }} onFocus={focusOn} onBlur={focusOff}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => {
            const on = category === c.id
            return (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${on ? N.accent : N.border}`,
                background: on ? N.accentBg : '#fff',
                color: on ? N.accent : N.sub,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <c.Icon size={13} color={on ? N.accent : N.muted} strokeWidth={2} />
                {c.id === 'All' ? 'All documents' : c.id}
              </button>
            )
          })}
        </div>
      </div>

      {/* Document list */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', color: N.muted, padding: 40 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <FolderOpen size={40} color={N.accentBorder} strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: N.sub, marginBottom: 4 }}>
            {documents.length === 0 ? 'No documents yet' : 'No matching documents'}
          </div>
          <div style={{ fontSize: 13, color: N.muted }}>
            {documents.length > 0 ? 'Try a different search or category.' : isAdmin ? 'Click Upload document to add your first file.' : 'No documents have been uploaded yet.'}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Category</th>
                <th>Access</th>
                <th>Uploaded by</th>
                <th>Date</th>
                <th>Size</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => {
                const CatI = catIcon(doc.category)
                const acc = ACCESS[doc.access_level] || ACCESS.all
                return (
                  <tr key={doc.id} style={{ opacity: deleting === doc.id ? 0.5 : 1 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: N.iconBg, border: `1px solid ${N.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={16} color={N.icon} strokeWidth={2} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 13, color: N.text, textDecoration: 'none' }}
                            onMouseOver={e => e.currentTarget.style.color = N.accent}
                            onMouseOut={e => e.currentTarget.style.color = N.text}>
                            {doc.name}
                          </a>
                          {doc.description && <div style={{ fontSize: 11, color: N.muted, marginTop: 2 }}>{doc.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={chip}><CatI size={12} strokeWidth={2} /> {doc.category}</span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: N.sub, fontWeight: 500, whiteSpace: 'nowrap' }}>
                        <acc.Icon size={13} color={doc.access_level === 'admin' ? N.accent : N.muted} strokeWidth={2} />
                        {acc.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: N.sub }}>{doc.users?.full_name || '—'}</td>
                    <td style={{ fontSize: 12, color: N.sub, fontFamily: 'var(--mono)' }}>{formatDate(doc.created_at)}</td>
                    <td style={{ fontSize: 12, color: N.sub, fontFamily: 'var(--mono)' }}>{formatBytes(doc.file_size)}</td>
                    <td><RowMenu items={menuItems(doc)} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}