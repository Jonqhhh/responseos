import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    const { data: profile } = await supabase
      .from('users').select('*').eq('id', data.user.id).single()
    if (profile) onLogin(profile)
    navigate('/')
    setLoading(false)
  }

  async function handleReset(e) {
    e.preventDefault()
    setResetLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) { setError(error.message); setResetLoading(false); return }
    setResetSent(true)
    setResetLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(139,92,246,0.25)',
    background: 'rgba(20,10,45,0.7)',
    color: '#F0EEFF', fontSize: 15,
    fontFamily: 'Inter, sans-serif', outline: 'none',
    transition: 'all .15s',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif', padding: '20px',
      background: 'radial-gradient(ellipse at 60% 40%, rgba(88,28,235,0.18) 0%, transparent 60%), radial-gradient(ellipse at 20% 70%, rgba(124,58,237,0.12) 0%, transparent 55%), #080612',
      position: 'relative', overflow: 'hidden'
    }}>

      {/* Background stars */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,0.8) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 35% 45%, rgba(200,180,255,0.7) 0%, transparent 100%),
          radial-gradient(1px 1px at 55% 15%, rgba(255,255,255,0.6) 0%, transparent 100%),
          radial-gradient(2px 2px at 75% 55%, rgba(200,180,255,0.8) 0%, transparent 100%),
          radial-gradient(1px 1px at 90% 25%, rgba(255,255,255,0.7) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 10% 75%, rgba(255,255,255,0.6) 0%, transparent 100%),
          radial-gradient(1px 1px at 45% 80%, rgba(200,180,255,0.5) 0%, transparent 100%),
          radial-gradient(2px 2px at 65% 70%, rgba(255,255,255,0.7) 0%, transparent 100%),
          radial-gradient(1px 1px at 85% 85%, rgba(200,180,255,0.6) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 25% 90%, rgba(255,255,255,0.5) 0%, transparent 100%),
          radial-gradient(1px 1px at 50% 5%, rgba(255,255,255,0.8) 0%, transparent 100%),
          radial-gradient(2px 2px at 5% 40%, rgba(200,180,255,0.6) 0%, transparent 100%)
        `
      }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
        background: 'rgba(14,8,32,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 20,
        border: '1px solid rgba(139,92,246,0.25)',
        boxShadow: '0 0 60px rgba(139,92,246,0.12), 0 24px 64px rgba(0,0,0,0.6)',
        padding: '40px 36px',
        overflow: 'hidden'
      }}>
        {/* Top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)'
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="ResponseOS"
            style={{ height: 56, objectFit: 'contain', marginBottom: 12 }} />
          <div style={{ fontSize: 13, color: '#9B8ABB', fontWeight: 500 }}>
            Compliance Platform
          </div>
        </div>

        {!showReset ? (
          <>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F0EEFF', marginBottom: 6, textAlign: 'center' }}>
              Welcome back
            </div>
            <div style={{ fontSize: 14, color: '#9B8ABB', textAlign: 'center', marginBottom: 28 }}>
              Sign in to your ResponseOS account
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#C4B5FD', marginBottom: 6, display: 'block', letterSpacing: '.04em', textTransform: 'uppercase' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@responseos.net"
                  required
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#C4B5FD', marginBottom: 6, display: 'block', letterSpacing: '.04em', textTransform: 'uppercase' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FCA5A5'
                }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px',
                background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif', marginTop: 4,
                boxShadow: loading ? 'none' : '0 0 24px rgba(124,58,237,0.4)',
                transition: 'all .15s'
              }}>
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>

            <button onClick={() => { setShowReset(true); setError(null) }} style={{
              width: '100%', marginTop: 16, background: 'none', border: 'none',
              color: '#8B5CF6', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'center'
            }}>
              Forgot password?
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F0EEFF', marginBottom: 6, textAlign: 'center' }}>
              Reset password
            </div>
            <div style={{ fontSize: 14, color: '#9B8ABB', textAlign: 'center', marginBottom: 28 }}>
              We'll send a reset link to your email
            </div>

            {resetSent ? (
              <div style={{
                background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                borderRadius: 12, padding: '20px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#6EE7B7', marginBottom: 6 }}>Check your email</div>
                <div style={{ fontSize: 13, color: '#9B8ABB' }}>
                  We sent a reset link to {resetEmail}
                </div>
              </div>
            ) : (
              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#C4B5FD', marginBottom: 6, display: 'block', letterSpacing: '.04em', textTransform: 'uppercase' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="you@responseos.net"
                    required
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                {error && (
                  <div style={{
                    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                    borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FCA5A5'
                  }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={resetLoading} style={{
                  width: '100%', padding: '14px',
                  background: resetLoading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                  color: '#fff', border: 'none', borderRadius: '12px',
                  fontSize: 15, fontWeight: 700, cursor: resetLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: resetLoading ? 'none' : '0 0 24px rgba(124,58,237,0.4)',
                  transition: 'all .15s'
                }}>
                  {resetLoading ? 'Sending...' : 'Send reset link →'}
                </button>
              </form>
            )}

            <button onClick={() => { setShowReset(false); setResetSent(false); setError(null) }} style={{
              width: '100%', marginTop: 16, background: 'none', border: 'none',
              color: '#8B5CF6', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'center'
            }}>
              ← Back to sign in
            </button>
          </>
        )}

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(139,92,246,0.12)', textAlign: 'center' }}>
          <button onClick={() => navigate('/home')} style={{
            background: 'none', border: 'none', color: '#7060AA',
            fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            fontWeight: 500
          }}>
            ← Back to responseos.net
          </button>
        </div>
      </div>
    </div>
  )
}