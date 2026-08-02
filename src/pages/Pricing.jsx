import { useNavigate } from 'react-router-dom'

export default function Pricing() {
  const navigate = useNavigate()

  return (
    <div style={{ background: '#F8F9FC', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 60px', borderBottom: '1px solid #E4E6EF',
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <img src="/logo.svg" alt="ResponseOS" onClick={() => navigate('/home')}
          style={{ height: 44, objectFit: 'contain', cursor: 'pointer' }} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => navigate('/home')} style={{
            padding: '9px 18px', background: 'transparent', color: '#6B7280',
            border: '1px solid #E4E6EF', borderRadius: '8px', fontSize: 14,
            fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>← Back</button>
          <button onClick={() => navigate('/quote')} style={{
            padding: '9px 18px', background: '#EEF0FF', color: '#6B4EFF',
            border: '1px solid #C7C0FF', borderRadius: '8px', fontSize: 14,
            fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>Get a quote</button>
          <button onClick={() => navigate('/login')} style={{
            padding: '9px 22px', background: '#6B4EFF', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>Sign in</button>
        </div>
      </nav>

      {/* Header */}
      <section style={{ textAlign: 'center', padding: '72px 60px 48px', maxWidth: 700, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 99,
          background: '#EEF0FF', color: '#6B4EFF',
          fontSize: 12, fontWeight: 600, letterSpacing: '.04em',
          marginBottom: 20, border: '1px solid #C7C0FF'
        }}>
          ◆ Simple, transparent pricing
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: '#0F1117', letterSpacing: '-.02em', marginBottom: 16 }}>
          Plans that scale with your team
        </h1>
        <p style={{ fontSize: 18, color: '#6B7280', lineHeight: 1.7 }}>
          All plans include the full ResponseOS platform. No hidden fees, no per-user traps. Billed annually.
        </p>
        <div style={{
          marginTop: 28, padding: '12px 20px', background: '#ECFDF5',
          borderRadius: 10, border: '1px solid #A7F3D0',
          fontSize: 13, color: '#059669', fontWeight: 600
        }}>
          ✓ Up to 10x cheaper than Vanta, AuditBoard, or Drata — same core features
        </div>
      </section>

      {/* Pricing cards */}
      <section style={{ padding: '0 60px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            {
              name: 'Starter',
              price: '$5,700',
              monthly: '$475',
              users: 'Up to 10 users',
              color: '#059669',
              bg: '#ECFDF5',
              border: '#A7F3D0',
              popular: false,
              features: [
                'Certification tracking',
                'Task management',
                'Tiered alert engine',
                'Immutable audit log',
                'CSV export',
                'Mobile responsive',
                'Email support',
              ]
            },
            {
              name: 'Professional',
              price: '$8,100',
              monthly: '$675',
              users: 'Up to 50 users',
              color: '#6B4EFF',
              bg: '#EEF0FF',
              border: '#C7C0FF',
              popular: true,
              features: [
                'Everything in Starter',
                'AI compliance assistant',
                'Weekly AI risk reports',
                'Profile photo uploads',
                'Document vault',
                'Inspection forms',
                'Priority support',
                'Custom branding',
              ]
            },
            {
              name: 'Enterprise',
              price: '$14,100',
              monthly: '$1,175',
              users: 'Unlimited users',
              color: '#D97706',
              bg: '#FFFBEB',
              border: '#FDE68A',
              popular: false,
              features: [
                'Everything in Professional',
                'Custom domain',
                'Multi-organization support',
                'Two-factor authentication',
                'Dedicated onboarding',
                'SLA guarantee',
                'Compliance consulting',
                'Hardware integration ready',
              ]
            },
          ].map(p => (
            <div key={p.name} style={{
              background: '#fff',
              border: `2px solid ${p.popular ? p.color : p.border}`,
              borderRadius: 16, padding: '32px 28px',
              boxShadow: p.popular ? '0 8px 32px rgba(107,78,255,0.15)' : '0 2px 8px rgba(0,0,0,0.06)',
              position: 'relative', display: 'flex', flexDirection: 'column'
            }}>
              {p.popular && (
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: '#6B4EFF', color: '#fff', fontSize: 11, fontWeight: 700,
                  padding: '4px 16px', borderRadius: 99, whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(107,78,255,0.4)'
                }}>MOST POPULAR</div>
              )}

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 8, letterSpacing: '.04em', textTransform: 'uppercase' }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4 }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: '#0F1117', lineHeight: 1 }}>{p.price}</div>
                  <div style={{ fontSize: 14, color: '#6B7280', fontWeight: 500, paddingBottom: 8 }}>/year</div>
                </div>
                <div style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>
                  {p.monthly}/month · {p.users}
                </div>
              </div>

              <button onClick={() => navigate('/quote')} style={{
                width: '100%', padding: '12px', marginBottom: 28,
                background: p.popular ? '#6B4EFF' : '#fff',
                color: p.popular ? '#fff' : p.color,
                border: `2px solid ${p.color}`,
                borderRadius: '8px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                boxShadow: p.popular ? '0 4px 12px rgba(107,78,255,0.3)' : 'none',
                transition: 'all .12s'
              }}>
                Get started →
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#0F1117' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: p.bg, color: p.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700
                    }}>✓</div>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 64 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0F1117', textAlign: 'center', marginBottom: 40, letterSpacing: '-.02em' }}>
            Frequently asked questions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {[
              { q: 'What happens after I request a quote?', a: 'We review your team size and compliance needs and send a custom proposal within 24 hours. No commitment required.' },
              { q: 'Can we change plans later?', a: 'Yes — you can upgrade or downgrade at any renewal date. We\'ll prorate the difference if you upgrade mid-year.' },
              { q: 'What compliance frameworks do you support?', a: 'FERC, NERC CIP, OSHA, ISO 27001, SOC 2, HIPAA, GDPR, and PCI DSS are all supported out of the box.' },
              { q: 'Is our data secure?', a: 'All data is stored in a private PostgreSQL database with row-level security. Only your team can access your data.' },
              { q: 'What does the AI assistant do?', a: 'It answers compliance questions in real time and emails leadership an AI risk report every Monday morning.' },
              { q: 'Do you offer a free trial?', a: 'Yes — contact us for a live demo and 14-day trial access. No credit card required.' },
            ].map(faq => (
              <div key={faq.q} style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #E4E6EF', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1117', marginBottom: 8 }}>{faq.q}</div>
                <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1C1C1E', padding: '72px 60px', textAlign: 'center' }}>
        <img src="/logo.svg" alt="ResponseOS" style={{ height: 48, objectFit: 'contain', marginBottom: 28 }} />
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 14, letterSpacing: '-.02em' }}>
          Ready to get started?
        </h2>
        <p style={{ fontSize: 16, color: '#71717A', marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>
          Request a quote and we'll have a custom proposal back to you within 24 hours.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/quote')} style={{
            padding: '14px 36px', background: '#6B4EFF', color: '#fff',
            border: 'none', borderRadius: '10px', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 20px rgba(107,78,255,0.4)'
          }}>Get a quote →</button>
          <button onClick={() => navigate('/login')} style={{
            padding: '14px 36px', background: 'transparent', color: '#fff',
            border: '1px solid #3F3F46', borderRadius: '10px', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>Sign in</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 60px', borderTop: '1px solid #E4E6EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
        <img src="/logo.svg" alt="ResponseOS" style={{ height: 36, objectFit: 'contain' }} />
        <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>© 2026 ResponseOS · Houston, TX</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>responseos.netlify.app</div>
      </footer>
    </div>
  )
}