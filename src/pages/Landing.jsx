import { useNavigate } from 'react-router-dom'
import { useRef, useEffect } from 'react'
import { ShieldCheck, CheckSquare, Bot, Bell, ScrollText, LayoutDashboard, Users, FolderLock } from 'lucide-react'

function StarField() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `
        radial-gradient(1px 1px at 8% 12%, rgba(255,255,255,0.9) 0%, transparent 100%),
        radial-gradient(1.5px 1.5px at 22% 38%, rgba(200,180,255,0.8) 0%, transparent 100%),
        radial-gradient(1px 1px at 38% 8%, rgba(255,255,255,0.7) 0%, transparent 100%),
        radial-gradient(2px 2px at 55% 28%, rgba(200,180,255,0.9) 0%, transparent 100%),
        radial-gradient(1px 1px at 72% 55%, rgba(255,255,255,0.8) 0%, transparent 100%),
        radial-gradient(1.5px 1.5px at 88% 15%, rgba(255,255,255,0.7) 0%, transparent 100%),
        radial-gradient(1px 1px at 12% 68%, rgba(200,180,255,0.6) 0%, transparent 100%),
        radial-gradient(2px 2px at 45% 78%, rgba(255,255,255,0.8) 0%, transparent 100%),
        radial-gradient(1px 1px at 65% 88%, rgba(200,180,255,0.7) 0%, transparent 100%),
        radial-gradient(1.5px 1.5px at 30% 52%, rgba(255,255,255,0.6) 0%, transparent 100%),
        radial-gradient(1px 1px at 85% 42%, rgba(200,180,255,0.8) 0%, transparent 100%),
        radial-gradient(2px 2px at 3% 48%, rgba(255,255,255,0.7) 0%, transparent 100%),
        radial-gradient(1px 1px at 58% 5%, rgba(255,255,255,0.9) 0%, transparent 100%),
        radial-gradient(1.5px 1.5px at 92% 72%, rgba(200,180,255,0.6) 0%, transparent 100%),
        radial-gradient(1px 1px at 18% 92%, rgba(255,255,255,0.7) 0%, transparent 100%),
        radial-gradient(2px 2px at 75% 20%, rgba(200,180,255,0.8) 0%, transparent 100%),
        radial-gradient(1px 1px at 42% 62%, rgba(255,255,255,0.5) 0%, transparent 100%),
        radial-gradient(1.5px 1.5px at 95% 35%, rgba(255,255,255,0.8) 0%, transparent 100%)
      `
    }} />
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ctx = el.getContext('2d')
    el.width = el.offsetWidth
    el.height = el.offsetHeight

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.4 + 0.2,
      o: Math.random() * 0.7 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.015 + 0.004,
      type: Math.floor(Math.random() * 3)
    }))

    let time = 0
    let animId

    function draw() {
      const w = el.width
      const h = el.height
      const cx = w * 0.62
      const cy = h * 0.45

      ctx.clearRect(0, 0, w, h)

      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h))
      bg.addColorStop(0,    'rgba(25,10,60,1)')
      bg.addColorStop(0.3,  'rgba(15,5,40,1)')
      bg.addColorStop(0.7,  'rgba(8,3,25,1)')
      bg.addColorStop(1,    'rgba(2,1,10,1)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

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
      })

      const nebulas = [
        { x: cx * 0.4, y: cy * 1.4, r: w * 0.35, c: 'rgba(80,20,160,0.08)' },
        { x: cx * 1.3, y: cy * 0.4, r: w * 0.3,  c: 'rgba(40,10,120,0.07)' },
      ]
      nebulas.forEach(n => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        g.addColorStop(0, n.c); g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
      })

      ctx.save()
      ctx.translate(cx, cy)
      for (let arm = 0; arm < 2; arm++) {
        const ao = (arm / 2) * Math.PI * 2
        for (let i = 0; i < 400; i++) {
          const t = i / 400
          const angle = t * Math.PI * 4 + ao + time * 0.002
          const radius = t * Math.min(w, h) * 0.38
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius * 0.44
          const alpha = (1 - t) * 0.1 * (0.5 + 0.5 * Math.sin(t * Math.PI))
          ctx.fillStyle = `rgba(140,100,255,${alpha})`
          ctx.beginPath()
          ctx.arc(x, y, (1 - t) * 1.8 + 0.3, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const coreLayers = [
        { r: 80,  c: 'rgba(255,255,255,0.04)' },
        { r: 40,  c: 'rgba(220,200,255,0.10)' },
        { r: 18,  c: 'rgba(200,170,255,0.25)' },
        { r: 6,   c: 'rgba(255,255,255,0.95)' },
      ]
      coreLayers.forEach(({ r, c }) => {
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r)
        g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill()
      })
      ctx.restore()

      time++
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  const btnPrimary = {
    padding: '13px 28px', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
    color: '#fff', border: 'none', borderRadius: '10px', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    boxShadow: '0 0 24px rgba(124,58,237,0.4)', transition: 'all .15s'
  }
  const btnGhost = {
    padding: '13px 24px', background: 'rgba(139,92,246,0.08)', color: '#C4B5FD',
    border: '1px solid rgba(139,92,246,0.25)', borderRadius: '10px', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s'
  }
  const btnOutline = {
    padding: '13px 24px', background: 'transparent', color: '#9B8ABB',
    border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s'
  }

  return (
    <div style={{ minHeight: '100vh', color: '#F0EEFF', fontFamily: 'Inter, system-ui, sans-serif', background: '#080612', position: 'relative', overflow: 'hidden' }}>

      {/* Galaxy canvas background */}
      <canvas ref={canvasRef} style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none'
      }} />

      {/* Nav */}
      <nav className="landing-nav" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 60px', borderBottom: '1px solid rgba(139,92,246,0.15)',
        background: 'rgba(8,6,18,0.85)', backdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 20px rgba(139,92,246,0.1)'
      }}>
        <img src="/logo.png" alt="ResponseOS" style={{ height: 44, objectFit: 'contain' }} />
        <div className="landing-nav-links" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="landing-nav-text" style={{ display: 'flex', gap: 24 }}>
            <a href="#features" style={{ fontSize: 14, color: '#9B8ABB', textDecoration: 'none', fontWeight: 500 }}>Features</a>
            <a href="#how" style={{ fontSize: 14, color: '#9B8ABB', textDecoration: 'none', fontWeight: 500 }}>How it works</a>
          </div>
          <button onClick={() => navigate('/demo')} style={btnGhost}>Request a demo</button>
          <button onClick={() => navigate('/quote')} style={btnPrimary}>Get a quote →</button>
          <button onClick={() => navigate('/login')} style={btnOutline}>Sign in</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero" style={{
        padding: '90px 60px 70px', maxWidth: 1100, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center',
        position: 'relative', zIndex: 1
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 99,
            background: 'rgba(139,92,246,0.15)', color: '#C4B5FD',
            fontSize: 12, fontWeight: 600, letterSpacing: '.04em',
            marginBottom: 24, border: '1px solid rgba(139,92,246,0.3)'
          }}>
            ◆ FERC · NERC CIP · OSHA · ISO 27001
          </div>
          <h1 style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.08, color: '#F0EEFF', marginBottom: 20, letterSpacing: '-.03em' }}>
            Always audit-ready.<br />
            <span style={{ background: 'linear-gradient(135deg, #8B5CF6, #C4B5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Always accountable.
            </span>
          </h1>
          <p style={{ fontSize: 18, color: '#9B8ABB', lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
            AI-powered compliance for energy, utility, and critical infrastructure teams. Monitor certifications, tasks, and security posture in real time.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/quote')} style={{ ...btnPrimary, fontSize: 16, padding: '15px 36px' }}>
              Get a quote →
            </button>
            <button onClick={() => navigate('/demo')} style={{ ...btnGhost, fontSize: 15, padding: '15px 28px' }}>
              Request a demo
            </button>
            <button onClick={() => navigate('/login')} style={{ ...btnOutline, fontSize: 15, padding: '15px 24px' }}>
              Sign in
            </button>
          </div>
          <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {['FERC Aligned', 'NERC CIP Ready', 'SOC 2 Compatible', 'ISO 27001'].map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7060AA', fontWeight: 500 }}>
                <span style={{ color: '#34D399', fontSize: 14 }}>✓</span> {b}
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="landing-hero-mockup" style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: -30,
            background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 70%)',
            borderRadius: 24, zIndex: 0
          }} />
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'rgba(18,10,42,0.9)',
            borderRadius: 16,
            border: '1px solid rgba(139,92,246,0.25)',
            boxShadow: '0 0 40px rgba(139,92,246,0.15), 0 20px 60px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            backdropFilter: 'blur(16px)'
          }}>
            {/* Mockup title bar */}
            <div style={{ background: 'rgba(8,4,20,0.9)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
              <img src="/logo.png" alt="ResponseOS" style={{ height: 20, objectFit: 'contain', marginLeft: 8 }} />
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Compliance', value: '84%', color: '#34D399', accent: null },
                  { label: 'Certifications', value: '18', color: '#F0EEFF', accent: '#8B5CF6' },
                  { label: 'Alerts', value: '3', color: '#F87171', accent: '#F87171' },
                ].map(m => (
                  <div key={m.label} style={{
                    background: 'rgba(30,15,60,0.6)', borderRadius: 8, padding: '12px',
                    border: '1px solid rgba(139,92,246,0.15)',
                    borderTop: m.accent ? `3px solid ${m.accent}` : '1px solid rgba(139,92,246,0.15)'
                  }}>
                    <div style={{ fontSize: 9, color: '#7060AA', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(30,15,60,0.6)', borderRadius: 8, padding: '10px', border: '1px solid rgba(139,92,246,0.15)', marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: '#7060AA', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Recent alerts</div>
                {[
                  { msg: 'OSHA cert expires in 6 days', color: '#F87171', tier: 'CRITICAL' },
                  { msg: 'Transformer inspection overdue', color: '#FBBF24', tier: 'WARNING' },
                  { msg: 'Monthly report ready to export', color: '#8B5CF6', tier: 'INFO' },
                ].map((al, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < 2 ? '1px solid rgba(139,92,246,0.1)' : 'none' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: al.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: '#9B8ABB', flex: 1 }}>{al.msg}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: al.color }}>{al.tier}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(30,15,60,0.6)', borderRadius: 8, padding: '10px', border: '1px solid rgba(139,92,246,0.15)' }}>
                <div style={{ fontSize: 9, color: '#7060AA', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Cert health</div>
                {[
                  { label: 'Valid', pct: 67, color: '#34D399' },
                  { label: 'Expiring', pct: 22, color: '#FBBF24' },
                  { label: 'Expired', pct: 11, color: '#F87171' },
                ].map(bar => (
                  <div key={bar.label} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7060AA', marginBottom: 3 }}>
                      <span>{bar.label}</span><span style={{ color: bar.color, fontWeight: 600 }}>{bar.pct}%</span>
                    </div>
                    <div style={{ background: 'rgba(139,92,246,0.15)', borderRadius: 99, height: 4 }}>
                      <div style={{ width: `${bar.pct}%`, height: 4, borderRadius: 99, background: bar.color, boxShadow: `0 0 6px ${bar.color}` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Floating badges */}
          <div style={{
            position: 'absolute', bottom: -16, left: -24, zIndex: 2,
            background: 'rgba(18,10,42,0.95)', borderRadius: 12, padding: '10px 14px',
            border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 20px rgba(139,92,246,0.2)',
            display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(12px)'
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={14} color="#8B5CF6" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#F0EEFF' }}>AI Risk Report</div>
              <div style={{ fontSize: 10, color: '#7060AA' }}>Sent every Monday 8am</div>
            </div>
          </div>
          <div style={{
            position: 'absolute', top: 60, right: -20, zIndex: 2,
            background: 'rgba(18,10,42,0.95)', borderRadius: 12, padding: '10px 14px',
            border: '1px solid rgba(52,211,153,0.3)', boxShadow: '0 0 16px rgba(52,211,153,0.15)',
            display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(12px)'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
            <div style={{ fontSize: 11, fontWeight: 600, color: '#F0EEFF' }}>Alert engine running</div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ borderTop: '1px solid rgba(139,92,246,0.12)', borderBottom: '1px solid rgba(139,92,246,0.12)', padding: '40px 60px', background: 'rgba(10,6,24,0.6)', backdropFilter: 'blur(12px)', position: 'relative', zIndex: 1 }}>
        <div className="landing-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          {[
            { value: '1hr',  label: 'Alert engine cycle time' },
            { value: '4',    label: 'Role-based access levels' },
            { value: '6',    label: 'Compliance frameworks' },
            { value: '100%', label: 'Audit-ready at all times' },
          ].map(s => (
            <div key={s.label}>
              <div className="stat-val" style={{ fontSize: 40, fontWeight: 800, background: 'linear-gradient(135deg, #8B5CF6, #C4B5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#7060AA', marginTop: 8, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Frameworks */}
      <section className="landing-frameworks" style={{ padding: '80px 60px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Compliance frameworks</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#F0EEFF', letterSpacing: '-.02em' }}>Built for regulated industries</h2>
          <p style={{ fontSize: 16, color: '#7060AA', marginTop: 12, maxWidth: 560, margin: '12px auto 0' }}>
            ResponseOS aligns with the major compliance and audit frameworks your industry requires.
          </p>
        </div>
        <div className="landing-frameworks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { name: 'ISO 9001 / 27001', icon: '◈', color: '#FBBF24', desc: 'International standards for quality management and information security.' },
            { name: 'HIPAA',            icon: '♥', color: '#F87171', desc: 'Protects sensitive patient health data in healthcare sectors.' },
            { name: 'PCI DSS',          icon: '◆', color: '#60A5FA', desc: 'Protects data associated with credit card use and payment processing.' },
            { name: 'GDPR',             icon: '★', color: '#818CF8', desc: 'Regulates data protection for organizations processing EU citizen data.' },
            { name: 'SOC 2 / AICPA',   icon: '≡', color: '#34D399', desc: 'Audits internal controls related to financial reporting and security.' },
            { name: 'OSHA',             icon: '▲', color: '#F87171', desc: 'Workplace safety standards — mandatory for energy and industrial teams.' },
          ].map(f => (
            <div key={f.name} style={{
              background: 'rgba(18,10,42,0.75)', border: '1px solid rgba(139,92,246,0.18)',
              borderRadius: 14, padding: '20px',
              display: 'flex', gap: 14, alignItems: 'flex-start',
              backdropFilter: 'blur(12px)', transition: 'all .15s'
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.18)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: 'rgba(139,92,246,0.1)', color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, border: '1px solid rgba(139,92,246,0.2)' }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: f.color, marginBottom: 5 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: '#7060AA', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '18px 28px', background: 'rgba(139,92,246,0.08)', borderRadius: 12, border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#C4B8E8' }}>ResponseOS helps you stay compliant with all major frameworks</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['FERC', 'NERC CIP', 'ISO', 'HIPAA', 'SOC 2', 'OSHA', 'GDPR', 'PCI DSS'].map(b => (
              <span key={b} style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(139,92,246,0.15)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.25)' }}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 60px', maxWidth: 1100, margin: '0 auto', borderTop: '1px solid rgba(139,92,246,0.12)', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Features</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#F0EEFF', letterSpacing: '-.02em' }}>Everything your compliance team needs</h2>
        </div>
        <div className="landing-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { icon: ShieldCheck,    title: 'Certification tracking',  desc: 'Track every employee credential with expiry countdowns, automatic status updates, and critical alerts before anything lapses.' },
            { icon: Bell,           title: 'Tiered alert engine',     desc: 'Automated hourly checks fire Info, Warning, and Critical alerts with escalation logic — nothing falls through the cracks.' },
            { icon: Bot,            title: 'AI compliance assistant', desc: 'Ask anything about FERC, NERC CIP, OSHA, or your own policies. Claude-powered answers grounded in your real platform data.' },
            { icon: LayoutDashboard,title: 'Live compliance score',   desc: 'A single score calculated in real time from expired certs, overdue tasks, and open alerts. Leadership sees everything instantly.' },
            { icon: ScrollText,     title: 'Immutable audit log',     desc: 'Every action time-stamped and tamper-protected. Export as CSV for FERC, NERC, or third-party auditors on demand.' },
            { icon: CheckSquare,    title: 'Weekly AI risk report',   desc: 'Every Monday, leadership receives an AI-generated risk briefing — top 3 risks, recommended actions, and score trend.' },
          ].map(f => {
            const Icon = f.icon
            return (
              <div key={f.title} style={{
                background: 'rgba(18,10,42,0.75)', border: '1px solid rgba(139,92,246,0.18)',
                borderRadius: 14, padding: '24px',
                backdropFilter: 'blur(12px)', transition: 'all .15s'
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(139,92,246,0.1)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.18)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}>
                  <Icon size={18} color="#fff" strokeWidth={2} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#F0EEFF', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#7060AA', lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ background: 'rgba(10,6,24,0.6)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(139,92,246,0.12)', borderBottom: '1px solid rgba(139,92,246,0.12)', padding: '80px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: '#F0EEFF', letterSpacing: '-.02em' }}>Set up in minutes. Audit-ready forever.</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { step: '01', title: 'Add your team', desc: 'Create accounts for every employee — assign roles so Admins, Supervisors, Employees, and Auditors each see exactly what they need.' },
              { step: '02', title: 'Log certifications and tasks', desc: 'Enter credentials, expiry dates, and compliance tasks. ResponseOS automatically monitors everything and flags issues before they become problems.' },
              { step: '03', title: 'Let the AI work', desc: 'The alert engine runs every hour. The AI assistant answers questions in real time. Every Monday, leadership gets an AI risk report in their inbox.' },
              { step: '04', title: 'Walk into any audit', desc: 'Export your immutable audit log, compliance report, and certification history in seconds. Auditors get read-only access — no disruption to operations.' },
            ].map((s, i) => (
              <div key={s.step} style={{ display: 'flex', gap: 24, padding: '28px 0', borderBottom: i < 3 ? '1px solid rgba(139,92,246,0.1)' : 'none' }}>
                <div style={{ fontSize: 28, fontWeight: 800, flexShrink: 0, width: 56, lineHeight: 1, fontFamily: 'IBM Plex Mono, monospace', background: 'linear-gradient(135deg, #8B5CF6, #C4B5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.step}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#F0EEFF', marginBottom: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: '#7060AA', lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section style={{ padding: '80px 60px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Role-based access</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#F0EEFF', letterSpacing: '-.02em' }}>Built for every person on your team</h2>
        </div>
        <div className="landing-roles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { role: 'Admin',      icon: Users,          color: '#8B5CF6', desc: 'Full platform control. Manage users, configure settings, and access every report.' },
            { role: 'Supervisor', icon: CheckSquare,    color: '#34D399', desc: 'Assign tasks, monitor team compliance, approve completed work.' },
            { role: 'Employee',   icon: ShieldCheck,    color: '#9B8ABB', desc: 'Complete tasks, manage your own certifications, and receive personal alerts.' },
            { role: 'Auditor',    icon: FolderLock,     color: '#FBBF24', desc: 'Read-only access to all logs, reports, and compliance history for review.' },
          ].map(r => {
            const Icon = r.icon
            return (
              <div key={r.role} style={{ background: 'rgba(18,10,42,0.75)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 14, padding: '24px 20px', textAlign: 'center', backdropFilter: 'blur(12px)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <Icon size={22} color={r.color} strokeWidth={2} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: r.color, marginBottom: 8 }}>{r.role}</div>
                <div style={{ fontSize: 13, color: '#7060AA', lineHeight: 1.6 }}>{r.desc}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Hardware teaser */}
      <section style={{ background: 'rgba(8,4,20,0.8)', padding: '72px 60px', textAlign: 'center', borderTop: '1px solid rgba(139,92,246,0.15)', position: 'relative', zIndex: 1, backdropFilter: 'blur(12px)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 99,
          background: 'rgba(139,92,246,0.15)', color: '#C4B5FD',
          fontSize: 12, fontWeight: 600, letterSpacing: '.04em',
          marginBottom: 20, border: '1px solid rgba(139,92,246,0.3)'
        }}>
          🚧 Coming soon — Hardware Suite
        </div>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#F0EEFF', marginBottom: 14, letterSpacing: '-.02em' }}>
          ResponseOS is going physical.
        </h2>
        <p style={{ fontSize: 16, color: '#7060AA', marginBottom: 32, maxWidth: 520, margin: '0 auto 32px' }}>
          Site kiosks, biometric access terminals, and IoT sensor integration — bringing compliance intelligence directly to your job sites.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Site Kiosks', 'Biometric Terminals', 'IoT Sensors', 'Badge Scanners'].map(item => (
            <div key={item} style={{ padding: '8px 16px', borderRadius: 99, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', fontSize: 13, color: '#7060AA', fontWeight: 500 }}>
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(88,28,235,0.9))', backdropFilter: 'blur(16px)', padding: '80px 60px', textAlign: 'center', borderTop: '1px solid rgba(139,92,246,0.3)', position: 'relative', zIndex: 1 }}>
        <img src="/logo.png" alt="ResponseOS" style={{ height: 48, objectFit: 'contain', marginBottom: 28, filter: 'brightness(0) invert(1)' }} />
        <h2 style={{ fontSize: 44, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '-.02em' }}>
          Ready to get audit-ready?
        </h2>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
          Tell us about your team and we'll put together a custom compliance plan within 24 hours.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/quote')} style={{
            padding: '18px 48px', background: '#fff', color: '#7C3AED',
            border: 'none', borderRadius: '10px', fontSize: 17, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>Get a custom quote →</button>
          <button onClick={() => navigate('/demo')} style={{
            padding: '18px 36px', background: 'rgba(255,255,255,0.12)', color: '#fff',
            border: '2px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>Request a demo</button>
          <button onClick={() => navigate('/login')} style={{
            padding: '18px 36px', background: 'transparent', color: 'rgba(255,255,255,0.7)',
            border: '2px solid rgba(255,255,255,0.2)', borderRadius: '10px', fontSize: 16, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>Sign in</button>
        </div>
        <div style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
          No spam. No commitment. Response within 24 hours.
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px 60px', borderTop: '1px solid rgba(139,92,246,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(8,4,20,0.9)', backdropFilter: 'blur(12px)', position: 'relative', zIndex: 1 }}>
        <img src="/logo.png" alt="ResponseOS" style={{ height: 36, objectFit: 'contain' }} />
        <div style={{ fontSize: 12, color: '#6060AA', fontWeight: 500 }}>© 2026 ResponseOS · Houston, TX</div>
        <div style={{ fontSize: 12, color: '#6060AA', fontWeight: 500 }}>responseos.net</div>
      </footer>

    </div>
  )
}