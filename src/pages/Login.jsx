import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleLogin() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    const { data: profile } = await supabase
      .from('users').select('*').eq('id', data.user.id).single()
    onLogin(profile)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg)', fontFamily: 'var(--font)'
    }}>
      {/* Left panel */}
      <div style={{
        width: 420, flexShrink: 0, background: '#1C1C1E',
        display: 'flex', flexDirection: 'column',
        padding: '48px 40px', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', marginBottom: 48 }}>
            Response<span style={{ color: '#6B4EFF' }}>OS</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 16 }}>
            The compliance platform built for regulated industries.
          </div>
          <div style={{ fontSize: 14, color: '#71717A', lineHeight: 1.7 }}>
            Monitor certifications, tasks, and audit readiness in real time — powered by AI.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { icon: '◈', text: 'Automated certification tracking' },
            { icon: '△', text: 'Tiered alert engine with escalation' },
            { icon: '◆', text: 'AI-powered weekly risk reports' },
            { icon: '≡', text: 'FERC-ready immutable audit log' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(107,78,255,0.15)', color: '#6B4EFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0
              }}>
                {f.icon}
              </div>
              <span style={{ fontSize: 13, color: '#A1A1AA', fontWeight: 500 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '48px'
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              Sign in
            </div>
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>
              Enter your credentials to access ResponseOS
            </div>
          </div>

          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid #FECACA',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: 13, color: 'var(--red)', marginBottom: 20
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'block' }}>
                Email
              </label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="you@responseos.com"
                style={{
                  width: '100%', padding: '10px 14px',
                  borderRadius: '8px', border: '1px solid var(--border)',
                  background: 'var(--surface)', color: 'var(--text)',
                  fontSize: 14, fontFamily: 'var(--font)', outline: 'none',
                  transition: 'border-color .12s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'block' }}>
                Password
              </label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '10px 14px',
                  borderRadius: '8px', border: '1px solid var(--border)',
                  background: 'var(--surface)', color: 'var(--text)',
                  fontSize: 14, fontFamily: 'var(--font)', outline: 'none',
                  transition: 'border-color .12s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleLogin}
              disabled={loading || !email || !password}
              style={{
                width: '100%', justifyContent: 'center',
                padding: '11px', fontSize: 14, marginTop: 4,
                opacity: loading || !email || !password ? 0.5 : 1
              }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 24 }}>
            Contact your administrator to reset your password.
          </div>
        </div>
      </div>
    </div>
  )
}