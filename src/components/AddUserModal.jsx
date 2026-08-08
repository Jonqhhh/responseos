import { useState } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export default function AddUserModal({ onClose, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    role: 'employee',
    department: '',
    password: '',
  })

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.full_name || !form.email || !form.password) {
      setError('Please fill in name, email, and password.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
          department: form.department,
        })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setLoading(false)
      onSaved('User created successfully.')
      onClose()
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    borderRadius: 6, border: '1px solid #E4E6EF',
    background: '#fff', color: '#0F1117',
    fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none'
  }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 5, display: 'block' }

  return (
    <Modal title="Add user" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Full name *</label>
          <input type="text" placeholder="e.g. Jane Smith"
            value={form.full_name} onChange={e => set('full_name', e.target.value)}
            style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Email *</label>
          <input type="email" placeholder="jane@responseos.com"
            value={form.email} onChange={e => set('email', e.target.value)}
            style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Temporary password *</label>
          <input type="password" placeholder="Min. 6 characters"
            value={form.password} onChange={e => set('password', e.target.value)}
            style={inputStyle} />
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
            The user can change this after logging in from their Profile page.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} style={inputStyle}>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="employee">Employee</option>
              <option value="auditor">Auditor</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Department</label>
            <input type="text" placeholder="e.g. Safety"
              value={form.department} onChange={e => set('department', e.target.value)}
              style={inputStyle} />
          </div>
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 6, padding: '10px 12px', fontSize: 13, color: '#DC2626'
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}
            disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Creating...' : 'Create user'}
          </button>
        </div>
      </div>
    </Modal>
  )
}