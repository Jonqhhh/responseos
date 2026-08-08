import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'

const roleConfig = {
  admin:      { color: '#6B4EFF', bg: '#EEF0FF', border: '#C7C0FF' },
  supervisor: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  employee:   { color: '#6B7280', bg: '#F3F4F8', border: '#E4E6EF' },
  auditor:    { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
}

function CertSection({ userId }) {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    supabase.from('certifications').select('*')
      .eq('user_id', userId).order('expiry_date').then(({ data }) => {
        setCerts(data || [])
        setLoading(false)
      })
  }, [userId])

  if (loading) return null

  if (certs.length === 0) return (
    <div className="card" style={{ background: '#F8F9FC' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1117', marginBottom: 8 }}>My certifications</div>
      <div style={{ fontSize: 13, color: '#9CA3AF' }}>No certifications on file yet.</div>
    </div>
  )

  return (
    <div className="card">
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1117', marginBottom: 16 }}>My certifications</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {certs.map(c => {
          const days = Math.ceil((new Date(c.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
          const color  = c.status === 'expired' ? '#DC2626' : c.status === 'expiring' ? '#D97706' : '#059669'
          const bg     = c.status === 'expired' ? '#FEF2F2' : c.status === 'expiring' ? '#FFFBEB' : '#ECFDF5'
          const border = c.status === 'expired' ? '#FECACA' : c.status === 'expiring' ? '#FDE68A' : '#A7F3D0'
          return (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px', borderRadius: 10,
              background: bg, border: `1px solid ${border}`
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1117', marginBottom: 2 }}>{c.cert_name}</div>
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
                  {c.issuing_body} · Expires {c.expiry_date}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, padding: '2px 8px', borderRadius: 99, background: '#fff', border: `1px solid ${border}`, marginBottom: 4 }}>
                  {c.status.toUpperCase()}
                </div>
                <div style={{ fontSize: 11, color, fontWeight: 600 }}>
                  {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                </div>
              </div>
              {c.doc_url && (
                <a href={c.doc_url} target="_blank" rel="noreferrer"
                  style={{
                    padding: '6px 10px', borderRadius: 6, border: '1px solid #E4E6EF',
                    background: '#fff', color: '#6B4EFF', fontSize: 12, fontWeight: 600,
                    textDecoration: 'none', flexShrink: 0
                  }}>
                  📄 View
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [form, setForm] = useState({ full_name: '', email: '', department: '' })
  const [passwordForm, setPasswordForm] = useState({ new_password: '', confirm_password: '' })
  const fileInputRef = useRef(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('users').select('*').eq('id', authUser.id).single()
        setUser(profile)
        setAvatarUrl(profile?.avatar_url || null)
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

  async function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5MB.'); return }
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return }

    setUploadingPhoto(true)
    setError(null)
    setSuccess(null)

    const ext = file.name.split('.').pop()
    const fileName = `${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars').upload(fileName, file, { upsert: true })

    if (uploadError) { setError(uploadError.message); setUploadingPhoto(false); return }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    const urlWithCache = `${publicUrl}?t=${Date.now()}`

    await supabase.from('users').update({ avatar_url: urlWithCache }).eq('id', user.id)
    setAvatarUrl(urlWithCache)
    setSuccess('Profile photo updated!')
    setUploadingPhoto(false)
  }

  async function handleRemovePhoto() {
    setUploadingPhoto(true)
    await supabase.from('users').update({ avatar_url: null }).eq('id', user.id)
    setAvatarUrl(null)
    setSuccess('Photo removed.')
    setUploadingPhoto(false)
  }

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
      <PageHeader title="My profile" subtitle="Manage your account details, photo, and password." />

      {/* Avatar card */}
      <div className="card" style={{ borderTop: `3px solid ${cfg.color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={user?.full_name}
                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${cfg.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: cfg.bg, color: cfg.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 800, border: `2px solid ${cfg.border}`
              }}>{initials}</div>
            )}
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
              style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 24, height: 24, borderRadius: '50%',
                background: '#6B4EFF', color: '#fff', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, cursor: 'pointer', fontWeight: 700,
                boxShadow: '0 2px 6px rgba(107,78,255,0.4)'
              }}>
              {uploadingPhoto ? '…' : '+'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={handlePhotoUpload} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F1117', marginBottom: 6 }}>{user?.full_name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                {user?.role}
              </span>
              {user?.department && <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{user.department}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                Active
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #6B4EFF', background: '#EEF0FF', color: '#6B4EFF', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', opacity: uploadingPhoto ? 0.6 : 1 }}>
              {uploadingPhoto ? 'Uploading...' : '↑ Upload photo'}
            </button>
            {avatarUrl && (
              <button onClick={handleRemovePhoto} disabled={uploadingPhoto}
                style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #E4E6EF', background: '#fff', color: '#9CA3AF', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Remove photo
              </button>
            )}
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12, fontWeight: 500 }}>
          JPG, PNG or GIF · Max 5MB · Click the + button or Upload photo
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

      {/* Certifications */}
      <CertSection userId={user?.id} />

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
