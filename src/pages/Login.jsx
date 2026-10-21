import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff } from 'lucide-react'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resetMode, setResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single()
    if (profile) onLogin(profile)
    navigate('/')
    setLoading(false)
  }

  async function handleReset(e) {
    e.preventDefault()
    setResetLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (err) { setError(err.message); setResetLoading(false); return }
    setResetSent(true)
    setResetLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#111827',
    fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'all .15s'
  }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '.04em' }
  const focusOn  = e => { e.target.style.borderColor = '#7C3AED'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)' }
  const focusOff = e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; e.target.style.boxShadow = 'none' }
  const primaryBtn = {
    width: '100%', padding: '13px', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
    color: '#fff', border: 'none', borderRadius: '10px', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 16px rgba(124,58,237,0.3)', transition: 'all .15s'
  }
  const linkBtn = { background: 'none', border: 'none', color: '#7C3AED', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: 4 }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif', background: '#F5F3FF' }}>

      {/* Left panel */}
      <div className="login-left" style={{
        width: 420, flexShrink: 0, background: '#13082A',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 48px 40px', borderRight: '1px solid rgba(139,92,246,0.2)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', bottom: -60, left: -60, right: -60, height: 300, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.35) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, pointerEvents: 'none', background: 'radial-gradient(ellipse at 100% 0%, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <img src="/logo.png" alt="ResponseOS" style={{ height: 48, objectFit: 'contain', objectPosition: 'left', marginBottom: 48, filter: 'brightness(0) invert(1)' }} />
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-.02em' }}>
            Compliance you can<br />count on.
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 40 }}>
            AI-powered compliance and training management for energy, utility, and critical infrastructure teams.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '🛡️', text: 'Certification tracking with expiry alerts' },
              { icon: '📋', text: 'Training tracker with PDF export' },
              { icon: '🤖', text: 'AI compliance assistant' },
              { icon: '📊', text: 'Weekly AI risk reports' },
            ].map(f => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{f.icon}</div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Compliance frameworks</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['FERC', 'NERC CIP', 'OSHA', 'ISO 27001', 'SOC 2', 'HIPAA'].map(b => (
              <span key={b} style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'rgba(139,92,246,0.2)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 60% 40%, rgba(139,92,246,0.06) 0%, transparent 65%)' }} />

        <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
          {!resetMode ? (
            <>
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 8, letterSpacing: '-.02em' }}>Sign in</h2>
                <p style={{ fontSize: 14, color: '#9CA3AF' }}>Welcome back — enter your credentials to continue.</p>
              </div>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>

                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ ...inputStyle, paddingRight: 44 }} onFocus={focusOn} onBlur={focusOff} />
                    <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 500 }}>{error}</div>}

                <button type="submit" disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Signing in...' : 'Sign in →'}
                </button>

                <button type="button" onClick={() => { setResetMode(true); setResetEmail(email); setError(null) }} style={linkBtn}>
                  Forgot password?
                </button>
              </form>

              <div style={{ marginTop: 32, textAlign: 'center' }}>
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>Don't have an account? </span>
                <button onClick={() => navigate('/demo')} style={linkBtn}>Request a demo →</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 8, letterSpacing: '-.02em' }}>Reset password</h2>
                <p style={{ fontSize: 14, color: '#9CA3AF' }}>Enter your email and we'll send a secure reset link. The link expires after 1 hour.</p>
              </div>

              {resetSent ? (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>✓</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#065F46', marginBottom: 6 }}>Check your inbox</div>
                  <div style={{ fontSize: 13, color: '#059669' }}>If an account exists for <strong>{resetEmail}</strong>, a reset link is on its way.</div>
                  <button onClick={() => { setResetMode(false); setResetSent(false) }} style={{ ...linkBtn, marginTop: 16 }}>← Back to sign in</button>
                </div>
              ) : (
                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="you@company.com" required style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                  </div>

                  {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>{error}</div>}

                  <button type="submit" disabled={resetLoading} style={{ ...primaryBtn, opacity: resetLoading ? 0.7 : 1 }}>
                    {resetLoading ? 'Sending...' : 'Send reset link →'}
                  </button>

                  <button type="button" onClick={() => { setResetMode(false); setError(null) }} style={{ ...linkBtn, color: '#9CA3AF' }}>
                    ← Back to sign in
                  </button>
                </form>
              )}
            </>
          )}

          <div style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: '#D1D5DB' }}>
            © 2026 ResponseOS · Houston, TX · responseos.net
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 768px) { .login-left { display: none !important; } }`}</style>
    </div>
  )
}