import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Quote() {
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    industry: '',
    size: '',
    plan: '',
    message: ''
  })

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.name || !form.email || !form.company) return
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quote-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Failed to submit')
      setSubmitted(true)
    } catch (e) {
      alert('Something went wrong — please email jonahtandf@gmail.com directly.')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    borderRadius: '8px', border: '1px solid #E4E6EF',
    background: '#fff', color: '#0F1117',
    fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none',
    transition: 'border-color .12s', boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
  }
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#0F1117', marginBottom: 6, display: 'block' }

  return (
    <div style={{ background: '#F8F9FC', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Nav */}
      <nav className="quote-nav" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 60px', borderBottom: '1px solid #E4E6EF',
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <img src="/logo.png" alt="ResponseOS" onClick={() => navigate('/home')}
          style={{ height: 44, objectFit: 'contain', cursor: 'pointer' }} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => navigate('/home')} style={{
            padding: '9px 18px', background: 'transparent', color: '#6B7280',
            border: '1px solid #E4E6EF', borderRadius: '8px', fontSize: 14,
            fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>← Back</button>
          <button onClick={() => navigate('/login')} style={{
            padding: '9px 22px', background: '#6B4EFF', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>Sign in</button>
        </div>
      </nav>

      <div className="quote-wrap" style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px' }}>

        {!submitted ? (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 14px', borderRadius: 99,
                background: '#EEF0FF', color: '#6B4EFF',
                fontSize: 12, fontWeight: 600, letterSpacing: '.04em',
                marginBottom: 20, border: '1px solid #C7C0FF'
              }}>
                ◆ No commitment required
              </div>
              <h1 style={{ fontSize: 40, fontWeight: 800, color: '#0F1117', letterSpacing: '-.02em', marginBottom: 14 }}>
                Get a custom quote
              </h1>
              <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
                Tell us about your team and compliance needs. We'll put together a custom proposal within 24 hours — no spam, no commitment.
              </p>
            </div>

            {/* Trust signals */}
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 36, flexWrap: 'wrap' }}>
              {['Response within 24 hrs', 'Custom proposal', 'No credit card needed'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#059669', fontWeight: 600 }}>
                  <span>✓</span> {t}
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="quote-form" style={{ background: '#fff', borderRadius: 16, border: '1px solid #E4E6EF', padding: '36px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>

              <div className="quote-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Full name *</label>
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Jane Smith" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6B4EFF'}
                    onBlur={e => e.target.style.borderColor = '#E4E6EF'} />
                </div>
                <div>
                  <label style={labelStyle}>Work email *</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="jane@company.com" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6B4EFF'}
                    onBlur={e => e.target.style.borderColor = '#E4E6EF'} />
                </div>
              </div>

              <div className="quote-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Company name *</label>
                  <input type="text" value={form.company} onChange={e => set('company', e.target.value)}
                    placeholder="Acme Energy Co." style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6B4EFF'}
                    onBlur={e => e.target.style.borderColor = '#E4E6EF'} />
                </div>
                <div>
                  <label style={labelStyle}>Industry</label>
                  <select value={form.industry} onChange={e => set('industry', e.target.value)} style={inputStyle}>
                    <option value="">Select industry...</option>
                    <option>Energy & Utilities</option>
                    <option>Oil & Gas</option>
                    <option>Healthcare</option>
                    <option>Manufacturing</option>
                    <option>Construction</option>
                    <option>Logistics & Transportation</option>
                    <option>Government & Public Sector</option>
                    <option>Financial Services</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="quote-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Team size</label>
                  <select value={form.size} onChange={e => set('size', e.target.value)} style={inputStyle}>
                    <option value="">Select team size...</option>
                    <option>1–10 employees</option>
                    <option>11–50 employees</option>
                    <option>51–200 employees</option>
                    <option>201–500 employees</option>
                    <option>500+ employees</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Compliance frameworks</label>
                  <select value={form.plan} onChange={e => set('plan', e.target.value)} style={inputStyle}>
                    <option value="">Select primary need...</option>
                    <option>FERC / NERC CIP</option>
                    <option>OSHA</option>
                    <option>ISO 27001</option>
                    <option>HIPAA</option>
                    <option>SOC 2</option>
                    <option>Multiple frameworks</option>
                    <option>Not sure yet</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>What's your biggest compliance challenge?</label>
                <textarea value={form.message} onChange={e => set('message', e.target.value)}
                  placeholder="Tell us what keeps you up at night — expired certifications, upcoming audits, manual tracking, etc."
                  rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = '#6B4EFF'}
                  onBlur={e => e.target.style.borderColor = '#E4E6EF'} />
              </div>

              <button onClick={handleSubmit}
                disabled={loading || !form.name || !form.email || !form.company}
                style={{
                  width: '100%', padding: '16px', background: '#6B4EFF', color: '#fff',
                  border: 'none', borderRadius: '10px', fontSize: 16, fontWeight: 700,
                  cursor: loading || !form.name || !form.email || !form.company ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif', transition: 'all .12s',
                  opacity: loading || !form.name || !form.email || !form.company ? 0.5 : 1,
                  boxShadow: '0 4px 16px rgba(107,78,255,0.4)'
                }}>
                {loading ? 'Submitting...' : 'Request my custom quote →'}
              </button>

              <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 14, fontWeight: 500 }}>
                No spam. No commitment. Custom proposal back within 24 hours.
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: '#ECFDF5', border: '2px solid #A7F3D0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, margin: '0 auto 28px'
            }}>✓</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#0F1117', marginBottom: 12, letterSpacing: '-.02em' }}>
              Quote request received!
            </h2>
            <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.7, maxWidth: 440, margin: '0 auto 12px' }}>
              Thanks {form.name.split(' ')[0]} — we'll review your request and send a custom proposal to:
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#6B4EFF', marginBottom: 36 }}>{form.email}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/home')} style={{
                padding: '12px 28px', background: '#6B4EFF', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif'
              }}>Back to home</button>
              <button onClick={() => navigate('/login')} style={{
                padding: '12px 24px', background: '#fff', color: '#6B7280',
                border: '1px solid #E4E6EF', borderRadius: '8px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif'
              }}>Sign in to platform</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}