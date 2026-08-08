import { useState } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'

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
    setLoading(true)
    setError(null)

    // create auth account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // create profile in public.users
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      full_name: form.full_name,
      email: form.email,
      role: form.role,
      department: form.department,
      is_active: true
    })

    if (profileError) {
      setError(profileError.message)
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
  const labelStyle = { fontSize: 12, color: 'var(--text2)', marginBottom: 5, display: 'block' }

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
          <label style={labelStyle}>Password *</label>
          <input type="password" placeholder="Temporary password"
            value={form.password} onChange={e => set('password', e.target.value)}
            style={inputStyle} />
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
            background: 'var(--red-dim)', border: '0.5px solid var(--red)',
            borderRadius: 6, padding: '10px 12px', fontSize: 13, color: '#FCA5A5'
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
