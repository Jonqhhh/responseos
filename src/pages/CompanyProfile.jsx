import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import { Building, Globe, Phone, MapPin, Upload, Save } from 'lucide-react'

const INDUSTRIES = [
  'Energy & Utilities', 'Oil & Gas', 'Healthcare', 'Manufacturing',
  'Construction', 'Logistics & Transportation', 'Government & Public Sector',
  'Financial Services', 'Other'
]

export default function CompanyProfile() {
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    name: '', industry: '', location: '', website: '', phone: '', logo_url: ''
  })

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    setLoading(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    const { data: prof } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    setUser(prof)
    const isDemo = prof?.is_demo === true
    const { data: company } = await supabase.from('company_profiles').select('*').eq('is_demo', isDemo).single()
    if (company) {
      setProfile(company)
      setForm({ name: company.name || '', industry: company.industry || '', location: company.location || '', website: company.website || '', phone: company.phone || '', logo_url: company.logo_url || '' })
    }
    setLoading(false)
  }

  function showToast(message, type = 'success') { setToast({ message, type, id: Date.now() }) }

  function setF(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showToast('Logo must be under 5MB.', 'error'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `company-logo-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
    if (error) { showToast(error.message, 'error'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    setF('logo_url', publicUrl)
    setUploading(false)
    showToast('Logo uploaded successfully.')
  }

  async function handleSave() {
    if (!form.name) { showToast('Company name is required.', 'error'); return }
    setSaving(true)
    const isDemo = user?.is_demo === true

    if (profile) {
      await supabase.from('company_profiles').update({
        ...form, updated_at: new Date().toISOString()
      }).eq('id', profile.id)
    } else {
      await supabase.from('company_profiles').insert({
        ...form, created_by: user?.id, is_demo: isDemo
      })
    }

    await loadProfile()
    setSaving(false)
    showToast('Company profile saved.')
  }

  const isAdmin = ['admin'].includes(user?.role)

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 9,
    border: '1px solid #E5E7EB', background: '#fff', color: '#111827',
    fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color .12s'
  }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '.04em' }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>
  )

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Company Profile"
        subtitle="Manage your organization's information and branding."
        action={
          isAdmin && (
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
              <Save size={14} strokeWidth={2} />
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          )
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>

        {/* Logo card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', alignSelf: 'flex-start' }}>Company logo</div>
          <div style={{
            width: 120, height: 120, borderRadius: 16,
            background: form.logo_url ? '#fff' : '#F5F3FF',
            border: '2px dashed #DDD6FE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0
          }}>
            {form.logo_url ? (
              <img src={form.logo_url} alt="Company logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Building size={40} color="#C4B5FD" strokeWidth={1.5} />
            )}
          </div>
          {isAdmin && (
            <>
              <label style={{
                padding: '8px 18px', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <Upload size={14} strokeWidth={2} />
                {uploading ? 'Uploading...' : 'Upload logo'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>
              <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>PNG, JPG or SVG · max 5MB</div>
              {form.logo_url && (
                <button onClick={() => setF('logo_url', '')} style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  Remove logo
                </button>
              )}
            </>
          )}

          {/* Preview card */}
          {(form.name || form.industry) && (
            <div style={{ width: '100%', marginTop: 8, padding: '14px 16px', background: '#F5F3FF', borderRadius: 10, border: '1px solid #DDD6FE' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Preview</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {form.logo_url ? (
                  <img src={form.logo_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'contain', background: '#fff', border: '1px solid #DDD6FE' }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building size={16} color="#fff" strokeWidth={2} />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{form.name || 'Company Name'}</div>
                  {form.industry && <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 500 }}>{form.industry}</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Details card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Company details</div>

          <div>
            <label style={labelStyle}>Company name *</label>
            <div style={{ position: 'relative' }}>
              <Building size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" value={form.name} onChange={e => setF('name', e.target.value)}
                placeholder="e.g. Gulf Coast Energy" disabled={!isAdmin}
                style={{ ...inputStyle, paddingLeft: 40 }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Industry</label>
            <select value={form.industry} onChange={e => setF('industry', e.target.value)} disabled={!isAdmin} style={inputStyle}>
              <option value="">Select industry...</option>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" value={form.location} onChange={e => setF('location', e.target.value)}
                placeholder="e.g. Houston, TX" disabled={!isAdmin}
                style={{ ...inputStyle, paddingLeft: 40 }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Website</label>
              <div style={{ position: 'relative' }}>
                <Globe size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="url" value={form.website} onChange={e => setF('website', e.target.value)}
                  placeholder="https://yourcompany.com" disabled={!isAdmin}
                  style={{ ...inputStyle, paddingLeft: 40 }}
                  onFocus={e => e.target.style.borderColor = '#7C3AED'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="tel" value={form.phone} onChange={e => setF('phone', e.target.value)}
                  placeholder="(713) 555-0100" disabled={!isAdmin}
                  style={{ ...inputStyle, paddingLeft: 40 }}
                  onFocus={e => e.target.style.borderColor = '#7C3AED'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
            </div>
          </div>

          {!isAdmin && (
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#6B7280' }}>
              Contact your administrator to update company information.
            </div>
          )}
        </div>
      </div>

      {/* Compliance info */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Compliance summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { label: 'Company', value: form.name || '—', icon: Building },
            { label: 'Industry', value: form.industry || '—', icon: Globe },
            { label: 'Location', value: form.location || '—', icon: MapPin },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color="#7C3AED" strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{s.value}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}