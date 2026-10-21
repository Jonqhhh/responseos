import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Supabase signs the user in from the email link with a recovery session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) setReady(true) })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => navigate('/'), 2000)
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E5E7EB',
    background: '#F9FAFB', color: '#111827', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none'
  }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '.04em' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif', background: '#F5F3FF' }}>
      <div className="login-left" style={{ width: 420, flexShrink: 0, background: '#13082A', padding: '48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -60, left: -60, right: -60, height: 300, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.35) 0%, transparent 70%)' }} />
        <img src="/logo.png" alt="ResponseOS" style={{ height: 48, objectFit: 'contain', filter: 'brightness(0) invert(1)', position: 'relative' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Set a new password</h2>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 28 }}>Choose a password you haven't used before.</p>

          {done ? (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#065F46' }}>Password updated</div>
              <div style={{ fontSize: 13, color: '#059669', marginTop: 4 }}>Taking you to your dashboard…</div>
            </div>
          ) : !ready ? (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 20, fontSize: 13, color: '#92400E' }}>
              This reset link is invalid or has expired. Request a new one from the{' '}
              <a href="/login" style={{ color: '#7C3AED', fontWeight: 600 }}>sign-in page</a>.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>New password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required style={{ ...inputStyle, paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Confirm password</label>
                <input type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required style={inputStyle} />
              </div>
              {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ padding: 13, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Saving…' : 'Update password →'}
              </button>
            </form>
          )}
        </div>
      </div>
      <style>{`@media (max-width: 768px) { .login-left { display: none !important; } }`}</style>
    </div>
  )
}