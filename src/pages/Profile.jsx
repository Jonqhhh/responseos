import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    department: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: '',
  })

  useEffect(() => {
    async function loadProfile() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('users').select('*').eq('id', authUser.id).single()
        setUser(profile)
        setForm({
          full_name: profile?.full_name || '',
          email: profile?.email || '',
          department: profile?.department || '',
        })
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function setPassword(field, value) {
    setPasswordForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(null)

    const { error } = await supabase
      .from('users')
      .update({
        full_name: form.full_name,
        department: form.department,
      })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'profile_updated',
      table_name: 'users',
      after_state: { user: form.full_name }
    })

    setSuccess('Profile updated successfully.')
    setSaving(false)
  }

  async function handlePasswordChange() {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    if (passwordForm.new_password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setChangingPassword(true)
    setError(null)
    setSuccess(null)

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.new_password
    })

    if (error) {
      setError(error.message)
      setChangingPassword(false)
      return
    }

    setSuccess('Password changed successfully.')
    setPasswordForm({ new_password: '', confirm_password: '' })
    setChangingPassword(false)
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    borderRadius: 6, border: '0.5px solid var(--border2)',
    background: 'var(--surface2)', color: 'var(--text)',
    fontSize: 13, fontFamily: 'var(--font)', outline: 'none'
  }
  const labelStyle = { fontSize: 12, color: 'var(--text2)', marginBottom: 5, display: 'block' }

  if (loading) return (
    <div style={{ padding: '24px 28px', color: 'var(--text2)' }}>Loading...</div>
  )

  const roleColor = {
    admin:      { bg: 'var(--blue-dim)',  text: '#93C5FD' },
    supervisor: { bg: 'var(--green-dim)', text: '#6EE7B7' },
    employee:   { bg: 'var(--surface3)', text: 'var(--text2)' },
    auditor:    { bg: 'var(--amber-dim)', text: '#FCD34D' },
  }

  return (
    <div className="page-wrap" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
      <PageHeader
        title="My profile"
        subtitle="Manage your account details and password."
      />

      {/* Avatar + role */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--blue-dim)', color: '#93C5FD',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 600, flexShrink: 0
        }}>
          {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            {user?.full_name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500,
              background: roleColor[user?.role]?.bg,
              color: roleColor[user?.role]?.text
            }}>
              {user?.role}
            </span>
            {user?.department && (
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{user?.department}</span>
            )}
          </div>
        </div>
      </div>

      {/* Success / error messages */}
      {success && (
        <div style={{
          background: 'var(--green-dim)', border: '0.5px solid var(--green)',
          borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#6EE7B7'
        }}>{success}</div>
      )}
      {error && (
        <div style={{
          background: 'var(--red-dim)', border: '0.5px solid var(--red)',
          borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#FCA5A5'
        }}>{error}</div>
      )}

      {/* Profile form */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 16 }}>
          Personal information
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input type="text" value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={form.email}
              disabled
              style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              Email cannot be changed. Contact your admin.
            </div>
          </div>
          <div>
            <label style={labelStyle}>Department</label>
            <input type="text" value={form.department}
              onChange={e => set('department', e.target.value)}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <input type="text" value={user?.role} disabled
              style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              Role can only be changed by an admin.
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSave}
              disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Password form */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 16 }}>
          Change password
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>New password</label>
            <input type="password" value={passwordForm.new_password}
              onChange={e => setPassword('new_password', e.target.value)}
              placeholder="Min. 6 characters"
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Confirm new password</label>
            <input type="password" value={passwordForm.confirm_password}
              onChange={e => setPassword('confirm_password', e.target.value)}
              placeholder="Repeat new password"
              style={inputStyle} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handlePasswordChange}
              disabled={changingPassword || !passwordForm.new_password}
              style={{ opacity: changingPassword || !passwordForm.new_password ? 0.6 : 1 }}>
              {changingPassword ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </div>
      </div>

      {/* Account info */}
      <div className="card" style={{ opacity: 0.7 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 12 }}>
          Account info
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text2)' }}>User ID</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
              {user?.id?.substring(0, 16)}...
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text2)' }}>Account status</span>
            <span style={{ color: user?.is_active ? 'var(--green)' : 'var(--red)', fontSize: 12 }}>
              {user?.is_active ? '● Active' : '● Inactive'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text2)' }}>Platform</span>
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>ResponseOS v1.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}