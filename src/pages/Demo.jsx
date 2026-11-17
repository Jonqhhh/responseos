import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, CheckSquare, Bot, Bell, ScrollText, Calendar,
  ChevronDown, Check, X, ArrowLeft, CheckCircle2
} from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const C = {
  bg: '#F5F3FF', card: '#FFFFFF', border: '#E5E7EB', text: '#111827',
  sub: '#6B7280', muted: '#9CA3AF', label: '#374151',
  purple: '#7C3AED', purpleDark: '#5B21B6', purpleSoft: '#F5F3FF', purpleBorder: '#DDD6FE',
}

const COMPLIANCE_GROUPS = [
  { label: 'Energy & utilities', options: ['FERC', 'NERC CIP', 'PHMSA / DOT', 'EPA'] },
  { label: 'Safety',             options: ['OSHA', 'NFPA', 'HAZWOPER'] },
  { label: 'Quality & security', options: ['ISO 9001', 'ISO 27001', 'SOC 2', 'HIPAA', 'PCI DSS', 'GDPR'] },
  { label: 'Other',              options: ['Internal policies', 'Not sure yet', 'Other'] },
]

const AVAILABILITY_GROUPS = [
  { label: 'Days',        options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
  { label: 'Time of day', options: ['Morning (8am–12pm)', 'Midday (12–2pm)', 'Afternoon (2–5pm)', 'Evening (5–7pm)'] },
  { label: 'Other',       options: ['Flexible / any time'] },
]

const inputBase = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: `1px solid ${C.border}`, background: '#fff', color: C.text,
  fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none',
  transition: 'border-color .15s, box-shadow .15s', boxSizing: 'border-box',
}

const labelStyle = {
  fontSize: 12, fontWeight: 600, color: C.label,
  marginBottom: 6, display: 'block',
}

const chip = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '3px 8px 3px 10px', borderRadius: 99,
  background: C.purpleSoft, color: C.purple, border: `1px solid ${C.purpleBorder}`,
  fontSize: 12, fontWeight: 600, lineHeight: 1.4,
}

function focusOn(e) { e.target.style.borderColor = C.purple; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }
function focusOff(e) { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }

function Select({ value, onChange, placeholder, options }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} onFocus={focusOn} onBlur={focusOff}
        style={{ ...inputBase, appearance: 'none', WebkitAppearance: 'none', paddingRight: 38, color: value ? C.text : C.muted, cursor: 'pointer' }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o} style={{ color: C.text }}>{o}</option>)}
      </select>
      <ChevronDown size={16} color={C.muted} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  )
}

