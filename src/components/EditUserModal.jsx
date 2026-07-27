import { useState } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'

export default function EditUserModal({ user, onClose, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    role: user.role || 'employee',
    department: user.department || '',
    is_active: user.is_active ?? true,
  })

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.full_name || !form.email) {
      setError('Please fill in name and email.')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('users')
      .update({
        full_name: form.full_name,
        email: form.email,
        role: form.role,
        department: form.department,
        is_active: form.is_active
      })
      .eq('id', user.id)

    if (error) { setError(error.message); setLoading(false); return }

    await supabase.from('audit_logs').insert({
      action: 'user_updated',
      table_name: 'users',
      after_state: { user: form.full_name, role: form.role }
    })

    setLoading(false)
    onSaved()
    onClose()
  }

  async function handleDeactivate() {
    const action = form.is_active ? 'deactivate' : 'reactivate'
    if (!confirm(`${action} ${user.full_name}?`)) return
    setLoading(true)
    await supabase.from('users').update({ is_active: !form.is_active }).eq('id', user.id)
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
    <Modal title="Edit user" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Full name *</label>
          <input type="text" value={form.full_name}
            onChange={e => set('full_name', e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Email *</label>
          <input type="email" value={form.email}
            onChange={e => set('email', e.target.value)} style={inputStyle} />
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
            <input type="text" value={form.department}
              onChange={e => set('department', e.target.value)} style={inputStyle} />
          </div>
        </div>

        {error && (
          <div style={{
            background: 'var(--red-dim)', border: '0.5px solid var(--red)',
            borderRadius: 6, padding: '10px 12px', fontSize: 13, color: '#FCA5A5'
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 4 }}>
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={loading}
            style={{
              padding: '8px 14px', borderRadius: 6,
              border: `0.5px solid ${form.is_active ? 'var(--red)' : 'var(--green)'}`,
              background: form.is_active ? 'var(--red-dim)' : 'var(--green-dim)',
              color: form.is_active ? '#FCA5A5' : '#6EE7B7',
              fontSize: 13, cursor: 'pointer', opacity: loading ? 0.6 : 1
            }}>
            {form.is_active ? 'Deactivate' : 'Reactivate'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}
              disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}