import { useState, useEffect } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'

export default function AddCertificationModal({ onClose, onSaved }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    user_id: '',
    cert_name: '',
    issuing_body: '',
    issued_date: '',
    expiry_date: '',
  })

  useEffect(() => {
    supabase.from('users').select('id, full_name').order('full_name')
      .then(({ data }) => setUsers(data || []))
  }, [])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.user_id || !form.cert_name || !form.expiry_date) {
      setError('Please fill in employee, certification name, and expiry date.')
      return
    }
    setLoading(true)
    setError(null)

    const today = new Date()
    const expiry = new Date(form.expiry_date)
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    const status = daysLeft <= 0 ? 'expired' : daysLeft <= 30 ? 'expiring' : 'valid'

    const { error } = await supabase.from('certifications').insert({
      ...form,
      status
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    onSaved()
    onClose()
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    borderRadius: 6, border: '0.5px solid var(--border2)',
    background: 'var(--surface2)', color: 'var(--text)',
    fontSize: 13, fontFamily: 'var(--font)', outline: 'none'
  }

  const labelStyle = {
    fontSize: 12, color: 'var(--text2)', marginBottom: 5, display: 'block'
  }

  return (
    <Modal title="Add certification" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div>
          <label style={labelStyle}>Employee *</label>
          <select value={form.user_id} onChange={e => set('user_id', e.target.value)}
            style={{ ...inputStyle }}>
            <option value="">Select employee...</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Certification name *</label>
          <input type="text" placeholder="e.g. OSHA 30-Hour"
            value={form.cert_name} onChange={e => set('cert_name', e.target.value)}
            style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Issuing body</label>
          <input type="text" placeholder="e.g. OSHA, NERC, BSI"
            value={form.issuing_body} onChange={e => set('issuing_body', e.target.value)}
            style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Issue date</label>
            <input type="date" value={form.issued_date}
              onChange={e => set('issued_date', e.target.value)}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Expiry date *</label>
            <input type="date" value={form.expiry_date}
              onChange={e => set('expiry_date', e.target.value)}
              style={inputStyle} />
          </div>
        </div>

        {error && (
          <div style={{
            background: 'var(--red-dim)', border: '0.5px solid var(--red)',
            borderRadius: 6, padding: '10px 12px', fontSize: 13, color: '#FCA5A5'
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}
            disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Saving...' : 'Save certification'}
          </button>
        </div>
      </div>
    </Modal>
  )
}