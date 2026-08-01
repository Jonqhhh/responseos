import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ background: '#F8F9FC', minHeight: '100vh', color: '#0F1117', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 60px', borderBottom: '1px solid #E4E6EF',
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <img src="/logo.svg" alt="ResponseOS" style={{ height: 44, objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="#features" style={{ fontSize: 14, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>Features</a>
          <a href="#how" style={{ fontSize: 14, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>How it works</a>
          <button onClick={() => navigate('/quote')} style={{
            padding: '9px 18px', background: '#EEF0FF', color: '#6B4EFF',
            border: '1px solid #C7C0FF', borderRadius: '8px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>Get a quote</button>
          <button onClick={() => navigate('/login')} style={{
            padding: '9px 22px', background: '#6B4EFF', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            boxShadow: '0 1px 2px rgba(107,78,255,0.3)'
          }}>Sign in</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        padding: '80px 60px 60px', maxWidth: 1100, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center'
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 99,
            background: '#EEF0FF', color: '#6B4EFF',
            fontSize: 12, fontWeight: 600, letterSpacing: '.04em',
            marginBottom: 24, border: '1px solid #C7C0FF'
          }}>
            ◆ FERC · NERC CIP · OSHA · ISO 27001
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, color: '#0F1117', marginBottom: 20, letterSpacing: '-.03em' }}>
            Always audit-ready.<br />
            <span style={{ color: '#6B4EFF' }}>Always accountable.</span>
          </h1>
          <p style={{ fontSize: 18, color: '#6B7280', lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
            AI-powered compliance for energy, utility, and critical infrastructure teams. Monitor certifications, tasks, and security posture in real time.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/quote')} style={{
              padding: '13px 28px', background: '#6B4EFF', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 12px rgba(107,78,255,0.3)'
            }}>Get a quote →</button>
            <button onClick={() => navigate('/login')} style={{
              padding: '13px 28px', background: '#fff', color: '#6B7280',
              border: '1px solid #E4E6EF', borderRadius: '8px', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif'
            }}>Sign in</button>
            <a href="#features" style={{
              padding: '13px 28px', fontSize: 15, fontWeight: 600,
              borderRadius: '8px', border: '1px solid #E4E6EF',
              color: '#6B7280', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', background: '#fff'
            }}>See features</a>
          </div>
          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {['FERC Aligned', 'NERC CIP Ready', 'SOC 2 Compatible', 'ISO 27001'].map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
                <span style={{ color: '#059669', fontSize: 14 }}>✓</span> {b}
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: -20,
            background: 'radial-gradient(ellipse at center, rgba(107,78,255,0.1) 0%, transparent 70%)',
            borderRadius: 24, zIndex: 0
          }} />
          <div style={{
            position: 'relative', zIndex: 1, background: '#fff', borderRadius: 16,
            border: '1px solid #E4E6EF',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <div style={{ background: '#1C1C1E', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
              <img src="/logo.svg" alt="ResponseOS" style={{ height: 20, objectFit: 'contain', marginLeft: 8 }} />
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Compliance', value: '84%', sub: '↑ 3pts this week', color: '#059669', accent: null },
                  { label: 'Certifications', value: '18', sub: '4 expiring soon', color: '#0F1117', accent: '#6B4EFF' },
                  { label: 'Alerts', value: '3', sub: '1 critical unread', color: '#DC2626', accent: '#DC2626' },
                ].map(m => (
                  <div key={m.label} style={{
                    background: '#F8F9FC', borderRadius: 8, padding: '12px',
                    border: '1px solid #E4E6EF',
                    borderTop: m.accent ? `3px solid ${m.accent}` : '1px solid #E4E6EF'
                  }}>
                    <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{m.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#F8F9FC', borderRadius: 8, padding: '10px', border: '1px solid #E4E6EF', marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Recent alerts</div>
                {[
                  { msg: 'OSHA cert expires in 6 days', color: '#DC2626', tier: 'CRITICAL' },
                  { msg: 'Transformer inspection overdue', color: '#D97706', tier: 'WARNING' },
                  { msg: 'Monthly report ready to export', color: '#6B4EFF', tier: 'INFO' },
                ].map((al, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < 2 ? '1px solid #E4E6EF' : 'none' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: al.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: '#6B7280', flex: 1 }}>{al.msg}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: al.color }}>{al.tier}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#F8F9FC', borderRadius: 8, padding: '10px', border: '1px solid #E4E6EF' }}>
                <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Cert health</div>
                {[
                  { label: 'Valid', pct: 67, color: '#059669' },
                  { label: 'Expiring', pct: 22, color: '#D97706' },
                  { label: 'Expired', pct: 11, color: '#DC2626' },
                ].map(bar => (
                  <div key={bar.label} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF', marginBottom: 3 }}>
                      <span>{bar.label}</span><span style={{ color: bar.color, fontWeight: 600 }}>{bar.pct}%</span>
                    </div>
                    <div style={{ background: '#E4E6EF', borderRadius: 99, height: 4 }}>
                      <div style={{ width: `${bar.pct}%`, height: 4, borderRadius: 99, background: bar.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{
            position: 'absolute', bottom: -16, left: -24, zIndex: 2,
            background: '#fff', borderRadius: 12, padding: '10px 14px',
            border: '1px solid #E4E6EF', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#6B4EFF' }}>◆</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0F1117' }}>AI Risk Report</div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>Sent every Monday 8am</div>
            </div>
          </div>
          <div style={{
            position: 'absolute', top: 60, right: -20, zIndex: 2,
            background: '#fff', borderRadius: 12, padding: '10px 14px',
            border: '1px solid #E4E6EF', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
            <div style={{ fontSize: 11, fontWeight: 600, color: '#0F1117' }}>Alert engine running</div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: '#fff', borderTop: '1px solid #E4E6EF', borderBottom: '1px solid #E4E6EF', padding: '40px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          {[
            { value: '1hr',  label: 'Alert engine cycle time' },
            { value: '4',    label: 'Role-based access levels' },
            { value: '6',    label: 'Compliance frameworks' },
            { value: '100%', label: 'Audit-ready at all times' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 40, fontWeight: 800, color: '#6B4EFF', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 8, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance Frameworks */}
      <section style={{ padding: '80px 60px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B4EFF', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Compliance frameworks</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#0F1117', letterSpacing: '-.02em' }}>Built for regulated industries</h2>
          <p style={{ fontSize: 16, color: '#6B7280', marginTop: 12, maxWidth: 560, margin: '12px auto 0' }}>
            ResponseOS aligns with the major compliance and audit frameworks your industry requires.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
          {[
            { name: 'ISO 9001 / 27001', icon: '◈', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', desc: 'International standards for quality management and information security across industries.' },
            { name: 'HIPAA', icon: '♥', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', desc: 'Protects sensitive patient health data used in healthcare sectors and covered entities.' },
            { name: 'PCI DSS', icon: '◆', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', desc: 'Protects critical data associated with credit card use and payment processing.' },
            { name: 'GDPR', icon: '★', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', desc: 'Regulates data protection measures in business organizations that process EU citizen data.' },
            { name: 'SOC 2 / AICPA', icon: '≡', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', desc: 'Audits internal controls and processes related to financial reporting and information security.' },
            { name: 'OSHA', icon: '▲', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', desc: 'Associated with the safety and health of workplaces — mandatory for energy and industrial teams.' },
          ].map(f => (
            <div key={f.name} style={{
              background: '#fff', border: `1px solid ${f.border}`,
              borderRadius: 14, padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              display: 'flex', gap: 16, alignItems: 'flex-start',
              transition: 'all .15s', cursor: 'default'
            }}
              onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                background: f.bg, color: f.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, border: `2px solid ${f.border}`
              }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: f.color, marginBottom: 6 }}>{f.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          padding: '20px 32px', background: '#1C1C1E', borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>ResponseOS helps you stay compliant with all major frameworks</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['FERC', 'NERC CIP', 'ISO', 'HIPAA', 'SOC 2', 'OSHA', 'GDPR', 'PCI DSS'].map(b => (
              <span key={b} style={{
                padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                background: 'rgba(107,78,255,0.2)', color: '#A78BFA', border: '1px solid rgba(107,78,255,0.3)'
              }}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 60px', maxWidth: 1100, margin: '0 auto', background: '#fff', borderTop: '1px solid #E4E6EF' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B4EFF', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Features</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#0F1117', letterSpacing: '-.02em' }}>Everything your compliance team needs</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { icon: '◈', title: 'Certification tracking', desc: 'Track every employee credential with expiry countdowns, automatic status updates, and critical alerts before anything lapses.' },
            { icon: '△', title: 'Tiered alert engine', desc: 'Automated hourly checks fire Info, Warning, and Critical alerts with 48-hour escalation logic — nothing falls through the cracks.' },
            { icon: '◆', title: 'AI compliance assistant', desc: 'Ask anything about FERC, NERC CIP, OSHA, or your own policies. Claude-powered answers grounded in your real platform data.' },
            { icon: '▣', title: 'Live compliance score', desc: 'A single score calculated in real time from expired certs, overdue tasks, and open alerts. Leadership sees the full picture instantly.' },
            { icon: '≡', title: 'Immutable audit log', desc: 'Every action time-stamped and tamper-protected. Export as CSV for FERC, NERC, or third-party auditors on demand.' },
            { icon: '◎', title: 'Weekly AI risk report', desc: 'Every Monday, leadership receives an AI-generated risk briefing — top 3 risks, recommended actions, and compliance score trend.' },
          ].map(f => (
            <div key={f.title} style={{
              background: '#F8F9FC', border: '1px solid #E4E6EF',
              borderRadius: 14, padding: '28px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all .15s', cursor: 'default'
            }}
              onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(107,78,255,0.12)'; e.currentTarget.style.borderColor = '#C7C0FF' }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#E4E6EF' }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EEF0FF', color: '#6B4EFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16 }}>
                {f.icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1117', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ background: '#F8F9FC', borderTop: '1px solid #E4E6EF', borderBottom: '1px solid #E4E6EF', padding: '80px 60px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B4EFF', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: '#0F1117', letterSpacing: '-.02em' }}>Set up in minutes. Audit-ready forever.</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { step: '01', title: 'Add your team', desc: 'Create accounts for every employee — assign roles so Admins, Supervisors, Employees, and Auditors each see exactly what they need.' },
              { step: '02', title: 'Log certifications and tasks', desc: 'Enter credentials, expiry dates, and compliance tasks. ResponseOS automatically monitors everything and flags issues before they become problems.' },
              { step: '03', title: 'Let the AI work', desc: 'The alert engine runs every hour. The AI assistant answers questions in real time. Every Monday, leadership gets an AI risk report in their inbox.' },
              { step: '04', title: 'Walk into any audit', desc: 'Export your immutable audit log, compliance report, and certification history in seconds. Auditors get read-only access — no disruption to operations.' },
            ].map((s, i) => (
              <div key={s.step} style={{ display: 'flex', gap: 24, padding: '28px 0', borderBottom: i < 3 ? '1px solid #E4E6EF' : 'none' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#EEF0FF', flexShrink: 0, width: 56, lineHeight: 1, fontFamily: 'IBM Plex Mono, monospace', WebkitTextStroke: '1px #C7C0FF' }}>
                  {s.step}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#0F1117', marginBottom: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section style={{ padding: '80px 60px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B4EFF', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Role-based access</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#0F1117', letterSpacing: '-.02em' }}>Built for every person on your team</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { role: 'Admin', icon: '◉', color: '#6B4EFF', bg: '#EEF0FF', desc: 'Full platform control. Manage users, configure settings, and access every report.' },
            { role: 'Supervisor', icon: '◈', color: '#059669', bg: '#ECFDF5', desc: 'Assign tasks, monitor team compliance, approve completed work.' },
            { role: 'Employee', icon: '○', color: '#6B7280', bg: '#F3F4F8', desc: 'Complete tasks, manage your own certifications, and receive personal alerts.' },
            { role: 'Auditor', icon: '≡', color: '#D97706', bg: '#FFFBEB', desc: 'Read-only access to all logs, reports, and compliance history for review.' },
          ].map(r => (
            <div key={r.role} style={{ background: '#fff', border: '1px solid #E4E6EF', borderRadius: 14, padding: '24px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: r.bg, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px', fontWeight: 700 }}>
                {r.icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: r.color, marginBottom: 8 }}>{r.role}</div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1C1C1E', padding: '80px 60px', textAlign: 'center' }}>
        <img src="/logo.svg" alt="ResponseOS" style={{ height: 48, objectFit: 'contain', marginBottom: 28 }} />
        <h2 style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '-.02em' }}>
          Ready to get audit-ready?
        </h2>
        <p style={{ fontSize: 18, color: '#71717A', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
          Join energy and infrastructure teams using ResponseOS to stay compliant, 24/7.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/quote')} style={{
            padding: '16px 40px', background: '#6B4EFF', color: '#fff',
            border: 'none', borderRadius: '10px', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 20px rgba(107,78,255,0.4)'
          }}>Get a quote →</button>
          <button onClick={() => navigate('/login')} style={{
            padding: '16px 40px', background: 'transparent', color: '#fff',
            border: '1px solid #3F3F46', borderRadius: '10px', fontSize: 16, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>Sign in</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px 60px', borderTop: '1px solid #E4E6EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
        <img src="/logo.svg" alt="ResponseOS" style={{ height: 36, objectFit: 'contain' }} />
        <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>© 2026 ResponseOS · Built by ResponseOS · Houston, TX</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>responseos.netlify.app</div>
      </footer>

    </div>
  )
}