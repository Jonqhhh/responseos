import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import Certifications from './pages/Certifications'
import Tasks from './pages/Tasks'
import Alerts from './pages/Alerts'
import AuditLog from './pages/AuditLog'
import AIAssistant from './pages/AIAssistant'
import Login from './pages/Login'
import './index.css'

const NAV = [
  { to: '/',       icon: '▣', label: 'Dashboard'      },
  { to: '/certs',  icon: '◈', label: 'Certifications' },
  { to: '/tasks',  icon: '◎', label: 'Tasks'          },
  { to: '/alerts', icon: '△', label: 'Alerts'         },
  { to: '/ai',     icon: '◆', label: 'AI Assistant'   },
  { to: '/audit',  icon: '≡', label: 'Audit Log'      },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // check if already logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setUser(profile)
      }
      setLoading(false)
    })

    // listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') setUser(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)'
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '2px solid var(--border)', borderTopColor: 'var(--blue)',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!user) return <Login onLogin={setUser} />

  const unread = 0

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{
          width: 220, flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '0.5px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          padding: '0 0 16px'
        }}>
          <div style={{
            padding: '22px 20px 20px',
            borderBottom: '0.5px solid var(--border)',
            marginBottom: 8
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 500, letterSpacing: '.04em', color: 'var(--text)' }}>
              Response<span style={{ color: 'var(--blue)' }}>OS</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, letterSpacing: '.04em' }}>
              COMPLIANCE PLATFORM
            </div>
          </div>

          <nav style={{ flex: 1, padding: '8px 10px' }}>
            <div className="label" style={{ padding: '6px 10px', marginBottom: 4 }}>Platform</div>
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 'var(--radius)',
                  marginBottom: 2, textDecoration: 'none',
                  fontSize: 13, fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--text)' : 'var(--text2)',
                  background: isActive ? 'var(--surface3)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--blue)' : '2px solid transparent',
                  transition: 'all .12s'
                })}
              >
                <span style={{ fontSize: 14, width: 16, textAlign: 'center' }}>{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>

          {/* User + logout */}
          <div style={{ margin: '0 10px' }}>
            <div style={{
              padding: '10px',
              background: 'var(--surface2)',
              borderRadius: 'var(--radius)',
              border: '0.5px solid var(--border)',
              marginBottom: 8
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                {user.role.toUpperCase()}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/"       element={<Dashboard />} />
            <Route path="/certs"  element={<Certifications />} />
            <Route path="/tasks"  element={<Tasks />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/ai"     element={<AIAssistant />} />
            <Route path="/audit"  element={<AuditLog />} />
            <Route path="*"       element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}