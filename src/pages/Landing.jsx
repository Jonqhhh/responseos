import { useNavigate } from 'react-router-dom'
import { ShieldCheck, CheckSquare, Bot, Bell, ScrollText, LayoutDashboard, Users, FolderLock, ClipboardList } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  const btnPrimary = {
    padding: '12px 28px', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
    color: '#fff', border: 'none', borderRadius: '10px', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    boxShadow: '0 4px 16px rgba(124,58,237,0.3)', transition: 'all .15s'
  }
  const btnGhost = {
    padding: '12px 22px', background: '#fff', color: '#7C3AED',
    border: '1.5px solid rgba(124,58,237,0.3)', borderRadius: '10px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s'
  }
  const btnOutline = {
    padding: '12px 22px', background: 'transparent', color: '#6B7280',
    border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s'
  }

  const FEATURES = [
    { icon: ShieldCheck,     title: 'Certification Tracking',   desc: 'Track every employee credential with expiry countdowns, automatic status updates, and tiered alerts before anything lapses.' },
    { icon: Bell,            title: 'Tiered Alert Engine',      desc: 'Automated hourly checks fire Critical, Warning, and Info alerts with escalation logic — nothing falls through the cracks.' },
    { icon: Bot,             title: 'AI Compliance Assistant',  desc: 'Ask anything about FERC, NERC CIP, OSHA, or your own policies. Claude-powered answers grounded in your live platform data.' },
    { icon: ClipboardList,   title: 'Training Tracker',         desc: 'Log daily and quarterly training sessions by topic, instructor, and participant. Track hours, set goals, and export training records as PDF.' },
    { icon: LayoutDashboard, title: 'Live Compliance Score',    desc: 'A single score calculated in real time from expired certs, overdue tasks, and open alerts. Leadership sees the full picture instantly.' },
    { icon: ScrollText,      title: 'Immutable Audit Log',      desc: 'Every action time-stamped and tamper-protected. Export as CSV for FERC, NERC, or third-party auditors on demand.' },
    { icon: CheckSquare,     title: 'Task Management',          desc: 'Assign inspections, checklists, and compliance tasks to team members with due dates, types, and status tracking.' },
    { icon: FolderLock,      title: 'Document Vault',           desc: 'Secure storage for policies, audit reports, and certifications — role-restricted access with upload, search, and download.' },
    { icon: Users,           title: 'Weekly AI Risk Report',    desc: 'Every Monday, leadership receives an AI-generated risk briefing — top risks, recommended actions, and compliance score trend.' },
  ]

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', background: '#F5F3FF', color: '#111827' }}>

      {/* Purple underglow */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '60vh', zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 60% 0%, rgba(139,92,246,0.07) 0%, transparent 65%)'
      }} />

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 60px', borderBottom: '1px solid #E5E7EB',
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 8px rgba(139,92,246,0.06)'
      }}>
        <img src="/logo.png" alt="ResponseOS" style={{ height: 44, objectFit: 'contain' }} />
        <div className="landing-nav-links" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="landing-nav-text" style={{ display: 'flex', gap: 28, marginRight: 8 }}>
            <a href="#features" style={{ fontSize: 14, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>Features</a>
            <a href="#training" style={{ fontSize: 14, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>Training</a>
            <a href="#how" style={{ fontSize: 14, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>How it works</a>
          </div>
          <button onClick={() => navigate('/demo')} style={btnGhost}>Request a demo</button>
          <button onClick={() => navigate('/quote')} style={btnPrimary}>Get a quote →</button>
          <button onClick={() => navigate('/login')} style={btnOutline}>Sign in</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero" style={{
        padding: '96px 60px 80px', maxWidth: 1100, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center',
        position: 'relative', zIndex: 1
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 99,
            background: '#F5F3FF', color: '#7C3AED',
            fontSize: 12, fontWeight: 600, letterSpacing: '.04em',
            marginBottom: 24, border: '1px solid #DDD6FE'
          }}>
            ◆ FERC · NERC CIP · OSHA · ISO 27001
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, color: '#111827', marginBottom: 20, letterSpacing: '-.03em' }}>
            Always audit-ready.<br />
            <span style={{ color: '#7C3AED' }}>Always accountable.</span>
          </h1>
          <p style={{ fontSize: 18, color: '#6B7280', lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
            AI-powered compliance and training management for energy, utility, and critical infrastructure teams.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/quote')} style={{ ...btnPrimary, fontSize: 16, padding: '15px 36px' }}>Get a quote →</button>
            <button onClick={() => navigate('/demo')} style={{ ...btnGhost, fontSize: 15, padding: '15px 28px' }}>Request a demo</button>
            <button onClick={() => navigate('/login')} style={{ ...btnOutline, fontSize: 15, padding: '15px 24px' }}>Sign in</button>
          </div>
          <div style={{ marginTop: 36, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {['FERC Aligned', 'NERC CIP Ready', 'Training Tracked', 'ISO 27001'].map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
                <span style={{ color: '#059669' }}>✓</span> {b}
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="landing-hero-mockup" style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: -20,
            background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 70%)',
            borderRadius: 24, zIndex: 0
          }} />
          <div style={{
            position: 'relative', zIndex: 1, background: '#fff', borderRadius: 16,
            border: '1px solid #E5E7EB',
            boxShadow: '0 20px 60px rgba(139,92,246,0.1), 0 4px 16px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            {/* Mockup title bar — matches dark sidebar */}
            <div style={{ background: '#13082A', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
              <img src="/logo.png" alt="ResponseOS" style={{ height: 20, objectFit: 'contain', marginLeft: 8 }} />
            </div>
            <div style={{ display: 'flex' }}>
              {/* Mini sidebar */}
              <div style={{ width: 44, background: '#13082A', padding: '8px 7px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[LayoutDashboard, ShieldCheck, CheckSquare, ClipboardList, Bell].map((Icon, i) => (
                  <div key={i} style={{
                    width: 30, height: 30, borderRadius: 7,
                    background: i === 0 ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : 'rgba(139,92,246,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={13} color={i === 0 ? '#fff' : '#A78BFA'} strokeWidth={2} />
                  </div>
                ))}
              </div>
              {/* Content */}
              <div style={{ flex: 1, padding: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                  {[
                    { label: 'Compliance', value: '84%', color: '#059669', accent: null },
                    { label: 'Certifications', value: '18', color: '#111827', accent: '#7C3AED' },
                    { label: 'Alerts', value: '3', color: '#DC2626', accent: '#DC2626' },
                  ].map(m => (
                    <div key={m.label} style={{
                      background: '#F9FAFB', borderRadius: 7, padding: '8px',
                      border: '1px solid #E5E7EB',
                      borderTop: m.accent ? `2px solid ${m.accent}` : '1px solid #E5E7EB'
                    }}>
                      <div style={{ fontSize: 8, color: '#9CA3AF', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 3 }}>{m.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: 7, padding: '8px', border: '1px solid #E5E7EB', marginBottom: 6 }}>
                  <div style={{ fontSize: 8, color: '#9CA3AF', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5 }}>Training hours this week</div>
                  {[
                    { name: 'Fire', hrs: 4, color: '#DC2626' },
                    { name: 'Hazmat', hrs: 2, color: '#D97706' },
                    { name: 'Medical', hrs: 3, color: '#059669' },
                  ].map(t => (
                    <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 9, color: '#6B7280', width: 40 }}>{t.name}</span>
                      <div style={{ flex: 1, background: '#E5E7EB', borderRadius: 99, height: 4 }}>
                        <div style={{ width: `${(t.hrs / 4) * 100}%`, height: 4, borderRadius: 99, background: t.color }} />
                      </div>
                      <span style={{ fontSize: 9, color: t.color, fontWeight: 700 }}>{t.hrs}h</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: 7, padding: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: 8, color: '#9CA3AF', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5 }}>Recent alerts</div>
                  {[
                    { msg: 'OSHA cert expires in 6 days', color: '#DC2626', tier: 'CRITICAL' },
                    { msg: 'Q3 training goal not met', color: '#D97706', tier: 'WARNING' },
                    { msg: 'Monthly report ready', color: '#7C3AED', tier: 'INFO' },
                  ].map((al, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: i < 2 ? '1px solid #E5E7EB' : 'none' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: al.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 9, color: '#6B7280', flex: 1 }}>{al.msg}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: al.color }}>{al.tier}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Floating badges */}
          <div style={{
            position: 'absolute', bottom: -16, left: -20, zIndex: 2,
            background: '#fff', borderRadius: 10, padding: '10px 14px',
            border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(139,92,246,0.12)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={14} color="#7C3AED" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>AI Risk Report</div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>Sent every Monday 8am</div>
            </div>
          </div>
          <div style={{
            position: 'absolute', top: 56, right: -16, zIndex: 2,
            background: '#fff', borderRadius: 10, padding: '8px 12px',
            border: '1px solid #D1FAE5', boxShadow: '0 4px 12px rgba(5,150,105,0.1)',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669' }} />
            <div style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>Alert engine running</div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: '#fff', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: '36px 60px', position: 'relative', zIndex: 1 }}>
        <div className="landing-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          {[
            { value: '1hr',  label: 'Alert engine cycle time' },
            { value: '4',    label: 'Role-based access levels' },
            { value: '8+',   label: 'Compliance frameworks'   },
            { value: '100%', label: 'Audit-ready at all times' },
          ].map(s => (
            <div key={s.label}>
              <div className="stat-val" style={{ fontSize: 38, fontWeight: 800, color: '#7C3AED', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 60px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Platform features</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#111827', letterSpacing: '-.02em' }}>Everything your compliance team needs</h2>
          <p style={{ fontSize: 16, color: '#6B7280', marginTop: 12, maxWidth: 560, margin: '12px auto 0' }}>
            One platform for certifications, training, tasks, alerts, and audits.
          </p>
        </div>
        <div className="landing-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {FEATURES.map(f => {
            const Icon = f.icon
            return (
              <div key={f.title} style={{
                background: '#fff', border: '1px solid #E5E7EB',
                borderRadius: 14, padding: '24px',
                boxShadow: '0 1px 4px rgba(139,92,246,0.06)', transition: 'all .15s'
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#DDD6FE'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,92,246,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(139,92,246,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}>
                  <Icon size={18} color="#fff" strokeWidth={2} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Training Tracker deep dive */}
      <section id="training" style={{ background: '#fff', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: '80px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Training tracker</div>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', letterSpacing: '-.02em', marginBottom: 16 }}>
                Every training session — logged, tracked, and exportable.
              </h2>
              <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.7, marginBottom: 28 }}>
                Track daily and quarterly training across Fire, Hazmat, Rescue, and Medical categories. Set goals, monitor progress, and export branded PDF records for compliance files.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '🔥', title: 'Fire',    topics: 'Extinguisher, SCBA, Foam Operations, Drills' },
                  { icon: '☣️', title: 'Hazmat',  topics: 'ERG, Air Monitoring, Decon, Spill Control' },
                  { icon: '🪢', title: 'Rescue',  topics: 'High-Angle, Confined Space, Rope Systems' },
                  { icon: '🏥', title: 'Medical', topics: 'CPR, AED, First Aid, Trauma Scenarios' },
                ].map(t => (
                  <div key={t.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{t.title}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{t.topics}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: ClipboardList, title: 'Log training sessions',   desc: 'Record topic, date, time, instructor, location, participants, and duration.' },
                { icon: Users,         title: 'Track individual hours',  desc: 'See total training hours per employee broken down by category.' },
                { icon: Bell,          title: 'Goal alerts',             desc: 'Set daily and quarterly targets. Get alerted when teams fall behind.' },
                { icon: ScrollText,    title: 'Export PDF records',      desc: 'Each session exports as a branded PDF with signature lines and a unique session ID.' },
                { icon: Bot,           title: 'Monday training summary', desc: 'Weekly AI summary showing training progress, gaps, and upcoming quarterly sessions.' },
              ].map(f => {
                const Icon = f.icon
                return (
                  <div key={f.title} style={{ display: 'flex', gap: 14, padding: '14px', background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color="#7C3AED" strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{f.title}</div>
                      <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{f.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Frameworks */}
      <section style={{ padding: '80px 60px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Compliance frameworks</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#111827', letterSpacing: '-.02em' }}>Built for regulated industries</h2>
        </div>
        <div className="landing-frameworks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { name: 'ISO 9001 / 27001', icon: '◈', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', desc: 'International standards for quality management and information security.' },
            { name: 'HIPAA',            icon: '♥', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', desc: 'Protects sensitive patient health data used in healthcare sectors.' },
            { name: 'PCI DSS',          icon: '◆', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', desc: 'Protects data associated with credit card use and payment processing.' },
            { name: 'GDPR',             icon: '★', color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE', desc: 'Regulates data protection for organizations processing EU citizen data.' },
            { name: 'SOC 2 / AICPA',   icon: '≡', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', desc: 'Audits internal controls related to financial reporting and security.' },
            { name: 'OSHA',             icon: '▲', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', desc: 'Workplace safety standards — mandatory for energy and industrial teams.' },
          ].map(f => (
            <div key={f.name} style={{
              background: '#fff', border: `1px solid ${f.border}`,
              borderRadius: 12, padding: '18px 20px',
              display: 'flex', gap: 14, alignItems: 'flex-start',
              transition: 'all .15s'
            }}
              onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, border: `1.5px solid ${f.border}` }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: f.color, marginBottom: 4 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 24px', background: '#13082A', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>ResponseOS aligns with all major compliance frameworks</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['FERC', 'NERC CIP', 'ISO', 'HIPAA', 'SOC 2', 'OSHA', 'GDPR', 'PCI DSS'].map(b => (
              <span key={b} style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(139,92,246,0.2)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ background: '#fff', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: '80px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: '#111827', letterSpacing: '-.02em' }}>Set up in minutes. Audit-ready forever.</h2>
          </div>
          {[
            { step: '01', title: 'Add your team', desc: 'Create accounts for every employee — assign roles so Admins, Supervisors, Employees, and Auditors each see exactly what they need.' },
            { step: '02', title: 'Log certifications and training', desc: 'Enter credentials, expiry dates, and training sessions by topic and category. ResponseOS monitors everything and flags issues before they become problems.' },
            { step: '03', title: 'Let the AI work', desc: 'The alert engine runs every hour. The AI assistant answers questions in real time. Every Monday, leadership gets an AI risk and training summary in their inbox.' },
            { step: '04', title: 'Walk into any audit', desc: 'Export your immutable audit log, training records, compliance report, and certification history in seconds.' },
          ].map((s, i) => (
            <div key={s.step} style={{ display: 'flex', gap: 24, padding: '28px 0', borderBottom: i < 3 ? '1px solid #E5E7EB' : 'none' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#DDD6FE', flexShrink: 0, width: 52, lineHeight: 1, fontFamily: 'IBM Plex Mono, monospace', WebkitTextStroke: '1px #C4B5FD' }}>
                {s.step}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section style={{ padding: '80px 60px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Role-based access</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#111827', letterSpacing: '-.02em' }}>Built for every person on your team</h2>
        </div>
        <div className="landing-roles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { role: 'Admin',      icon: Users,       color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', desc: 'Full platform control. Manage users, configure settings, and access every report.' },
            { role: 'Supervisor', icon: CheckSquare, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', desc: 'Assign tasks, log training sessions, monitor team compliance and training goals.' },
            { role: 'Employee',   icon: ShieldCheck, color: '#374151', bg: '#F9FAFB', border: '#E5E7EB', desc: 'Complete tasks, manage your own certifications, and view personal training history.' },
            { role: 'Auditor',    icon: FolderLock,  color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', desc: 'Read-only access to all logs, reports, training records, and compliance history.' },
          ].map(r => {
            const Icon = r.icon
            return (
              <div key={r.role} style={{ background: '#fff', border: `1px solid ${r.border}`, borderRadius: 14, padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: `1px solid ${r.border}` }}>
                  <Icon size={22} color={r.color} strokeWidth={2} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: r.color, marginBottom: 8 }}>{r.role}</div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{r.desc}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Hardware teaser */}
      <section style={{ background: '#13082A', padding: '64px 60px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 99, background: 'rgba(139,92,246,0.2)', color: '#C4B5FD', fontSize: 12, fontWeight: 600, marginBottom: 20, border: '1px solid rgba(139,92,246,0.3)' }}>
          🚧 Coming soon — Hardware Suite
        </div>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-.02em' }}>ResponseOS is going physical.</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 500, margin: '0 auto 28px' }}>
          Site kiosks, biometric terminals, and IoT sensors — bringing compliance intelligence directly to your job sites.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Site Kiosks', 'Biometric Terminals', 'IoT Sensors', 'Badge Scanners'].map(item => (
            <div key={item} style={{ padding: '7px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', padding: '80px 60px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <img src="/logo.png" alt="ResponseOS" style={{ height: 48, objectFit: 'contain', marginBottom: 28, filter: 'brightness(0) invert(1)' }} />
        <h2 style={{ fontSize: 44, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '-.02em' }}>Ready to get audit-ready?</h2>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
          Tell us about your team and we'll build a custom compliance and training plan within 24 hours.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/quote')} style={{ padding: '18px 48px', background: '#fff', color: '#7C3AED', border: 'none', borderRadius: '10px', fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            Get a custom quote →
          </button>
          <button onClick={() => navigate('/demo')} style={{ padding: '18px 36px', background: 'rgba(255,255,255,0.12)', color: '#fff', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Request a demo
          </button>
          <button onClick={() => navigate('/login')} style={{ padding: '18px 36px', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '10px', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Sign in
          </button>
        </div>
        <div style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          No spam. No commitment. Response within 24 hours.
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 60px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', position: 'relative', zIndex: 1 }}>
        <img src="/logo.png" alt="ResponseOS" style={{ height: 36, objectFit: 'contain' }} />
        <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>© 2026 ResponseOS · Houston, TX</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>responseos.net</div>
      </footer>

    </div>
  )
}