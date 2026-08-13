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
      borderRight: '1px solid rgba(139,92,246,0.2)',
      boxShadow: '4px 0 30px rgba(0,0,0,0.5)',
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
      x: Math.random(), y: Math.random(),
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
        tail: [], alpha: 1
      }
    }

    function drawComet(ctx, c) {
      c.tail.push({ x: c.x, y: c.y })
      if (c.tail.length > 40) c.tail.shift()
      for (let i = 0; i < c.tail.length; i++) {
        const t = i / c.tail.length
        const alpha = t * c.alpha * 0.8
        const r = t * c.size * 1.5
        const g = ctx.createRadialGradient(c.tail[i].x, c.tail[i].y, 0, c.tail[i].x, c.tail[i].y, r + 2)
        g.addColorStop(0, `rgba(220,200,255,${alpha})`)
        g.addColorStop(0.4, `rgba(160,120,255,${alpha * 0.5})`)
        g.addColorStop(1, 'rgba(100,60,255,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(c.tail[i].x, c.tail[i].y, r + 2, 0, Math.PI * 2)
        ctx.fill()
      }
      const hg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size * 4)
      hg.addColorStop(0, `rgba(255,255,255,${c.alpha})`)
      hg.addColorStop(0.3, `rgba(220,200,255,${c.alpha * 0.8})`)
      hg.addColorStop(1, 'rgba(139,92,246,0)')
      ctx.fillStyle = hg
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

    function draw() {
      const w = el.width
      const h = el.height
      const cx = w * 0.58
      const cy = h * 0.40

      ctx.clearRect(0, 0, w, h)

      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 1.1)
      bg.addColorStop(0, 'rgba(25,10,60,1)')
      bg.addColorStop(0.25, 'rgba(15,5,40,1)')
      bg.addColorStop(0.6, 'rgba(8,3,25,1)')
      bg.addColorStop(1, 'rgba(2,1,10,1)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      stars.forEach(s => {
        s.twinkle += s.speed
        const alpha = s.o * (0.5 + 0.5 * Math.sin(s.twinkle))
        const x = s.x * w
        const y = s.y * h
        const colors = [`rgba(255,255,255,${alpha})`, `rgba(180,200,255,${alpha})`, `rgba(200,160,255,${alpha})`]
        ctx.fillStyle = colors[s.type]
        ctx.beginPath()
        ctx.arc(x, y, s.r, 0, Math.PI * 2)
        ctx.fill()
        if (s.r > 1.2) {
          ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.3})`
          ctx.lineWidth = 0.4
          ctx.beginPath()
          ctx.moveTo(x - s.r * 3, y); ctx.lineTo(x + s.r * 3, y)
          ctx.moveTo(x, y - s.r * 3); ctx.lineTo(x, y + s.r * 3)
          ctx.stroke()
        }
      })

      const nebulas = [
        { x: cx * 0.4,  y: cy * 1.4, r: w * 0.4,  c: 'rgba(80,20,160,0.09)' },
        { x: cx * 1.35, y: cy * 0.4, r: w * 0.35, c: 'rgba(40,10,120,0.08)' },
        { x: cx * 0.2,  y: cy * 0.3, r: w * 0.25, c: 'rgba(60,15,140,0.06)' },
        { x: cx * 1.1,  y: cy * 1.6, r: w * 0.3,  c: 'rgba(100,30,180,0.05)' },
      ]
      nebulas.forEach(n => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        g.addColorStop(0, n.c); g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
      })

      ctx.save()
      ctx.translate(cx, cy)
      const og = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(w, h) * 0.68)
      og.addColorStop(0, 'rgba(180,140,255,0.0)')
      og.addColorStop(0.3, 'rgba(88,28,235,0.07)')
      og.addColorStop(1, 'rgba(20,5,60,0.0)')
      ctx.fillStyle = og
      ctx.beginPath()
      ctx.arc(0, 0, Math.min(w, h) * 0.68, 0, Math.PI * 2)
      ctx.fill()

      for (let arm = 0; arm < 2; arm++) {
        const ao = (arm / 2) * Math.PI * 2
        for (let i = 0; i < 800; i++) {
          const t = i / 800
          const angle = t * Math.PI * 4 + ao + time * 0.003
          const radius = t * Math.min(w, h) * 0.62
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius * 0.44
          const spread = radius * 0.20
          const dx = Math.sin(i * 7.3) * spread * 0.5
          const dy = Math.cos(i * 5.7) * spread * 0.22
          const alpha = (1 - t) * 0.13 * (0.5 + 0.5 * Math.sin(t * Math.PI))
          const size = (1 - t) * 2.2 + 0.3
          ctx.fillStyle = arm === 0 ? `rgba(150,110,255,${alpha})` : `rgba(110,70,230,${alpha * 0.8})`
          ctx.beginPath()
          ctx.arc(x + dx, y + dy, size, 0, Math.PI * 2)
          ctx.fill()
        }
        for (let i = 0; i < 140; i++) {
          const t = i / 140
          const angle = t * Math.PI * 4 + ao + time * 0.003
          const radius = t * Math.min(w, h) * 0.60
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius * 0.44
          ctx.fillStyle = `rgba(230,210,255,${(1 - t) * 0.4})`
          ctx.beginPath()
          ctx.arc(x, y, 0.9, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.restore()

      const coreLayers = [
        { r: 150, c: 'rgba(255,255,255,0.04)' },
        { r: 90,  c: 'rgba(220,200,255,0.10)' },
        { r: 45,  c: 'rgba(200,170,255,0.22)' },
        { r: 20,  c: 'rgba(240,230,255,0.55)' },
        { r: 7,   c: 'rgba(255,255,255,0.95)' },
      ]
      coreLayers.forEach(({ r, c }) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
      })

      cometCountdown--
      if (cometCountdown <= 0 && !comet) {
        comet = spawnComet(w, h)
        cometCountdown = 45 * 60
      }
      if (comet) {
        drawComet(ctx, comet)
        comet.x += comet.vx
        comet.y += comet.vy
        if (comet.x > w * 0.85 || comet.y > h * 0.85) comet.alpha -= 0.02
        if (comet.x > w + 50 || comet.y > h + 50 || comet.alpha <= 0) comet = null
      }

      time += 1
      animId = requestAnimationFrame(draw)
    }

    setTimeout(() => { comet = spawnComet(el.width, el.height) }, 5000)
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
      background: 'linear-gradient(90deg, rgba(124,58,237,0.9), rgba(88,28,235,0.9))',
      backdropFilter: 'blur(12px)',
      padding: '8px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0, zIndex: 10,
      borderBottom: '1px solid rgba(139,92,246,0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#EDE9FF', fontWeight: 600 }}>
        <span>🚀</span>
        <span>Demo mode — <strong>{daysLeft} days</strong> remaining</span>
      </div>
      <a href="/quote" style={{
        padding: '4px 12px', background: '#fff', color: '#7C3AED',
        borderRadius: 6, fontSize: 11, fontWeight: 700,
        textDecoration: 'none'
      }}>
        Upgrade →
      </a>
    </div>
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
                  background: isActive ? 'linear-gradient(135deg, rgba(237,233,255,0.9), rgba(221,214,254,0.9))' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.5)' : 'none',
                  transition: 'all .12s',
                  backdropFilter: isActive ? 'blur(8px)' : 'none'
                })}
              >
                {({ isActive }) => (
                  <>
                    <div style={{
                      width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive
                        ? 'linear-gradient(135deg, #7C3AED, #5B21B6)'
                        : 'rgba(139,92,246,0.14)',
                      boxShadow: isActive
                        ? '0 0 12px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.4)',
                      transition: 'all .12s'
                    }}>
                      <Icon size={15} color={isActive ? '#fff' : '#7C3AED'} strokeWidth={2} />
                    </div>
                    <span style={{ flex: 1 }}>{n.label}</span>
                    {isActive && (
                      <div style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: '#7C3AED',
                        boxShadow: '0 0 6px rgba(124,58,237,0.8)'
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
            background: isActive
              ? 'linear-gradient(135deg, rgba(237,233,255,0.9), rgba(221,214,254,0.9))'
              : 'rgba(139,92,246,0.08)',
            textDecoration: 'none', marginBottom: 8, transition: 'all .12s',
            border: '1px solid rgba(139,92,246,0.15)',
            boxShadow: isActive ? '0 2px 8px rgba(124,58,237,0.2)' : 'inset 0 1px 0 rgba(255,255,255,0.4)'
          })}>
            <div style={{
              width: 30, height: 30, borderRadius: '8px',
              background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
              boxShadow: '0 0 10px rgba(124,58,237,0.5)'
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
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.2)',
            color: '#8B7ABB', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)'
          }}>
            Sign out
          </button>
        </div>
      </MoonrockSidebar>

      <main style={{
        flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column',
        background: 'transparent', position: 'relative', zIndex: 1
      }}>
        <DemoBanner user={user} />
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(139,92,246,0.15)',
          background: 'rgba(8,6,18,0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', gap: 10, flexShrink: 0,
          boxShadow: '0 1px 20px rgba(139,92,246,0.1)'
        }}>
          <Search />
          <NotificationBell />
        </div>
        <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <AnimatedRoutes />
        </div>
      </main>

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
        <Route path="/demo"     element={<Demo />} />
        <Route path="/*"        element={user ? <AppShell user={user} handleLogout={handleLogout} /> : <Navigate to="/home" />} />
      </Routes>
    </BrowserRouter>
  )
}