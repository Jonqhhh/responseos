import { useNavigate } from 'react-router-dom'

export default function Hardware() {
  const navigate = useNavigate()

  return (
    <div style={{ background: '#0F0A2E', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: '#fff' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 60px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(15,10,46,0.9)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <img src="/logo.png" alt="ResponseOS" onClick={() => navigate('/home')}
          style={{ height: 44, objectFit: 'contain', cursor: 'pointer' }} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => navigate('/home')} style={{
            padding: '9px 18px', background: 'transparent', color: '#A1A1AA',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontSize: 14,
            fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>← Back</button>
          <button onClick={() => navigate('/quote')} style={{
            padding: '9px 22px', background: '#6B4EFF', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>Get a quote</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '80px 60px 60px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 99,
          background: 'rgba(107,78,255,0.2)', color: '#A78BFA',
          fontSize: 12, fontWeight: 600, letterSpacing: '.04em',
          marginBottom: 24, border: '1px solid rgba(107,78,255,0.3)'
        }}>
          ◆ Future Vision — Hardware Suite
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-.03em', marginBottom: 20 }}>
          ResponseOS goes<br />
          <span style={{ color: '#6B4EFF' }}>beyond the screen.</span>
        </h1>
        <p style={{ fontSize: 18, color: '#A1A1AA', lineHeight: 1.7, maxWidth: 620, margin: '0 auto 48px' }}>
          The future of compliance is physical. ResponseOS is building a hardware suite that brings real-time compliance intelligence directly to your job sites, facilities, and field teams.
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 10,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          fontSize: 13, color: '#71717A', fontWeight: 500
        }}>
          🚧 Hardware suite currently in development — software platform available now
        </div>
      </section>

      {/* Timeline */}
      <section style={{ padding: '40px 60px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B4EFF', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 48, textAlign: 'center' }}>
          Development roadmap
        </div>

        {[
          {
            phase: 'Phase 1',
            status: 'live',
            title: 'ResponseOS Software Platform',
            date: '2025–2026',
            color: '#059669',
            bg: '#ECFDF5',
            border: '#A7F3D0',
            desc: 'The foundation. Cloud-based compliance and audit management with AI assistant, automated alerts, certification tracking, and immutable audit logs. Live at responseos.netlify.app.',
            items: [
              'AI-powered compliance assistant',
              'Real-time certification tracking',
              'Automated hourly alert engine',
              'Weekly AI risk reports',
              'FERC-ready immutable audit log',
              'Mobile responsive for field teams',
            ]
          },
          {
            phase: 'Phase 2',
            status: 'upcoming',
            title: 'Site Tablet & Kiosk Mode',
            date: '2026–2027',
            color: '#6B4EFF',
            bg: '#EEF0FF',
            border: '#C7C0FF',
            desc: 'A ruggedized tablet or wall-mounted kiosk installed at job site entrances and control rooms. Workers interact with ResponseOS directly on-site — no laptop required.',
            items: [
              'Ruggedized tablet hardware (IP65 rated)',
              'Wall-mounted kiosk enclosures',
              'Offline-first sync for low connectivity sites',
              'Digital signature capture for compliance sign-offs',
              'Daily safety briefing display',
              'QR code cert verification',
            ]
          },
          {
            phase: 'Phase 3',
            status: 'upcoming',
            title: 'Biometric Access Terminals',
            date: '2027',
            color: '#D97706',
            bg: '#FFFBEB',
            border: '#FDE68A',
            desc: 'Physical terminals at facility entrances that verify worker identity and certifications in real time before granting site access. No valid cert — no entry.',
            items: [
              'Fingerprint and facial recognition',
              'Real-time cert verification on entry',
              'Automatic denial if cert expired',
              'Attendance and access logging',
              'Integration with ResponseOS dashboard',
              'NERC CIP physical access compliance',
            ]
          },
          {
            phase: 'Phase 4',
            status: 'upcoming',
            title: 'IoT Sensor Integration',
            date: '2027–2028',
            color: '#DC2626',
            bg: '#FEF2F2',
            border: '#FECACA',
            desc: 'Connect physical equipment sensors directly to ResponseOS. Anomaly detection fires compliance alerts automatically when readings fall outside acceptable ranges.',
            items: [
              'Equipment sensor connectivity (MQTT/OPC-UA)',
              'Real-time anomaly detection',
              'Automatic compliance alerts from sensor data',
              'Predictive maintenance scheduling',
              'Environmental monitoring (air, water, temp)',
              'SCADA and DCS integration',
            ]
          },
          {
            phase: 'Phase 5',
            status: 'vision',
            title: 'ResponseOS Hardware Suite',
            date: '2028+',
            color: '#6B4EFF',
            bg: '#EEF0FF',
            border: '#C7C0FF',
            desc: 'The complete ResponseOS hardware ecosystem — branded devices, unified firmware, and a single dashboard connecting your entire facility. The compliance operating system for critical infrastructure.',
            items: [
              'Branded ResponseOS hardware devices',
              'Unified firmware and remote management',
              'Multi-site hardware fleet management',
              'Hardware-as-a-Service subscription model',
              'API marketplace for third-party integrations',
              'Series A hardware manufacturing partnership',
            ]
          },
        ].map((p, i) => (
          <div key={p.phase} style={{
            display: 'flex', gap: 32, marginBottom: 48,
            opacity: p.status === 'vision' ? 0.7 : 1
          }}>
            {/* Timeline line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: p.status === 'live' ? p.bg : '#1C1C2E',
                border: `2px solid ${p.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, color: p.color,
                boxShadow: p.status === 'live' ? `0 0 20px ${p.color}40` : 'none'
              }}>
                {p.status === 'live' ? '✓' : i + 1}
              </div>
              {i < 4 && (
                <div style={{
                  width: 2, flex: 1, marginTop: 8,
                  background: `linear-gradient(to bottom, ${p.color}40, transparent)`,
                  minHeight: 40
                }} />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: p.color, letterSpacing: '.06em', textTransform: 'uppercase' }}>{p.phase}</span>
                <span style={{
                  padding: '2px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                  background: p.status === 'live' ? '#ECFDF5' : p.status === 'vision' ? 'rgba(107,78,255,0.1)' : 'rgba(255,255,255,0.05)',
                  color: p.status === 'live' ? '#059669' : p.status === 'vision' ? '#A78BFA' : '#6B7280',
                  border: `1px solid ${p.status === 'live' ? '#A7F3D0' : p.status === 'vision' ? 'rgba(107,78,255,0.3)' : 'rgba(255,255,255,0.1)'}`
                }}>
                  {p.status === 'live' ? '● LIVE NOW' : p.status === 'vision' ? '◆ VISION' : '○ UPCOMING'}
                </span>
                <span style={{ fontSize: 12, color: '#52525B', fontWeight: 500, fontFamily: 'IBM Plex Mono, monospace' }}>{p.date}</span>
              </div>

              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: '-.02em' }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.7, marginBottom: 16 }}>{p.desc}</p>

              <div style={{
                background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                border: `1px solid ${p.border}20`, padding: '16px 20px',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8
              }}>
                {p.items.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#A1A1AA' }}>
                    <span style={{ color: p.color, fontSize: 10, fontWeight: 700 }}>→</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Market opportunity */}
      <section style={{ background: 'rgba(107,78,255,0.08)', borderTop: '1px solid rgba(107,78,255,0.2)', borderBottom: '1px solid rgba(107,78,255,0.2)', padding: '60px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B4EFF', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 32, textAlign: 'center' }}>
            Market opportunity
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { value: '$50B+', label: 'Global compliance software market by 2028', color: '#6B4EFF' },
              { value: '$12B+', label: 'Industrial IoT compliance market size', color: '#059669' },
              { value: '10x', label: 'Cost advantage over enterprise competitors', color: '#D97706' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: s.color, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1, marginBottom: 10 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#71717A', lineHeight: 1.6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 60px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 14, letterSpacing: '-.02em' }}>
          Start with the software.<br />
          <span style={{ color: '#6B4EFF' }}>Scale to the hardware.</span>
        </h2>
        <p style={{ fontSize: 16, color: '#71717A', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
          The ResponseOS platform is live today. Get started with compliance software and be first in line for hardware when it launches.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/quote')} style={{
            padding: '14px 36px', background: '#6B4EFF', color: '#fff',
            border: 'none', borderRadius: '10px', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 20px rgba(107,78,255,0.4)'
          }}>Get a quote →</button>
          <button onClick={() => navigate('/home')} style={{
            padding: '14px 36px', background: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>Back to home</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 60px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <img src="/logo.png" alt="ResponseOS" style={{ height: 36, objectFit: 'contain' }} />
        <div style={{ fontSize: 12, color: '#52525B', fontWeight: 500 }}>© 2026 ResponseOS · Houston, TX</div>
        <div style={{ fontSize: 12, color: '#52525B', fontWeight: 500 }}>responseos.netlify.app</div>
      </footer>
    </div>
  )
}