function MultiSelect({ groups, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  function toggle(opt) {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  }

  const shown = value.slice(0, 3)
  const extra = value.length - shown.length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        role="button" tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o) } }}
        style={{
          ...inputBase, minHeight: 46, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          cursor: 'pointer', paddingRight: 40, position: 'relative',
          borderColor: open ? C.purple : C.border,
          boxShadow: open ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
        }}
      >
        {value.length === 0 && <span style={{ color: C.muted }}>{placeholder}</span>}
        {shown.map(v => (
          <span key={v} style={chip}>
            {v}
            <X size={12} strokeWidth={2.5} style={{ cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); toggle(v) }} />
          </span>
        ))}
        {extra > 0 && <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>+{extra} more</span>}
        <ChevronDown size={16} color={C.muted} style={{
          position: 'absolute', right: 14, top: '50%',
          transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, transition: 'transform .15s'
        }} />
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12,
          boxShadow: '0 12px 32px rgba(17,24,39,0.12)', overflow: 'hidden'
        }}>
          <div style={{ maxHeight: 280, overflowY: 'auto', padding: 6 }}>
            {groups.map(g => (
              <div key={g.label} style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.08em', padding: '8px 10px 4px' }}>
                  {g.label}
                </div>
                {g.options.map(opt => {
                  const on = value.includes(opt)
                  return (
                    <div key={opt} onClick={() => toggle(opt)}
                      onMouseEnter={e => { if (!on) e.currentTarget.style.background = '#F9FAFB' }}
                      onMouseLeave={e => { e.currentTarget.style.background = on ? C.purpleSoft : 'transparent' }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                        borderRadius: 8, cursor: 'pointer', fontSize: 14, color: C.text,
                        background: on ? C.purpleSoft : 'transparent'
                      }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: `1.5px solid ${on ? C.purple : '#D1D5DB'}`,
                        background: on ? C.purple : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {on && <Check size={12} color="#fff" strokeWidth={3} />}
                      </div>
                      {opt}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderTop: `1px solid ${C.border}`, background: '#F9FAFB' }}>
            <button type="button" onClick={() => onChange([])} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Clear
            </button>
            <button type="button" onClick={() => setOpen(false)} style={{ background: C.purple, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '6px 14px', borderRadius: 7, fontFamily: 'Inter, sans-serif' }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

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
    timezone: '',
    compliance_needs: [],
    compliance_other: '',
    availability: [],
  })

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const canSubmit = form.full_name && form.email && form.company

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    const needs = form.compliance_needs
      .map(v => (v === 'Other' && form.compliance_other.trim()) ? `Other: ${form.compliance_other.trim()}` : v)
      .join(', ')
    const avail = form.availability.join(', ')

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/quote-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          company: form.company,
          industry: form.industry,
          team_size: form.team_size,
          timezone: form.timezone,
          compliance_needs: needs,
          availability: avail,
          type: 'DEMO REQUEST',
          message: `
DEMO REQUEST — Schedule a call

Company: ${form.company}
Industry: ${form.industry || '—'}
Team size: ${form.team_size || '—'}
Compliance needs: ${needs || '—'}
Availability: ${avail || '—'}
Timezone: ${form.timezone || '—'}
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

  const FEATURES = [
    { icon: ShieldCheck, label: 'Live certification tracking'  },
    { icon: CheckSquare, label: 'Training assignments'         },
    { icon: Bot,         label: 'AI compliance assistant'      },
    { icon: Bell,        label: 'Automated alert engine'       },
    { icon: ScrollText,  label: 'Immutable audit log'          },
    { icon: Calendar,    label: 'Guided 1-on-1 demo call'      },
  ]

  const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* Purple underglow */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '60vh', zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.10) 0%, transparent 65%)'
      }} />

      {/* Nav */}
      <nav style={{
        padding: '14px 40px', borderBottom: `1px solid ${C.border}`,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(139,92,246,0.06)'
      }}>
        <img src="/logo.png" alt="ResponseOS" onClick={() => navigate('/home')}
          style={{ height: 44, objectFit: 'contain', cursor: 'pointer' }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/home')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', background: '#fff', color: C.sub,
            border: `1.5px solid ${C.border}`, borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}><ArrowLeft size={14} /> Back</button>
          <button onClick={() => navigate('/login')} style={{
            padding: '9px 18px', background: `linear-gradient(135deg, ${C.purple}, ${C.purpleDark})`,
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 14px rgba(124,58,237,0.25)'
          }}>Sign in</button>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '48px 20px 64px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 600 }}>

          {step === 'form' && (
            <>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 14px', borderRadius: 99,
                  background: '#fff', color: C.purple,
                  fontSize: 12, fontWeight: 600, letterSpacing: '.02em',
                  marginBottom: 18, border: `1px solid ${C.purpleBorder}`
                }}>
                  <Calendar size={13} /> Guided demo · Live with our team
                </div>
                <h1 style={{ fontSize: 40, fontWeight: 800, color: C.text, letterSpacing: '-.03em', marginBottom: 12 }}>
                  Request a <span style={{ color: C.purple }}>demo</span>
                </h1>
                <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.7, maxWidth: 460, margin: '0 auto' }}>
                  We'll walk you through ResponseOS on a live call — tailored to your team, industry, and compliance needs.
                </p>
              </div>

              {/* What's included */}
              <div style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: '20px 24px', marginBottom: 18,
                boxShadow: '0 1px 4px rgba(139,92,246,0.06)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>
                  What you'll see on the call
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {FEATURES.map(({ icon: Icon, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: C.purpleSoft, border: `1px solid ${C.purpleBorder}`
                      }}>
                        <Icon size={15} color={C.purple} strokeWidth={2} />
                      </div>
                      <span style={{ fontSize: 13, color: C.label, fontWeight: 500 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 18, padding: 28,
                boxShadow: '0 20px 50px rgba(139,92,246,0.10), 0 4px 14px rgba(0,0,0,0.04)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 24, right: 24, height: 3, borderRadius: '0 0 3px 3px',
                  background: `linear-gradient(90deg, ${C.purple}, ${C.purpleDark})`
                }} />

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  <div style={twoCol}>
                    <div>
                      <label style={labelStyle}>Full name <span style={{ color: C.purple }}>*</span></label>
                      <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                        placeholder="Jane Smith" required style={inputBase} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                    <div>
                      <label style={labelStyle}>Work email <span style={{ color: C.purple }}>*</span></label>
                      <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                        placeholder="jane@company.com" required style={inputBase} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </div>

                  <div style={twoCol}>
                    <div>
                      <label style={labelStyle}>Company name <span style={{ color: C.purple }}>*</span></label>
                      <input type="text" value={form.company} onChange={e => set('company', e.target.value)}
                        placeholder="Acme Energy Co." required style={inputBase} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                    <div>
                      <label style={labelStyle}>Industry</label>
                      <Select value={form.industry} onChange={v => set('industry', v)} placeholder="Select industry..."
                        options={['Energy & Utilities', 'Oil & Gas', 'Healthcare', 'Manufacturing', 'Construction', 'Logistics & Transportation', 'Government & Public Sector', 'Financial Services', 'Other']} />
                    </div>
                  </div>

                  <div style={twoCol}>
                    <div>
                      <label style={labelStyle}>Team size</label>
                      <Select value={form.team_size} onChange={v => set('team_size', v)} placeholder="Select size..."
                        options={['1–10 employees', '11–50 employees', '51–200 employees', '201–500 employees', '500+ employees']} />
                    </div>
                    <div>
                      <label style={labelStyle}>Timezone</label>
                      <Select value={form.timezone} onChange={v => set('timezone', v)} placeholder="Select timezone..."
                        options={['Eastern (ET)', 'Central (CT)', 'Mountain (MT)', 'Pacific (PT)', 'Other']} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Compliance needs <span style={{ color: C.muted, fontWeight: 500 }}>· select all that apply</span></label>
                    <MultiSelect groups={COMPLIANCE_GROUPS} value={form.compliance_needs}
                      onChange={v => set('compliance_needs', v)} placeholder="Select frameworks..." />
                    {form.compliance_needs.includes('Other') && (
                      <input type="text" value={form.compliance_other} onChange={e => set('compliance_other', e.target.value)}
                        placeholder="Tell us what else you need to track..." style={{ ...inputBase, marginTop: 8 }}
                        onFocus={focusOn} onBlur={focusOff} />
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>Availability for a call <span style={{ color: C.muted, fontWeight: 500 }}>· select all that apply</span></label>
                    <MultiSelect groups={AVAILABILITY_GROUPS} value={form.availability}
                      onChange={v => set('availability', v)} placeholder="Select days and times..." />
                  </div>

                  {error && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#B91C1C' }}>
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading || !canSubmit}
                    style={{
                      width: '100%', padding: 15, marginTop: 4,
                      background: `linear-gradient(135deg, ${C.purple}, ${C.purpleDark})`,
                      color: '#fff', border: 'none', borderRadius: 12,
                      fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                      cursor: loading || !canSubmit ? 'not-allowed' : 'pointer',
                      boxShadow: '0 6px 20px rgba(124,58,237,0.30)',
                      opacity: loading || !canSubmit ? 0.55 : 1, transition: 'opacity .15s'
                    }}>
                    {loading ? 'Submitting...' : 'Request my demo →'}
                  </button>

                  <div style={{ fontSize: 12, color: C.muted, textAlign: 'center' }}>
                    We'll reach out within 24 hours to schedule your call.
                  </div>
                </form>
              </div>
            </>
          )}

          {step === 'success' && (
            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 18,
              padding: '44px 32px', textAlign: 'center',
              boxShadow: '0 20px 50px rgba(139,92,246,0.10), 0 4px 14px rgba(0,0,0,0.04)'
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#ECFDF5', border: '1.5px solid #A7F3D0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <CheckCircle2 size={36} color="#047857" strokeWidth={2} />
              </div>
              <h2 style={{ fontSize: 30, fontWeight: 800, color: C.text, marginBottom: 12, letterSpacing: '-.02em' }}>
                Request received!
              </h2>
              <p style={{ fontSize: 16, color: C.sub, marginBottom: 10, lineHeight: 1.7 }}>
                Thanks {form.full_name.split(' ')[0]} — we'll reach out to <strong style={{ color: C.purple }}>{form.email}</strong> within 24 hours to schedule your demo call.
              </p>
              <p style={{ fontSize: 14, color: C.muted, marginBottom: 30, lineHeight: 1.7 }}>
                In the meantime, explore the platform or get a custom quote.
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/home')} style={{
                  padding: '12px 28px', background: `linear-gradient(135deg, ${C.purple}, ${C.purpleDark})`,
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.3)'
                }}>Back to home</button>
                <button onClick={() => navigate('/quote')} style={{
                  padding: '12px 24px', background: '#fff', color: C.purple,
                  border: '1.5px solid rgba(124,58,237,0.3)', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}>Get a quote</button>
              </div>

              <div style={{ marginTop: 26, fontSize: 13, color: C.muted }}>
                Questions? Email <a href="mailto:jlane@responseos.net" style={{ color: C.purple, fontWeight: 600 }}>jlane@responseos.net</a>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}