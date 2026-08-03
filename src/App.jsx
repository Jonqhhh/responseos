import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
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
import Landing from './pages/Landing'
import Quote from './pages/Quote'
import Pricing from './pages/Pricing'
import Hardware from './pages/Hardware'
import Search from './components/Search'
import NotificationBell from './components/NotificationBell'
import PageTransition from './components/PageTransition'
import OnboardingWizard from './components/OnboardingWizard'
import './index.css'

const NAV = [
  { to: '/',        icon: '▣', label: 'Dashboard'      },
  { to: '/certs',   icon: '◈', label: 'Certifications' },
  { to: '/tasks',   icon: '◎', label: 'Tasks'          },
  { to: '/alerts',  icon: '△', label: 'Alerts'         },
  { to: '/ai',      icon: '◆', label: 'AI Assistant'   },
  { to: '/audit',   icon: '≡', label: 'Audit Log'      },
  { to: '/users',   icon: '◉', label: 'Users'          },
]

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"        element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/certs"   element={<PageTransition><Certifications /></PageTransition>} />
        <Route path="/tasks"   element={<PageTransition><Tasks /></PageTransition>} />
        <Route path="/alerts"  element={<PageTransition><Alerts /></PageTransition>} />
        <Route path="/ai"      element={<PageTransition><AIAssistant /></PageTransition>} />
        <Route path="/audit"   element={<PageTransition><AuditLog /></PageTransition>} />
        <Route path="/users"   element={<PageTransition><Users /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

function AppShell({ user, handleLogout }) {
  const [showOnboarding, setShowOnboarding] = useState(!user?.onboarded)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {showOnboarding && (
        <OnboardingWizard user={user} onComplete={() => setShowOnboarding(false)} />
      )}

      <aside className="sidebar" style={{
        width: 240, flexShrink: 0,
        background: 'var(--sidebar-bg)',
        display: 'flex', flexDirection: 'column',
        padding: '0 0 20px'
      }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '0.5px solid #2C2C2E' }}>
          <img src="/logo.svg" alt="ResponseOS" style={{ width: '100%', height: 52, objectFit: 'contain', objectPosition: 'left' }} />
        </div>
        <nav style={{ flex: 1, padding: '8px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#52525B', letterSpacing: '.08em', textTransform: 'uppercase', padding: '6px 8px', marginBottom: 4 }}>
            Platform
          </div>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: '8px',
                marginBottom: 2, textDecoration: 'none',
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? '#FFFFFF' : '#A1A1AA',
                background: isActive ? '#6B4EFF' : 'transparent',
                transition: 'all .12s'
              })}
            >
              <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '0 12px' }}>
          <NavLink to="/profile" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px', borderRadius: '8px',
            background: isActive ? '#6B4EFF' : '#2C2C2E',
            textDecoration: 'none', marginBottom: 8, transition: 'all .12s'
          })}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: '#6B4EFF', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0
            }}>
              {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: 11, color: '#A1A1AA', fontWeight: 500 }}>
                {user.role.toUpperCase()}
              </div>
            </div>
          </NavLink>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px', borderRadius: '8px',
            background: 'transparent', border: '1px solid #3F3F46',
            color: '#A1A1AA', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s'
          }}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <div style={{
          padding: '12px 28px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', gap: 10, flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <Search />
          <NotificationBell />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <AnimatedRoutes />
        </div>
      </main>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="icon">{n.icon}</span>
              {n.label.split(' ')[0]}
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
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('users').select('*').eq('id', session.user.id).single()
        if (profile) setUser(profile)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') setUser(null)
      if (event === 'SIGNED_IN' && session) {
        const { data: profile } = await supabase
          .from('users').select('*').eq('id', session.user.id).single()
        if (profile) setUser(profile)
      }
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
        border: '2px solid var(--border)', borderTopColor: '#6B4EFF',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home"     element={<Landing />} />
        <Route path="/login"    element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
        <Route path="/quote"    element={<Quote />} />
        <Route path="/pricing"  element={<Pricing />} />
        <Route path="/hardware" element={<Hardware />} />
        <Route path="/*"        element={user ? <AppShell user={user} handleLogout={handleLogout} /> : <Navigate to="/home" />} />
      </Routes>
    </BrowserRouter>
  )
}