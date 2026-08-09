import { useState, useEffect, useRef } from 'react'
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
import DocumentVault from './pages/DocumentVault'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Quote from './pages/Quote'
import Hardware from './pages/Hardware'
import Search from './components/Search'
import NotificationBell from './components/NotificationBell'
import PageTransition from './components/PageTransition'
import OnboardingWizard from './components/OnboardingWizard'
import './index.css'

const NAV_ALL = [
  { to: '/',        icon: '▣', label: 'Dashboard'      },
  { to: '/certs',   icon: '◈', label: 'Certifications' },
  { to: '/tasks',   icon: '◎', label: 'Tasks'          },
  { to: '/alerts',  icon: '△', label: 'Alerts'         },
  { to: '/ai',      icon: '◆', label: 'AI Assistant'   },
  { to: '/audit',   icon: '≡', label: 'Audit Log'      },
]

const NAV_ADMIN = [
  { to: '/docs',    icon: '📁', label: 'Document Vault' },
  { to: '/users',   icon: '◉', label: 'Users'          },
]

function GalaxyBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ctx = el.getContext('2d')

    function resize() {
      el.width = window.innerWidth
      el.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const stars = Array.from({ length: 320 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.3,
      o: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.005,
      type: Math.floor(Math.random() * 3)
    }))

    let comet = null
    let cometCountdown = 45 * 60

    function spawnComet(w, h) {
      const fromTop = Math.random() > 0.5
      return {
        x: fromTop ? Math.random() * w * 0.6 : -30,
        y: fromTop ? -30 : Math.random() * h * 0.4,
        vx: 7 + Math.random() * 5,
        vy: 4 + Math.random() * 4,
        size: Math.random() * 2.5 + 1.5,
        tail: [],
        alpha: 1
      }
    }

    function drawComet(ctx, c) {
      c.tail.push({ x: c.x, y: c.y })
      if (c.tail.length > 40) c.tail.shift()

      // Draw tail
      for (let i = 0; i < c.tail.length; i++) {
        const t = i / c.tail.length
        const alpha = t * c.alpha * 0.8
        const r = t * c.size * 1.5
        const grad = ctx.createRadialGradient(c.tail[i].x, c.tail[i].y, 0, c.tail[i].x, c.tail[i].y, r + 2)
        grad.addColorStop(0, `rgba(220,200,255,${alpha})`)
        grad.addColorStop(0.4, `rgba(160,120,255,${alpha * 0.5})`)
        grad.addColorStop(1, 'rgba(100,60,255,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(c.tail[i].x, c.tail[i].y, r + 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw head
      const headGrad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size * 4)
      headGrad.addColorStop(0, `rgba(255,255,255,${c.alpha})`)
      headGrad.addColorStop(0.3, `rgba(220,200,255,${c.alpha * 0.8})`)
      headGrad.addColorStop(1, 'rgba(139,92,246,0)')
      ctx.fillStyle = headGrad
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.size * 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = `rgba(255,255,255,${c.alpha})`
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2)
      ctx.fill()
    }

    let time = 0
    let animId
    let frame = 0

    function draw() {
      const w = el.width
      const h = el.height
      const cx = w * 0.58
      const cy = h * 0.40

      ctx.clearRect(0, 0, w, h)

      // Deep space background
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 1.1)
      bg.addColorStop(0,    'rgba(25,10,60,1)')
      bg.addColorStop(0.25, 'rgba(15,5,40,1)')
      bg.addColorStop(0.6,  'rgba(8,3,25,1)')
      bg.addColorStop(1,    'rgba(2,1,10,1)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // Twinkling stars
      stars.forEach(s => {
        s.twinkle += s.speed
        const alpha = s.o * (0.5 + 0.5 * Math.sin(s.twinkle))
        const x = s.x * w
        const y = s.y * h
        const colors = [
          `rgba(255,255,255,${alpha})`,
          `rgba(180,200,255,${alpha})`,
          `rgba(200,160,255,${alpha})`
        ]
        ctx.fillStyle = colors[s.type]
        ctx.beginPath()
        ctx.arc(x, y, s.r, 0, Math.PI * 2)
        ctx.fill()
        if (s.r > 1.2) {
          ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.3})`
          ctx.lineWidth = 0.4
          ctx.beginPath()
          ctx.moveTo(x - s.r * 3, y)
          ctx.lineTo(x + s.r * 3, y)
          ctx.moveTo(x, y - s.r * 3)
          ctx.lineTo(x, y + s.r * 3)
          ctx.stroke()
        }
      })

      // Nebula clouds
      const nebulas = [
        { x: cx * 0.4,  y: cy * 1.4,  r: w * 0.4,  c: 'rgba(80,20,160,0.09)'  },
        { x: cx * 1.35, y: cy * 0.4,  r: w * 0.35, c: 'rgba(40,10,120,0.08)'  },
        { x: cx * 0.2,  y: cy * 0.3,  r: w * 0.25, c: 'rgba(60,15,140,0.06)'  },
        { x: cx * 1.1,  y: cy * 1.6,  r: w * 0.3,  c: 'rgba(100,30,180,0.05)' },
      ]
      nebulas.forEach(n => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        g.addColorStop(0, n.c)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      })

      // Outer spiral glow
      ctx.save()
      ctx.translate(cx, cy)
      const outerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(w, h) * 0.68)
      outerGlow.addColorStop(0,   'rgba(180,140,255,0.0)')
      outerGlow.addColorStop(0.3, 'rgba(88,28,235,0.07)')
      outerGlow.addColorStop(1,   'rgba(20,5,60,0.0)')
      ctx.fillStyle = outerGlow
      ctx.beginPath()
      ctx.arc(0, 0, Math.min(w, h) * 0.68, 0, Math.PI * 2)
      ctx.fill()

      // Spiral arms
      for (let arm = 0; arm < 2; arm++) {
        const armOffset = (arm / 2) * Math.PI * 2
        for (let i = 0; i < 800; i++) {
          const t = i / 800
          const angle = t * Math.PI * 4 + armOffset + time * 0.003
          const radius = t * Math.min(w, h) * 0.62
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius * 0.44
          const spread = radius * 0.20
          const dx = Math.sin(i * 7.3) * spread * 0.5
          const dy = Math.cos(i * 5.7) * spread * 0.22
          const alpha = (1 - t) * 0.13 * (0.5 + 0.5 * Math.sin(t * Math.PI))
          const size = (1 - t) * 2.2 + 0.3
          ctx.fillStyle = arm === 0
            ? `rgba(150,110,255,${alpha})`
            : `rgba(110,70,230,${alpha * 0.8})`
          ctx.beginPath()
          ctx.arc(x + dx, y + dy, size, 0, Math.PI * 2)
          ctx.fill()
        }

        // Bright stars along arms
        for (let i = 0; i < 140; i++) {
          const t = i / 140
          const angle = t * Math.PI * 4 + armOffset + time * 0.003
          const radius = t * Math.min(w, h) * 0.60
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius * 0.44
          const alpha = (1 - t) * 0.65
          ctx.fillStyle = `rgba(230,210,255,${alpha * 0.6})`
          ctx.beginPath()
          ctx.arc(x, y, 0.9, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.restore()

      // Core glow
      const coreLayers = [
        { r: 150, c: 'rgba(255,255,255,0.04)' },
        { r: 90,  c: 'rgba(220,200,255,0.10)' },
        { r: 45,  c: 'rgba(200,170,255,0.22)' },
        { r: 20,  c: 'rgba(240,230,255,0.55)' },
        { r: 7,   c: 'rgba(255,255,255,0.95)' },
      ]
      coreLayers.forEach(({ r, c }) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        g.addColorStop(0, c)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
      })

      // Comet logic
      cometCountdown--
      if (cometCountdown <= 0 && !comet) {
        comet = spawnComet(w, h)
        cometCountdown = 45 * 60
      }

      if (comet) {
        drawComet(ctx, comet)
        comet.x += comet.vx
        comet.y += comet.vy

        // Fade out near edges
        if (comet.x > w * 0.85 || comet.y > h * 0.85) {
          comet.alpha -= 0.02
        }

        if (comet.x > w + 50 || comet.y > h + 50 || comet.alpha <= 0) {
          comet = null
        }
      }

      time += 1
      frame++
      animId = requestAnimationFrame(draw)
    }

    // Spawn first comet after 5 seconds
    setTimeout(() => {
      comet = spawnComet(el.width, el.height)
    }, 5000)

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
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
        <Route path="/users"   element={<PageTransition><Users /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

function AppShell({ user, handleLogout }) {
  const [showOnboarding, setShowOnboarding] = useState(user?.onboarded === false)
  const isAdminOrAuditor = ['admin', 'auditor'].includes(user?.role)
  const NAV = [...NAV_ALL, ...(isAdminOrAuditor ? NAV_ADMIN : [])]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>

      <GalaxyBackground />

      {showOnboarding && (
        <OnboardingWizard user={user} onComplete={() => setShowOnboarding(false)} />
      )}

      {/* White moonrock sidebar */}
      <aside className="sidebar" style={{
        width: 240, flexShrink: 0, zIndex: 10,
        background: 'linear-gradient(160deg, #FDFCFF 0%, #F5F0FF 50%, #EEE8FF 100%)',
        display: 'flex', flexDirection: 'column',
        padding: '0 0 20px',
        borderRight: '1px solid rgba(139,92,246,0.15)',
        boxShadow: '4px 0 30px rgba(0,0,0,0.4), inset -1px 0 0 rgba(139,92,246,0.1)'
      }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
          <img src="/logo.png" alt="ResponseOS" style={{ width: '100%', height: 52, objectFit: 'contain', objectPosition: 'left' }} />
        </div>
        <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9B8ABB', letterSpacing: '.1em', textTransform: 'uppercase', padding: '6px 8px', marginBottom: 4 }}>
            Platform
          </div>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: '8px',
                marginBottom: 2, textDecoration: 'none',
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#fff' : '#5B4B7A',
                background: isActive ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : 'transparent',
                boxShadow: isActive ? '0 0 16px rgba(124,58,237,0.4)' : 'none',
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
            background: isActive ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : 'rgba(139,92,246,0.08)',
            textDecoration: 'none', marginBottom: 8, transition: 'all .12s',
            border: '1px solid rgba(139,92,246,0.15)',
            boxShadow: isActive ? '0 0 16px rgba(124,58,237,0.4)' : 'none'
          })}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
              boxShadow: '0 0 10px rgba(124,58,237,0.4)'
            }}>
              {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1030', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600 }}>
                {user.role.toUpperCase()}
              </div>
            </div>
          </NavLink>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px', borderRadius: '8px',
            background: 'transparent', border: '1px solid rgba(139,92,246,0.2)',
            color: '#9B8ABB', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s'
          }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Galaxy main content */}
      <main style={{
        flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column',
        background: 'transparent', position: 'relative', zIndex: 1
      }}>
        <div style={{
          padding: '12px 28px',
          borderBottom: '1px solid rgba(139,92,246,0.15)',
          background: 'rgba(8,6,18,0.7)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', gap: 10, flexShrink: 0,
          boxShadow: '0 1px 20px rgba(139,92,246,0.1)'
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
          {NAV_ALL.slice(0, 6).map(n => (
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
          .from('users')
          .select('id, full_name, email, role, department, is_active, avatar_url, onboarded')
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
          .select('id, full_name, email, role, department, is_active, avatar_url, onboarded')
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
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080612', position: 'relative' }}>
      <GalaxyBackground />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '2px solid rgba(139,92,246,0.3)', borderTopColor: '#8B5CF6',
          animation: 'spin 0.8s linear infinite',
          boxShadow: '0 0 20px rgba(139,92,246,0.4)'
        }} />
        <div style={{ fontSize: 13, color: 'rgba(139,92,246,0.7)', fontFamily: 'Inter, sans-serif', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>
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
        <Route path="/*"        element={user ? <AppShell user={user} handleLogout={handleLogout} /> : <Navigate to="/home" />} />
      </Routes>
    </BrowserRouter>
  )
}