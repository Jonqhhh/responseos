import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, CheckSquare, Bot, FolderLock, ScrollText, Bell, Calendar } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export default function Demo() {
  const navigate = useNavigate()
  const [step, setStep] = useState('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    company: '',
    industry: '',
    team_size: '',
    compliance_needs: '',
    availability: '',
    timezone: ''
  })

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.company) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/quote-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          type: 'DEMO REQUEST',
          message: `
DEMO REQUEST — Schedule a call

Company: ${form.company}
Industry: ${form.industry}
Team size: ${form.team_size}
Compliance needs: ${form.compliance_needs}
Availability: ${form.availability}
Timezone: ${form.timezone}
          `.trim()
        })
      })
      if (!res.ok) throw new Error('Failed to submit')
      setStep('success')
    } catch (err) {
      setError('Something went wrong — please email jlane@responseos.net directly.')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: '12px',
    border: '1px solid rgba(139,92,246,0.25)',
    background: 'rgba(20,10,45,0.7)', color: '#F0EEFF',
    fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none',
    transition: 'all .15s',
  }

  const labelStyle = {
    fontSize: 12, fontWeight: 600, color: '#C4B5FD',
    marginBottom: 6, display: 'block',
    letterSpacing: '.04em', textTransform: 'uppercase'
  }

  const FEATURES = [
    { icon: ShieldCheck, label: 'Live certification tracking' },
    { icon: CheckSquare, label: 'Task & inspection management' },
    { icon: Bot,         label: 'AI compliance assistant'    },
    { icon: Bell,        label: 'Automated alert engine'     },
    { icon: ScrollText,  label: 'Immutable audit log'        },
    { icon: Calendar,    label: 'Guided 1-on-1 demo call'   },
  ]

  return (
    <div style={{
      minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif',
      background: 'radial-gradient(ellipse at 60% 40%, rgba(88,28,235,0.18) 0%, transparent 60%), radial-gradient(ellipse at 20% 70%, rgba(124,58,237,0.12) 0%, transparent 55%), #080612',
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden'
    }}>

      {/* Stars */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.8) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 25% 35%, rgba(200,180,255,0.7) 0%, transparent 100%),
          radial-gradient(1px 1px at 40% 10%, rgba(255,255,255,0.6) 0%, transparent 100%),
          radial-gradient(2px 2px at 60% 25%, rgba(200,180,255,0.8) 0%, transparent 100%),
          radial-gradient(1px 1px at 80% 60%, rgba(255,255,255,0.7) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 90% 10%, rgba(255,255,255,0.6) 0%, transparent 100%),
          radial-gradient(1px 1px at 15% 70%, rgba(200,180,255,0.5) 0%, transparent 100%),
          radial-gradient(2px 2px at 50% 80%, rgba(255,255,255,0.7) 0%, transparent 100%),
          radial-gradient(1px 1px at 70% 90%, rgba(200,180,255,0.6) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 35% 55%, rgba(255,255,255,0.5) 0%, transparent 100%),
          radial-gradient(1px 1px at 88% 40%, rgba(200,180,255,0.7) 0%, transparent 100%),
          radial-gradient(2px 2px at 5% 55%, rgba(255,255,255,0.6) 0%, transparent 100%)
        `
      }} />

      {/* Nav */}
      <nav style={{
        padding: '14px 40px', borderBottom: '1px solid rgba(139,92,246,0.15)',
        background: 'rgba(8,6,18,0.8)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <img src="/logo.png" alt="ResponseOS" onClick={() => navigate('/home')}
          style={{ height: 44, objectFit: 'contain', cursor: 'pointer' }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/home')} style={{
            padding: '8px 16px', background: 'transparent', color: '#9B8ABB',
            border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>← Back</button>
          <button onClick={() => navigate('/login')} style={{
            padding: '8px 18px', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
            color: '#fff', border: 'none', borderRadius: '8px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>Sign in</button>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 580 }}>

          {step === 'form' && (
            <>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '5px 14px', borderRadius: 99,
                  background: 'rgba(139,92,246,0.15)', color: '#C4B5FD',
                  fontSize: 12, fontWeight: 600, letterSpacing: '.04em',
                  marginBottom: 20, border: '1px solid rgba(139,92,246,0.3)'
                }}>
                  ◆ Exclusive demo · Guided by our team
                </div>
                <h1 style={{ fontSize: 38, fontWeight: 800, color: '#F0EEFF', letterSpacing: '-.02em', marginBottom: 12 }}>
                  Request a demo
                </h1>
                <p style={{ fontSize: 16, color: '#9B8ABB', lineHeight: 1.7, maxWidth: 440, margin: '0 auto' }}>
                  We'll personally walk you through ResponseOS on a live call — tailored to your team, industry, and compliance needs.
                </p>
              </div>

              {/* What's included */}
              <div style={{
                background: 'rgba(18,10,42,0.75)', border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: 14, padding: '20px 24px', marginBottom: 24,
                backdropFilter: 'blur(12px)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>
                  What you'll see on the call
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {FEATURES.map(({ icon: Icon, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '7px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                        boxShadow: '0 0 10px rgba(124,58,237,0.3)'
                      }}>
                        <Icon size={14} color="#fff" strokeWidth={2} />
                      </div>
                      <span style={{ fontSize: 13, color: '#C4B8E8', fontWeight: 500 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div style={{
                background: 'rgba(14,8,32,0.85)', border: '1px solid rgba(139,92,246,0.25)',
                borderRadius: 20, padding: '32px', backdropFilter: 'blur(24px)',
                boxShadow: '0 0 60px rgba(139,92,246,0.1)',
                position: 'relative', overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)'
                }} />

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Full name *</label>
                      <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                        placeholder="Jane Smith" required style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Work email *</label>
                      <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                        placeholder="jane@company.com" required style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Company name *</label>
                      <input type="text" value={form.company} onChange={e => set('company', e.target.value)}
                        placeholder="Acme Energy Co." required style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none' }} />
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Team size</label>
                      <select value={form.team_size} onChange={e => set('team_size', e.target.value)} style={inputStyle}>
                        <option value="">Select size...</option>
                        <option>1–10 employees</option>
                        <option>11–50 employees</option>
                        <option>51–200 employees</option>
                        <option>201–500 employees</option>
                        <option>500+ employees</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Timezone</label>
                      <select value={form.timezone} onChange={e => set('timezone', e.target.value)} style={inputStyle}>
                        <option value="">Select timezone...</option>
                        <option>Eastern (ET)</option>
                        <option>Central (CT)</option>
                        <option>Mountain (MT)</option>
                        <option>Pacific (PT)</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Compliance needs</label>
                    <input type="text" value={form.compliance_needs} onChange={e => set('compliance_needs', e.target.value)}
                      placeholder="e.g. FERC, NERC CIP, OSHA, ISO 27001..." style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none' }} />
                  </div>

                  <div>
                    <label style={labelStyle}>Availability for a call</label>
                    <input type="text" value={form.availability} onChange={e => set('availability', e.target.value)}
                      placeholder="e.g. Weekdays 9am–5pm CT, or specific dates..." style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none' }} />
                  </div>

                  {error && (
                    <div style={{
                      background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                      borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FCA5A5'
                    }}>{error}</div>
                  )}

                  <button type="submit" disabled={loading || !form.full_name || !form.email || !form.company}
                    style={{
                      width: '100%', padding: '15px',
                      background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                      color: '#fff', border: 'none', borderRadius: '12px',
                      fontSize: 15, fontWeight: 700,
                      cursor: loading || !form.full_name || !form.email || !form.company ? 'not-allowed' : 'pointer',
                      fontFamily: 'Inter, sans-serif', marginTop: 4,
                      boxShadow: '0 0 24px rgba(124,58,237,0.4)',
                      opacity: !form.full_name || !form.email || !form.company ? 0.5 : 1
                    }}>
                    {loading ? 'Submitting...' : 'Request my demo →'}
                  </button>

                  <div style={{ fontSize: 12, color: '#6060AA', textAlign: 'center' }}>
                    We'll reach out within 24 hours to schedule your call.
                  </div>
                </form>
              </div>
            </>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(52,211,153,0.15)', border: '2px solid rgba(52,211,153,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, margin: '0 auto 28px'
              }}>✓</div>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: '#F0EEFF', marginBottom: 12, letterSpacing: '-.02em' }}>
                Request received!
              </h2>
              <p style={{ fontSize: 16, color: '#9B8ABB', marginBottom: 12, lineHeight: 1.7 }}>
                Thanks {form.full_name.split(' ')[0]} — we'll review your request and reach out to <strong style={{ color: '#C4B5FD' }}>{form.email}</strong> within 24 hours to schedule your demo call.
              </p>
              <p style={{ fontSize: 14, color: '#7060AA', marginBottom: 36, lineHeight: 1.7 }}>
                In the meantime, feel free to explore our landing page or get a custom quote.
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/home')} style={{
                  padding: '12px 28px', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                  color: '#fff', border: 'none', borderRadius: '10px',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 0 16px rgba(124,58,237,0.4)'
                }}>Back to home</button>
                <button onClick={() => navigate('/quote')} style={{
                  padding: '12px 24px', background: 'transparent',
                  color: '#9B8ABB', border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: '10px', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}>Get a quote</button>
              </div>

              <div style={{ marginTop: 28, fontSize: 13, color: '#6060AA' }}>
                Questions? Email us at <a href="mailto:jlane@responseos.net" style={{ color: '#8B5CF6' }}>jlane@responseos.net</a>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}