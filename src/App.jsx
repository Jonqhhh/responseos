import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { supabase } from './lib/supabase'
import {
  LayoutDashboard, ShieldCheck, CheckSquare, Bell,
  Bot, ScrollText, FolderLock, Users, User
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Certifications from './pages/Certifications'
import Tasks from './pages/Tasks'
import Alerts from './pages/Alerts'
import AuditLog from './pages/AuditLog'
import AIAssistant from './pages/AIAssistant'
import UsersPage from './pages/Users'
import Profile from './pages/Profile'
import DocumentVault from './pages/DocumentVault'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Quote from './pages/Quote'
import Hardware from './pages/Hardware'
import Demo from './pages/Demo'
import Search from './components/Search'
import NotificationBell from './components/NotificationBell'
import PageTransition from './components/PageTransition'
import OnboardingWizard from './components/OnboardingWizard'
import './index.css'

const NAV_ALL = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard'      },
  { to: '/certs',   icon: ShieldCheck,     label: 'Certifications' },
  { to: '/tasks',   icon: CheckSquare,     label: 'Tasks'          },
  { to: '/alerts',  icon: Bell,            label: 'Alerts'         },
  { to: '/ai',      icon: Bot,             label: 'AI Assistant'   },
  { to: '/audit',   icon: ScrollText,      label: 'Audit Log'      },
]

const NAV_ADMIN = [
  { to: '/docs',    icon: FolderLock,      label: 'Document Vault' },
  { to: '/users',   icon: Users,           label: 'Users'          },
]

