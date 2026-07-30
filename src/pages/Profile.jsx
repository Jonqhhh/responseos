import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'

const roleConfig = {
  admin:      { color: '#6B4EFF', bg: '#EEF0FF', border: '#C7C0FF' },
  supervisor: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  employee:   { color: '#6B7280', bg: '#F3F4F8', border: '#E4E6EF' },
  auditor:    { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
}

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ full_name: '', email: '', department: '' })
  const [passwordForm, setPasswordForm] = useState({ new_password: '', confirm_password: '' })

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

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }
  function setPassword(field, value) { setPasswordForm(prev => ({ ...prev, [field]: value })) }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    const { error } = await supabase
      .from('users').update({ full_name: form.full_name, department: form.department }).eq('id', user.id)
    if (error) { setError(error.message); setSaving(false); return }
    setSuccess('Profile updated successfully.')
    setSaving(false)
  }

  async function handlePasswordChange() {
    if (passwordForm.new_password !== passwordForm.confirm_password) { setError('Passwords do not match.'); return }
    if (passwordForm.new_password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setChangingPassword(true)
    setError(null)
    setSuccess(null)
    const { error } = await supabase.auth.updateUser({ password: passwordForm.new_password })
    if (error) { setError(error.message); setChangingPassword(false); return }
    setSuccess('Password changed successfully.')
    setPasswordForm({ new_password: '', confirm_password: '' })
    setChangingPassword(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    borderRadius: '8px', border: '1px solid #E4E6EF',
    background: '#fff', color: '#0F1117',
    fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none',
    transition: 'border-color .12s', boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
  }
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#0F1117', marginBottom: 6, display: 'block' }

  if (loading) return <div style={{ padding: '24px 32px', color: '#6B7280' }}>Loading...</div>

  const cfg = roleConfig[user?.role] || roleConfig.employee
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      <PageHeader title="My profile" subtitle="Manage your account details and password." />

      {/* Avatar card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, borderTop: `3px solid ${cfg.color}` }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: cfg.bg, color: cfg.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 800, flexShrink: 0,
          border: `2px solid ${cfg.border}`
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0F1117', marginBottom: 6 }}>
            {user?.full_name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`
            }}>
              {user?.role}
            </span>
            {user?.department && (
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{user.department}</span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#059669', fontWeight: 600, marginLeft: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Success / error */}
      {success && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#059669', fontWeight: 500 }}>
          ✓ {success}
        </div>
      )}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* Profile form */}
      <div className="card">
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1117', marginBottom: 20 }}>Personal information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#6B4EFF'} onBlur={e => e.target.style.borderColor = '#E4E6EF'} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={form.email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed', background: '#F8F9FC' }} />
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: 500 }}>Email cannot be changed. Contact your admin.</div>
          </div>
          <div>
            <label style={labelStyle}>Department</label>
            <input type="text" value={form.department} onChange={e => set('department', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#6B4EFF'} onBlur={e => e.target.style.borderColor = '#E4E6EF'} />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <input type="text" value={user?.role} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed', background: '#F8F9FC' }} />
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: 500 }}>Role can only be changed by an admin.</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Password form */}
      <div className="card">
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1117', marginBottom: 20 }}>Change password</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>New password</label>
            <input type="password" value={passwordForm.new_password} onChange={e => setPassword('new_password', e.target.value)}
              placeholder="Min. 6 characters" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#6B4EFF'} onBlur={e => e.target.style.borderColor = '#E4E6EF'} />
          </div>
          <div>
            <label style={labelStyle}>Confirm new password</label>
            <input type="password" value={passwordForm.confirm_password} onChange={e => setPassword('confirm_password', e.target.value)}
              placeholder="Repeat new password" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#6B4EFF'} onBlur={e => e.target.style.borderColor = '#E4E6EF'} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handlePasswordChange}
              disabled={changingPassword || !passwordForm.new_password}
              style={{ opacity: changingPassword || !passwordForm.new_password ? 0.5 : 1 }}>
              {changingPassword ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </div>
      </div>

      {/* Account info */}
      <div className="card" style={{ background: '#F8F9FC' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1117', marginBottom: 14 }}>Account info</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'User ID', value: `${user?.id?.substring(0, 16)}...`, mono: true },
            { label: 'Account status', value: user?.is_active ? '● Active' : '● Inactive', color: user?.is_active ? '#059669' : '#DC2626' },
            { label: 'Platform', value: 'ResponseOS v1.0' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: '#6B7280', fontWeight: 500 }}>{row.label}</span>
              <span style={{ color: row.color || '#0F1117', fontFamily: row.mono ? 'var(--mono)' : 'inherit', fontSize: row.mono ? 12 : 13, fontWeight: 500 }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}