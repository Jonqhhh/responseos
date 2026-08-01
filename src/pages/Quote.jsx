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
    width: '100%', padding: '11px 14px',
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
        <img src="/logo.svg" alt="ResponseOS" onClick={() => navigate('/home')}
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

      <div className="quote-wrap" style={{ maxWidth: 680, margin: '0 auto', padding: '60px 24px' }}>

        {!submitted ? (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
                Get a quote
              </h1>
              <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
                Tell us about your team and we'll put together a custom plan. Most quotes are returned within 24 hours.
              </p>
            </div>

            {/* Plan cards */}
            <div className="quote-plans" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 40 }}>
              {[
                { name: 'Starter', price: '$5,700/yr', users: 'Up to 10 users', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
                { name: 'Professional', price: '$8,100/yr', users: 'Up to 50 users', color: '#6B4EFF', bg: '#EEF0FF', border: '#C7C0FF', popular: true },
                { name: 'Enterprise', price: '$14,100/yr', users: 'Unlimited users', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
              ].map(p => (
                <div key={p.name} onClick={() => set('plan', p.name)}
                  style={{
                    padding: '16px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${form.plan === p.name ? p.color : p.border}`,
                    background: form.plan === p.name ? p.bg : '#fff',
                    transition: 'all .12s', position: 'relative'
                  }}>
                  {p.popular && (
                    <div style={{
                      position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                      background: '#6B4EFF', color: '#fff', fontSize: 10, fontWeight: 700,
                      padding: '2px 10px', borderRadius: 99, whiteSpace: 'nowrap'
                    }}>MOST POPULAR</div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 700, color: p.color, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F1117', marginBottom: 2 }}>{p.price}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{p.users}</div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="quote-form" style={{ background: '#fff', borderRadius: 14, border: '1px solid #E4E6EF', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
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
                  <label style={labelStyle}>Interested plan</label>
                  <select value={form.plan} onChange={e => set('plan', e.target.value)} style={inputStyle}>
                    <option value="">Select a plan...</option>
                    <option>Starter — $5,700/year</option>
                    <option>Professional — $8,100/year</option>
                    <option>Enterprise — $14,100/year</option>
                    <option>Not sure yet</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Tell us about your compliance needs</label>
                <textarea value={form.message} onChange={e => set('message', e.target.value)}
                  placeholder="What compliance frameworks do you need to meet? What's your biggest pain point today?"
                  rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = '#6B4EFF'}
                  onBlur={e => e.target.style.borderColor = '#E4E6EF'} />
              </div>

              <button onClick={handleSubmit}
                disabled={loading || !form.name || !form.email || !form.company}
                style={{
                  width: '100%', padding: '14px', background: '#6B4EFF', color: '#fff',
                  border: 'none', borderRadius: '8px', fontSize: 15, fontWeight: 700,
                  cursor: loading || !form.name || !form.email || !form.company ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif', transition: 'all .12s',
                  opacity: loading || !form.name || !form.email || !form.company ? 0.5 : 1,
                  boxShadow: '0 4px 12px rgba(107,78,255,0.3)'
                }}>
                {loading ? 'Submitting...' : 'Request a quote →'}
              </button>

              <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 12, fontWeight: 500 }}>
                No spam. No commitment. We'll respond within 24 hours.
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#ECFDF5', border: '2px solid #A7F3D0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, margin: '0 auto 24px'
            }}>✓</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0F1117', marginBottom: 12 }}>
              Quote request received!
            </h2>
            <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.7, maxWidth: 440, margin: '0 auto 32px' }}>
              Thanks {form.name.split(' ')[0]} — we'll review your request and get back to {form.email} within 24 hours.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/home')} style={{
                padding: '12px 24px', background: '#6B4EFF', color: '#fff',
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