function MoonrockSidebar({ children }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ctx = el.getContext('2d')
    el.width = 240
    el.height = window.innerHeight

    const w = el.width
    const h = el.height

    const base = ctx.createLinearGradient(0, 0, w, h)
    base.addColorStop(0,   '#EEEAF8')
    base.addColorStop(0.3, '#E5E0F5')
    base.addColorStop(0.6, '#DDD6F2')
    base.addColorStop(1,   '#D5CEEE')
    ctx.fillStyle = base
    ctx.fillRect(0, 0, w, h)

    const craters = [
      { x: 180, y: 60,  r: 18, depth: 0.3  },
      { x: 40,  y: 140, r: 12, depth: 0.25 },
      { x: 160, y: 220, r: 22, depth: 0.35 },
      { x: 60,  y: 320, r: 15, depth: 0.28 },
      { x: 200, y: 400, r: 10, depth: 0.2  },
      { x: 30,  y: 480, r: 20, depth: 0.32 },
      { x: 140, y: 560, r: 14, depth: 0.25 },
      { x: 90,  y: 650, r: 8,  depth: 0.18 },
      { x: 210, y: 700, r: 16, depth: 0.28 },
      { x: 50,  y: 780, r: 11, depth: 0.22 },
    ]

    craters.forEach(c => {
      const shadow = ctx.createRadialGradient(c.x - c.r * 0.3, c.y - c.r * 0.3, 0, c.x, c.y, c.r)
      shadow.addColorStop(0,   `rgba(100,80,160,${c.depth * 0.6})`)
      shadow.addColorStop(0.6, `rgba(120,100,180,${c.depth * 0.3})`)
      shadow.addColorStop(1,   'rgba(200,190,230,0)')
      ctx.fillStyle = shadow
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
      ctx.fill()

      const highlight = ctx.createRadialGradient(c.x + c.r * 0.4, c.y + c.r * 0.4, 0, c.x + c.r * 0.3, c.y + c.r * 0.3, c.r * 0.8)
      highlight.addColorStop(0, `rgba(255,255,255,${c.depth * 0.5})`)
      highlight.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = highlight
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = `rgba(140,120,190,${c.depth * 0.4})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
      ctx.stroke()
    })

    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const size = Math.random() * 1.2
      const alpha = Math.random() * 0.06
      ctx.fillStyle = Math.random() > 0.5
        ? `rgba(255,255,255,${alpha})`
        : `rgba(100,80,160,${alpha})`
      ctx.fillRect(x, y, size, size)
    }

    const topGlow = ctx.createLinearGradient(0, 0, 0, 200)
    topGlow.addColorStop(0, 'rgba(139,92,246,0.08)')
    topGlow.addColorStop(1, 'rgba(139,92,246,0)')
    ctx.fillStyle = topGlow
    ctx.fillRect(0, 0, w, 200)

    const rightGlow = ctx.createLinearGradient(w - 30, 0, w, 0)
    rightGlow.addColorStop(0, 'rgba(139,92,246,0)')
    rightGlow.addColorStop(1, 'rgba(139,92,246,0.06)')
    ctx.fillStyle = rightGlow
    ctx.fillRect(w - 30, 0, 30, h)
  }, [])

  return (
    <aside style={{
      width: 240, flexShrink: 0, zIndex: 10,
      display: 'flex', flexDirection: 'column',
      padding: '0 0 20px',
      borderRight: '1px solid rgba(139,92,246,0.15)',
      boxShadow: '4px 0 24px rgba(139,92,246,0.08)',
      position: 'relative', overflow: 'hidden'
    }}>
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {children}
      </div>
    </aside>
  )
}

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
        <Route path="/docs"    element={<PageTransition><DocumentVault /></PageTransition>} />
        <Route path="/users"   element={<PageTransition><UsersPage /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

function DemoBanner({ user }) {
  if (!user?.is_demo) return null
  const daysLeft = user.demo_expires_at
    ? Math.max(0, Math.ceil((new Date(user.demo_expires_at) - Date.now()) / (1000 * 60 * 60 * 24)))
    : 14
  return (
    <div style={{
      background: 'linear-gradient(90deg, #7C3AED, #5B21B6)',
      padding: '8px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0, zIndex: 10,
      borderBottom: '1px solid rgba(139,92,246,0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#EDE9FF', fontWeight: 600 }}>
        <span>🚀</span>
        <span>Demo mode — <strong>{daysLeft} days</strong> remaining</span>
      </div>
      <a href="/quote" style={{
        padding: '4px 12px', background: '#fff', color: '#7C3AED',
        borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none'
      }}>Upgrade →</a>
    </div>
  )
}

function AppShell({ user, handleLogout }) {
  const [showOnboarding, setShowOnboarding] = useState(user?.onboarded === false)
  const isAdminOrAuditor = ['admin', 'auditor'].includes(user?.role)
  const NAV = [...NAV_ALL, ...(isAdminOrAuditor ? NAV_ADMIN : [])]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', background: 'var(--bg)' }}>

      {showOnboarding && (
        <OnboardingWizard user={user} onComplete={() => setShowOnboarding(false)} />
      )}

      <MoonrockSidebar>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
          <img src="/logo.png" alt="ResponseOS" style={{ width: '100%', height: 52, objectFit: 'contain', objectPosition: 'left' }} />
        </div>

        <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8B7ABB', letterSpacing: '.1em', textTransform: 'uppercase', padding: '6px 8px', marginBottom: 4 }}>
            Platform
          </div>
          {NAV.map(n => {
            const Icon = n.icon
            return (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: '10px',
                  marginBottom: 2, textDecoration: 'none',
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#3B1FA8' : '#4A3B6A',
                  background: isActive ? 'linear-gradient(135deg, rgba(237,233,255,0.95), rgba(221,214,254,0.95))' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.6)' : 'none',
                  transition: 'all .12s'
                })}
              >
                {({ isActive }) => (
                  <>
                    <div style={{
                      width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : 'rgba(139,92,246,0.12)',
                      boxShadow: isActive ? '0 0 12px rgba(124,58,237,0.4)' : 'none',
                      transition: 'all .12s'
                    }}>
                      <Icon size={15} color={isActive ? '#fff' : '#7C3AED'} strokeWidth={2} />
                    </div>
                    <span style={{ flex: 1 }}>{n.label}</span>
                    {isActive && (
                      <div style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: '#7C3AED', boxShadow: '0 0 6px rgba(124,58,237,0.8)'
                      }} />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div style={{ padding: '0 12px' }}>
          <NavLink to="/profile" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 10px', borderRadius: '10px',
            background: isActive ? 'linear-gradient(135deg, rgba(237,233,255,0.95), rgba(221,214,254,0.95))' : 'rgba(139,92,246,0.06)',
            textDecoration: 'none', marginBottom: 8, transition: 'all .12s',
            border: '1px solid rgba(139,92,246,0.15)',
            boxShadow: isActive ? '0 2px 8px rgba(124,58,237,0.15)' : 'none'
          })}>
            <div style={{
              width: 30, height: 30, borderRadius: '8px',
              background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
              boxShadow: '0 0 10px rgba(124,58,237,0.4)'
            }}>
              {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1030', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>
                {user.role.toUpperCase()}
              </div>
            </div>
          </NavLink>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px', borderRadius: '8px',
            background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
            color: '#8B7ABB', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s'
          }}>Sign out</button>
        </div>
      </MoonrockSidebar>

      {/* White main content with purple underglow */}
      <main style={{
        flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column',
        background: 'var(--bg)', position: 'relative', zIndex: 1
      }}>
        {/* Purple underglow */}
        <div style={{
          position: 'fixed', bottom: 0, left: 240, right: 0, height: '40vh',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0
        }} />
        <div style={{
          position: 'fixed', top: 0, left: 240, right: 0, height: '30vh',
          background: 'radial-gradient(ellipse at 70% 0%, rgba(139,92,246,0.05) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0
        }} />

        <DemoBanner user={user} />

        {/* Top bar */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(139,92,246,0.1)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', gap: 10, flexShrink: 0,
          boxShadow: '0 1px 12px rgba(139,92,246,0.07)',
          position: 'relative', zIndex: 2
        }}>
          <Search />
          <NotificationBell />
        </div>

        <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', zIndex: 1 }}>
          <AnimatedRoutes />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {NAV_ALL.slice(0, 5).map(n => {
            const Icon = n.icon
            return (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}
                className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
              >
                <Icon size={22} strokeWidth={1.8} />
                <span>{n.label.split(' ')[0]}</span>
              </NavLink>
            )
          })}
          <NavLink to="/profile"
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <User size={22} strokeWidth={1.8} />
            <span>Profile</span>
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
          .from('users')
          .select('id, full_name, email, role, department, is_active, avatar_url, onboarded, is_demo, demo_expires_at, demo_company')
          .eq('id', session.user.id)
          .single()
        if (profile) setUser(profile)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') setUser(null)
      if (event === 'SIGNED_IN' && session) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, full_name, email, role, department, is_active, avatar_url, onboarded, is_demo, demo_expires_at, demo_company')
          .eq('id', session.user.id)
          .single()
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
      justifyContent: 'center', background: '#F5F3FF'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <img src="/logo.png" alt="ResponseOS" style={{ height: 52, objectFit: 'contain', marginBottom: 4 }} />
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid #EDE9FF', borderTopColor: '#7C3AED',
          animation: 'spin 0.8s linear infinite',
          boxShadow: '0 0 16px rgba(124,58,237,0.2)'
        }} />
        <div style={{ fontSize: 12, color: '#8B7ABB', fontFamily: 'Inter, sans-serif', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Loading
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home"     element={<Landing />} />
        <Route path="/login"    element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
        <Route path="/quote"    element={<Quote />} />
        <Route path="/hardware" element={<Hardware />} />
        <Route path="/demo"     element={<Demo />} />
        <Route path="/*"        element={user ? <AppShell user={user} handleLogout={handleLogout} /> : <Navigate to="/home" />} />
      </Routes>
    </BrowserRouter>
  )
}