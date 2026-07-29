import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import Certifications from './pages/Certifications'
import Tasks from './pages/Tasks'
import Alerts from './pages/Alerts'
import AuditLog from './pages/AuditLog'
import AIAssistant from './pages/AIAssistant'
import Users from './pages/Users'
import Profile from './pages/Profile'
import Login from './pages/Login'
import './index.css'

const NAV = [
  { to: '/',        icon: '▣', label: 'Dashboard'      },
  { to: '/certs',   icon: '◈', label: 'Certifications' },
  { to: '/tasks',   icon: '◎', label: 'Tasks'          },
  { to: '/alerts',  icon: '△', label: 'Alerts'         },
  { to: '/ai',      icon: '◆', label: 'AI'             },
  { to: '/audit',   icon: '≡', label: 'Audit'          },
  { to: '/users',   icon: '◉', label: 'Users'          },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('users').select('*').eq('id', session.user.id).single()
        setUser(profile)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
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

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* Desktop sidebar */}
        <aside className="sidebar" style={{
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

          {/* User profile link at bottom */}
          <div style={{ margin: '0 10px' }}>
            <NavLink to="/profile"
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px', borderRadius: 'var(--radius)',
                background: isActive ? 'var(--surface3)' : 'var(--surface2)',
                border: `0.5px solid ${isActive ? 'var(--blue)' : 'var(--border)'}`,
                textDecoration: 'none', marginBottom: 8, transition: 'all .12s'
              })}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--blue-dim)', color: '#93C5FD',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, flexShrink: 0
              }}>
                {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                  {user.full_name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                  {user.role.toUpperCase()}
                </div>
              </div>
            </NavLink>
            <button onClick={handleLogout} className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/"        element={<Dashboard />} />
            <Route path="/certs"   element={<Certifications />} />
            <Route path="/tasks"   element={<Tasks />} />
            <Route path="/alerts"  element={<Alerts />} />
            <Route path="/ai"      element={<AIAssistant />} />
            <Route path="/audit"   element={<AuditLog />} />
            <Route path="/users"   element={<Users />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*"        element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Mobile bottom nav */}
        <nav className="bottom-nav">
          <div class="bottom-nav-inner">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}
                className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
              >
                <span className="icon">{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
            <NavLink to="/profile"
              className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="icon">○</span>
              Profile
            </NavLink>
          </div>
        </nav>

      </div>
    </BrowserRouter>
  )
}