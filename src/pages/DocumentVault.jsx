import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'

const CATEGORIES = ['All', 'Policy', 'Audit', 'Certification', 'Inspection', 'Legal', 'General']

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const categoryColors = {
  Policy:      { color: '#6B4EFF', bg: '#EEF0FF', border: '#C7C0FF' },
  Audit:       { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  Certification: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  Inspection:  { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  Legal:       { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  General:     { color: '#6B7280', bg: '#F3F4F8', border: '#E4E6EF' },
}

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
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

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
    const { data } = await supabase
      .from('documents')
      .select('*, users(full_name)')
      .order('created_at', { ascending: false })
    setDocuments(data || [])
    setLoading(false)
  }

  function showToast(message, type = 'success') {
    setToast({ message, type, id: Date.now() })
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
      uploaded_by: user?.id
    })

    if (error) { showToast(error.message, 'error'); setUploading(false); return }

    setUploading(false)
    setShowUpload(false)
    setForm({ name: '', description: '', category: 'General', access_level: 'admin' })
    setFile(null)
    await loadDocuments()
    showToast('Document uploaded successfully.')
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    setDeleting(doc.id)
    await supabase.from('documents').delete().eq('id', doc.id)
    await loadDocuments()
    setDeleting(null)
    showToast('Document deleted.', 'error')
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'supervisor'
  const filtered = documents.filter(d => {
    const matchCat = category === 'All' || d.category === category
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 6,
    border: '1px solid #E4E6EF', background: '#fff', color: '#0F1117',
    fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none'
  }

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Document vault"
        subtitle="Secure storage for compliance policies, audit reports, and certifications."
        action={isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            + Upload document
          </button>
        )}
      />

      {/* Upload form */}
      {showUpload && (
        <div className="card" style={{ border: '1px solid #C7C0FF', borderTop: '3px solid #6B4EFF' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1117', marginBottom: 16 }}>Upload document</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 5, display: 'block' }}>Document name *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. FERC Compliance Policy 2026" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 5, display: 'block' }}>Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 5, display: 'block' }}>Description</label>
              <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of this document" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 5, display: 'block' }}>Access level</label>
              <select value={form.access_level} onChange={e => setForm(p => ({ ...p, access_level: e.target.value }))} style={inputStyle}>
                <option value="admin">Admin only</option>
                <option value="auditor">Admin + Auditor</option>
                <option value="all">All users</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 5, display: 'block' }}>File *</label>
              <div style={{
                border: '2px dashed #E4E6EF', borderRadius: 8, padding: '20px',
                textAlign: 'center', background: '#F8F9FC', cursor: 'pointer'
              }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#6B4EFF'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#E4E6EF'}
              >
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1117' }}>{file.name}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>{formatBytes(file.size)}</div>
                    </div>
                    <button onClick={() => setFile(null)} style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, cursor: 'pointer' }}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Click to browse or drag a file here</div>
                    <label style={{ padding: '7px 16px', background: '#6B4EFF', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Browse files
                      <input type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                    </label>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>PDF, DOC, DOCX, XLS, PNG, JPG — max 50MB</div>
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setShowUpload(false); setFile(null) }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload}
                disabled={uploading || !form.name || !file}
                style={{ opacity: uploading || !form.name || !file ? 0.5 : 1 }}>
                {uploading ? 'Uploading...' : 'Upload document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search documents..."
          style={{ ...inputStyle, width: 240, flex: 'none' }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              border: `1px solid ${category === c ? '#6B4EFF' : '#E4E6EF'}`,
              background: category === c ? '#EEF0FF' : '#fff',
              color: category === c ? '#6B4EFF' : '#6B7280',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif'
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total documents', value: documents.length, color: '#6B4EFF' },
          { label: 'Policies', value: documents.filter(d => d.category === 'Policy').length, color: '#6B4EFF' },
          { label: 'Audit reports', value: documents.filter(d => d.category === 'Audit').length, color: '#D97706' },
          { label: 'Certifications', value: documents.filter(d => d.category === 'Certification').length, color: '#059669' },
        ].map(s => (
          <div key={s.label} className="card">
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Document list */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>No documents yet</div>
          <div style={{ fontSize: 13 }}>{isAdmin ? 'Click + Upload document to add your first file.' : 'No documents have been uploaded yet.'}</div>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => {
                const cfg = categoryColors[doc.category] || categoryColors.General
                return (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📄</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0F1117' }}>{doc.name}</div>
                          {doc.description && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{doc.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {doc.category}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, textTransform: 'capitalize' }}>
                      {doc.access_level === 'admin' ? '🔒 Admin only' : doc.access_level === 'auditor' ? '👁 Admin + Auditor' : '🌐 All users'}
                    </td>
                    <td style={{ fontSize: 12, color: '#6B7280' }}>{doc.users?.full_name || '—'}</td>
                    <td style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--mono)' }}>{formatDate(doc.created_at)}</td>
                    <td style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--mono)' }}>{formatBytes(doc.file_size)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <a href={doc.file_url} target="_blank" rel="noreferrer"
                          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #E4E6EF', background: '#fff', color: '#6B4EFF', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                          View
                        </a>
                        {isAdmin && (
                          <button onClick={() => handleDelete(doc)} disabled={deleting === doc.id}
                            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: deleting === doc.id ? 0.5 : 1 }}>
                            {deleting === doc.id ? '...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
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