import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font)' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 60px', borderBottom: '0.5px solid var(--border)',
        background: 'rgba(10,22,40,0.8)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, letterSpacing: '.04em' }}>
          Response<span style={{ color: 'var(--blue)' }}>OS</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="#features" style={{ fontSize: 14, color: 'var(--text2)', textDecoration: 'none' }}>Features</a>
          <a href="#how" style={{ fontSize: 14, color: 'var(--text2)', textDecoration: 'none' }}>How it works</a>
          <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '8px 20px' }}>
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '120px 60px 100px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', padding: '5px 14px', borderRadius: 99,
          background: 'var(--blue-dim)', color: '#93C5FD',
          fontSize: 12, fontWeight: 500, letterSpacing: '.04em',
          marginBottom: 24, border: '0.5px solid rgba(37,99,235,0.3)'
        }}>
          FERC · NERC CIP · OSHA · ISO 27001
        </div>
        <h1 style={{
          fontSize: 58, fontWeight: 700, lineHeight: 1.1,
          color: 'var(--text)', marginBottom: 24, letterSpacing: '-.02em'
        }}>
          Always audit-ready.<br />
          <span style={{ color: 'var(--blue)' }}>Always accountable.</span>
        </h1>
        <p style={{
          fontSize: 20, color: 'var(--text2)', lineHeight: 1.7,
          maxWidth: 620, margin: '0 auto 40px'
        }}>
          ResponseOS is an AI-powered compliance platform for energy, utility, and critical infrastructure teams. Monitor certifications, tasks, and security posture in real time.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
            Get started →
          </button>
          <a href="#features" style={{
            padding: '14px 32px', fontSize: 16, borderRadius: 'var(--radius)',
            border: '0.5px solid var(--border2)', color: 'var(--text2)',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center'
          }}>
            See features
          </a>
        </div>
      </section>

      {/* Stats */}
      <section style={{
        background: 'var(--surface)',
        borderTop: '0.5px solid var(--border)',
        borderBottom: '0.5px solid var(--border)',
        padding: '48px 60px'
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 32, maxWidth: 900, margin: '0 auto', textAlign: 'center'
        }}>
          {[
            { value: '1hr',   label: 'Alert engine cycle time' },
            { value: '4',     label: 'Role-based access levels' },
            { value: '6',     label: 'Compliance frameworks' },
            { value: '100%',  label: 'Audit-ready at all times' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 42, fontWeight: 700, color: 'var(--blue)', fontFamily: 'var(--mono)', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '100px 60px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Features
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' }}>
            Everything your compliance team needs
          </h2>
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
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              borderRadius: 12, padding: '28px 24px', transition: 'border-color .15s'
            }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--blue)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--blue-dim)', color: '#93C5FD',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, marginBottom: 16
              }}>
                {f.icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{
        background: 'var(--surface)',
        borderTop: '0.5px solid var(--border)',
        borderBottom: '0.5px solid var(--border)',
        padding: '100px 60px'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              How it works
            </div>
            <h2 style={{ fontSize: 40, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' }}>
              Set up in minutes. Audit-ready forever.
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { step: '01', title: 'Add your team', desc: 'Create accounts for every employee — assign roles so Admins, Supervisors, Employees, and Auditors each see exactly what they need.' },
              { step: '02', title: 'Log certifications and tasks', desc: 'Enter credentials, expiry dates, and compliance tasks. ResponseOS automatically monitors everything and flags issues before they become problems.' },
              { step: '03', title: 'Let the AI work', desc: 'The alert engine runs every hour. The AI assistant answers questions in real time. Every Monday, leadership gets an AI risk report in their inbox.' },
              { step: '04', title: 'Walk into any audit', desc: 'Export your immutable audit log, compliance report, and certification history in seconds. Auditors get read-only access — no disruption to operations.' },
            ].map((s, i) => (
              <div key={s.step} style={{
                display: 'flex', gap: 24, padding: '32px 0',
                borderBottom: i < 3 ? '0.5px solid var(--border)' : 'none'
              }}>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 700,
                  color: 'var(--blue-dim)', flexShrink: 0, width: 60, lineHeight: 1
                }}>
                  {s.step}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section style={{ padding: '100px 60px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Role-based access
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' }}>
            Built for every person on your team
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { role: 'Admin', icon: '◉', color: '#93C5FD', bg: 'var(--blue-dim)', desc: 'Full platform control. Manage users, configure settings, and access every report.' },
            { role: 'Supervisor', icon: '◈', color: '#6EE7B7', bg: 'var(--green-dim)', desc: 'Assign tasks, monitor team compliance, approve completed work.' },
            { role: 'Employee', icon: '○', color: 'var(--text2)', bg: 'var(--surface3)', desc: 'Complete tasks, manage your own certifications, and receive personal alerts.' },
            { role: 'Auditor', icon: '≡', color: '#FCD34D', bg: 'var(--amber-dim)', desc: 'Read-only access to all logs, reports, and compliance history for review.' },
          ].map(r => (
            <div key={r.role} style={{
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              borderRadius: 12, padding: '24px 20px', textAlign: 'center'
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: r.bg, color: r.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, margin: '0 auto 14px'
              }}>
                {r.icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: r.color, marginBottom: 8 }}>{r.role}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: 'var(--surface)', borderTop: '0.5px solid var(--border)',
        padding: '100px 60px', textAlign: 'center'
      }}>
        <h2 style={{ fontSize: 42, fontWeight: 700, color: 'var(--text)', marginBottom: 16, letterSpacing: '-.02em' }}>
          Ready to get audit-ready?
        </h2>
        <p style={{ fontSize: 18, color: 'var(--text2)', marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
          Join energy and infrastructure teams using ResponseOS to stay compliant, 24/7.
        </p>
        <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '16px 40px', fontSize: 16 }}>
          Sign in to ResponseOS →
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px 60px', borderTop: '0.5px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500, color: 'var(--text2)' }}>
          Response<span style={{ color: 'var(--blue)' }}>OS</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>© 2026 ResponseOS · Built by VALE Co</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>responseos.netlify.app</div>
      </footer>

    </div>
  )
}