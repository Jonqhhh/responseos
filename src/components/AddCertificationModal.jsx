import { useState } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'

export default function AddCertificationModal({ onClose, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [docUrl, setDocUrl] = useState(null)
  const [docName, setDocName] = useState(null)
  const [form, setForm] = useState({
    user_id: '',
    cert_name: '',
    issuing_body: '',
    issued_date: '',
    expiry_date: '',
    status: 'valid',
  })
  const [users, setUsers] = useState([])

  useState(() => {
    supabase.from('users').select('id, full_name').eq('is_active', true).order('full_name').then(({ data }) => {
      setUsers(data || [])
    })
  }, [])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10MB.'); return }

    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('certifications')
      .upload(fileName, file, { upsert: true })

    if (uploadError) { setError(uploadError.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage
      .from('certifications')
      .getPublicUrl(fileName)

    setDocUrl(publicUrl)
    setDocName(file.name)
    setUploading(false)
  }

  async function handleSave() {
    if (!form.user_id || !form.cert_name || !form.expiry_date) {
      setError('Please fill in employee, certification name, and expiry date.')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('certifications').insert({
      ...form,
      doc_url: docUrl
    })

    if (error) { setError(error.message); setLoading(false); return }

    await supabase.from('audit_logs').insert({
      action: 'certification_added',
      table_name: 'certifications',
      after_state: { cert: form.cert_name, user: form.user_id }
    })

    setLoading(false)
    onSaved()
    onClose()
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    borderRadius: 6, border: '1px solid #E4E6EF',
    background: '#fff', color: '#0F1117',
    fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none'
  }
  const labelStyle = { fontSize: 12, color: '#6B7280', marginBottom: 5, display: 'block', fontWeight: 600 }

  return (
    <Modal title="Add certification" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div>
          <label style={labelStyle}>Employee *</label>
          <select value={form.user_id} onChange={e => set('user_id', e.target.value)} style={inputStyle}>
            <option value="">Select employee...</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Certification name *</label>
          <input type="text" placeholder="e.g. OSHA 30-Hour"
            value={form.cert_name} onChange={e => set('cert_name', e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Issuing body</label>
          <input type="text" placeholder="e.g. OSHA, ISO, NERC"
            value={form.issuing_body} onChange={e => set('issuing_body', e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Issue date</label>
            <input type="date" value={form.issued_date} onChange={e => set('issued_date', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Expiry date *</label>
            <input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
            <option value="valid">Valid</option>
            <option value="expiring">Expiring soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* File upload */}
        <div>
          <label style={labelStyle}>Attach certificate document</label>
          <div style={{
            border: '2px dashed #E4E6EF', borderRadius: 8, padding: '16px',
            textAlign: 'center', background: '#F8F9FC', transition: 'all .12s'
          }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#6B4EFF'}
            onMouseOut={e => e.currentTarget.style.borderColor = '#E4E6EF'}
          >
            {docUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#EEF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📄</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1117' }}>{docName}</div>
                  <div style={{ fontSize: 11, color: '#059669', fontWeight: 500 }}>✓ Uploaded successfully</div>
                </div>
                <button onClick={() => { setDocUrl(null); setDocName(null) }}
                  style={{ marginLeft: 8, padding: '3px 8px', borderRadius: 4, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, cursor: 'pointer' }}>
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
                  {uploading ? 'Uploading...' : 'Drop your certificate here or click to browse'}
                </div>
                <label style={{
                  padding: '7px 16px', background: '#6B4EFF', color: '#fff',
                  borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  opacity: uploading ? 0.6 : 1
                }}>
                  {uploading ? 'Uploading...' : 'Browse files'}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileUpload}
                    style={{ display: 'none' }} disabled={uploading} />
                </label>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>PDF, JPG, PNG, DOC — max 10MB</div>
              </>
            )}
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '10px 12px', fontSize: 13, color: '#DC2626' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}
            disabled={loading || uploading} style={{ opacity: loading || uploading ? 0.6 : 1 }}>
            {loading ? 'Saving...' : 'Add certification'}
          </button>
        </div>
      </div>
    </Modal>
  )
}