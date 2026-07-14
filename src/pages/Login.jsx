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
    // get user profile from public.users
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()
    onLogin(profile)
    setLoading(false)
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)'
    }}>
      <div style={{
        width: 380, background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 12, padding: '36px 32px'
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 22,
            fontWeight: 500, color: 'var(--text)', letterSpacing: '.04em'
          }}>
            Response<span style={{ color: 'var(--blue)' }}>OS</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, letterSpacing: '.04em' }}>
            COMPLIANCE PLATFORM
          </div>
        </div>

        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
          Sign in
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>
          Enter your credentials to access ResponseOS
        </div>

        {error && (
          <div style={{
            background: 'var(--red-dim)', border: '0.5px solid var(--red)',
            borderRadius: 6, padding: '10px 12px', fontSize: 13,
            color: '#FCA5A5', marginBottom: 16
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Email</div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="you@responseos.com"
              style={{
                width: '100%', padding: '10px 12px',
                borderRadius: 6, border: '0.5px solid var(--border2)',
                background: 'var(--surface2)', color: 'var(--text)',
                fontSize: 13, fontFamily: 'var(--font)', outline: 'none'
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Password</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 12px',
                borderRadius: 6, border: '0.5px solid var(--border2)',
                background: 'var(--surface2)', color: 'var(--text)',
                fontSize: 13, fontFamily: 'var(--font)', outline: 'none'
              }}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleLogin}
            disabled={loading || !email || !password}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 20 }}>
          Contact your administrator to reset your password.
        </div>
      </div>
    </div>
  )
}