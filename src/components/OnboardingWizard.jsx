import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LayoutDashboard, ShieldCheck, CheckSquare, Bell, Bot, ScrollText, ArrowRight, X } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const DEMO_STEPS = [
  {
    id: 'welcome',
    icon: '🚀',
    title: 'Welcome to ResponseOS',
    subtitle: 'Your 14-day free demo is ready',
    nav: null,
    content: 'demo_welcome'
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Your compliance dashboard',
    subtitle: 'The command center for your team',
    nav: '/',
    content: 'demo_dashboard'
  },
  {
    id: 'certifications',
    icon: ShieldCheck,
    title: 'Certification tracking',
    subtitle: 'Never let a cert expire again',
    nav: '/certs',
    content: 'demo_certs'
  },
  {
    id: 'tasks',
    icon: CheckSquare,
    title: 'Task management',
    subtitle: 'Assign and track compliance work',
    nav: '/tasks',
    content: 'demo_tasks'
  },
  {
    id: 'alerts',
    icon: Bell,
    title: 'Tiered alert engine',
    subtitle: 'Automated compliance monitoring',
    nav: '/alerts',
    content: 'demo_alerts'
  },
  {
    id: 'ai',
    icon: Bot,
    title: 'AI compliance assistant',
    subtitle: 'Ask anything about compliance',
    nav: '/ai',
    content: 'demo_ai'
  },
  {
    id: 'audit',
    icon: ScrollText,
    title: 'Audit log',
    subtitle: 'Every action recorded and exportable',
    nav: '/audit',
    content: 'demo_audit'
  },
  {
    id: 'done',
    icon: '🎉',
    title: "You're all set!",
    subtitle: 'Start exploring or upgrade today',
    nav: null,
    content: 'demo_done'
  }
]

const ADMIN_STEPS = [
  {
    id: 'welcome',
    icon: '👋',
    title: 'Welcome to ResponseOS',
    subtitle: 'Your AI-powered compliance platform',
    ai: false,
    content: 'admin_welcome'
  },
  {
    id: 'team',
    icon: '👥',
    title: 'Tell me about your team',
    subtitle: 'Help me personalize your setup',
    ai: true,
    question: 'How many people are on your team and what industry are you in?',
  },
  {
    id: 'compliance',
    icon: '🛡️',
    title: 'Your compliance needs',
    subtitle: 'What frameworks matter most to you?',
    ai: true,
    question: 'Which compliance frameworks do you need to meet? (e.g. FERC, NERC CIP, OSHA, ISO 27001, HIPAA)',
  },
  {
    id: 'pain',
    icon: '⚡',
    title: 'Your biggest challenge',
    subtitle: 'What keeps you up at night?',
    ai: true,
    question: 'What is your biggest compliance challenge right now?',
  },
  {
    id: 'ready',
    icon: '🎯',
    title: "You're all set!",
    subtitle: 'Here is your personalized action plan',
    ai: false,
    content: 'admin_done'
  }
]

const SYSTEM_PROMPT = `You are the ResponseOS AI onboarding assistant. You are helping a new user set up their compliance platform. Be warm, concise, and specific. Give responses of 2-3 sentences max that acknowledge their situation and tell them exactly what to do first in ResponseOS. Never be generic.`

export default function OnboardingWizard({ user, onComplete }) {
  const isDemo = user?.is_demo
  const STEPS = isDemo ? DEMO_STEPS : ADMIN_STEPS

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [input, setInput] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionPlan, setActionPlan] = useState('')
  const [planLoading, setPlanLoading] = useState(false)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0
  const progress = ((step + 1) / STEPS.length) * 100

  async function getAiResponse(question, answer) {
    setLoading(true)
    setAiResponse('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `${question}\n\nUser answer: ${answer}` }]
        })
      })
      const data = await res.json()
      setAiResponse(data.content?.map(b => b.text || '').join('') || 'Got it — thanks for sharing that.')
    } catch {
      setAiResponse('Got it — thanks for sharing that.')
    }
    setLoading(false)
  }

  async function generateActionPlan(allAnswers) {
    setPlanLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const context = Object.entries(allAnswers).map(([k, v]) => `${k}: ${v}`).join('\n')
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `Give a personalized 3-step action plan to get started with ResponseOS. Be specific. Format as 3 numbered steps, each one sentence.\n\nUser info:\n${context}\nName: ${user?.full_name}` }]
        })
      })
      const data = await res.json()
      setActionPlan(data.content?.map(b => b.text || '').join('') || '1. Add your team members under Users.\n2. Log certifications with expiry dates.\n3. Check the Dashboard daily to monitor your compliance score.')
    } catch {
      setActionPlan('1. Add your team members under Users.\n2. Log certifications with expiry dates.\n3. Check the Dashboard daily to monitor your compliance score.')
    }
    setPlanLoading(false)
  }

  async function handleNext() {
    if (!isDemo && current.ai && !aiResponse) {
      if (!input.trim()) return
      const newAnswers = { ...answers, [current.id]: input.trim() }
      setAnswers(newAnswers)
      await getAiResponse(current.question, input.trim())
      setInput('')
      return
    }
    const next = step + 1
    setStep(next)
    setAiResponse('')
    if (!isDemo && next === STEPS.length - 1) generateActionPlan(answers)
  }

  async function handleComplete() {
    await supabase.from('users').update({ onboarded: true }).eq('id', user?.id)
    onComplete()
  }

  const iconStyle = {
    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
    boxShadow: '0 0 20px rgba(124,58,237,0.4)'
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(8,6,18,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'rgba(18,10,42,0.95)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: 20, width: '100%', maxWidth: 540,
        boxShadow: '0 0 60px rgba(139,92,246,0.2), 0 32px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden', position: 'relative'
      }}>
        {/* Top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.8), transparent)'
        }} />

        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(139,92,246,0.15)' }}>
          <div style={{
            height: 3,
            background: 'linear-gradient(90deg, #7C3AED, #8B5CF6)',
            width: `${progress}%`,
            transition: 'width .4s ease',
            boxShadow: '0 0 8px rgba(139,92,246,0.6)'
          }} />
        </div>

        <div style={{ padding: '32px 36px' }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Step {step + 1} of {STEPS.length}
            </div>
            <button onClick={handleComplete} style={{
              background: 'none', border: 'none', color: '#6060AA',
              cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center'
            }}>
              <X size={16} />
            </button>
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                height: 4, flex: 1, borderRadius: 99,
                background: i <= step ? '#7C3AED' : 'rgba(139,92,246,0.2)',
                transition: 'background .3s',
                boxShadow: i === step ? '0 0 8px rgba(124,58,237,0.6)' : 'none'
              }} />
            ))}
          </div>

          {/* Icon + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={iconStyle}>
              {typeof current.icon === 'string'
                ? <span style={{ fontSize: 22 }}>{current.icon}</span>
                : <current.icon size={22} color="#fff" strokeWidth={2} />
              }
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F0EEFF', letterSpacing: '-.02em' }}>
                {current.title}
              </div>
              <div style={{ fontSize: 13, color: '#9B8ABB', marginTop: 2 }}>
                {current.subtitle}
              </div>
            </div>
          </div>

          {/* ── DEMO WIZARD CONTENT ── */}
          {isDemo && current.content === 'demo_welcome' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                borderRadius: 12, padding: '16px 20px'
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#F0EEFF', marginBottom: 6 }}>
                  Hi {user?.full_name?.split(' ')[0]} — welcome to your demo! 👋
                </div>
                <div style={{ fontSize: 13, color: '#C4B8E8', lineHeight: 1.7 }}>
                  We've pre-loaded your account with a realistic compliance setup — a team of 3 employees, certifications, tasks, alerts, and documents. This 2-minute tour will show you exactly how everything works.
                </div>
              </div>
              {[
                { icon: ShieldCheck, text: '5 certifications — mix of valid, expiring, and expired' },
                { icon: CheckSquare, text: '4 tasks — including an overdue inspection' },
                { icon: Bell,        text: '4 alerts — critical, warning, and info tiers' },
                { icon: Bot,         text: 'AI assistant ready to answer compliance questions' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(139,92,246,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={15} color="#8B5CF6" strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: 13, color: '#C4B8E8' }}>{text}</span>
                </div>
              ))}
            </div>
          )}

          {isDemo && current.content === 'demo_dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, color: '#C4B8E8', lineHeight: 1.7 }}>
                  Your dashboard shows your <strong style={{ color: '#F0EEFF' }}>live compliance score</strong> — calculated in real time from expired certs, overdue tasks, and unacknowledged alerts. The lower the score, the more urgent the action needed.
                </div>
              </div>
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FCA5A5', marginBottom: 4 }}>Try this now</div>
                <div style={{ fontSize: 13, color: '#C4B8E8' }}>Click Dashboard in the sidebar and check your compliance score. Notice the charts showing cert health and task completion.</div>
              </div>
            </div>
          )}

          {isDemo && current.content === 'demo_certs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, color: '#C4B8E8', lineHeight: 1.7 }}>
                  The Certifications page tracks every employee credential. Marcus Johnson has an <strong style={{ color: '#F87171' }}>expired Confined Space Entry</strong> cert and an expiring OSHA cert — these are already generating alerts.
                </div>
              </div>
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6EE7B7', marginBottom: 4 }}>Try this now</div>
                <div style={{ fontSize: 13, color: '#C4B8E8' }}>Click Certifications → Add certification to see how you'd add a real cert. Try attaching a PDF document to it.</div>
              </div>
            </div>
          )}

          {isDemo && current.content === 'demo_tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, color: '#C4B8E8', lineHeight: 1.7 }}>
                  Tasks are assigned to team members with due dates and types — inspections, checklists, security reviews. The <strong style={{ color: '#F87171' }}>Monthly Safety Inspection is overdue</strong> and generating critical alerts.
                </div>
              </div>
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D', marginBottom: 4 }}>Try this now</div>
                <div style={{ fontSize: 13, color: '#C4B8E8' }}>Click Tasks → edit the Monthly Safety Inspection → change status to Complete. Watch the alert count drop.</div>
              </div>
            </div>
          )}

          {isDemo && current.content === 'demo_alerts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, color: '#C4B8E8', lineHeight: 1.7 }}>
                  The alert engine runs <strong style={{ color: '#F0EEFF' }}>every hour</strong> and fires Critical, Warning, and Info alerts automatically. You have 3 unacknowledged alerts right now — including a critical expired cert.
                </div>
              </div>
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FCA5A5', marginBottom: 4 }}>Try this now</div>
                <div style={{ fontSize: 13, color: '#C4B8E8' }}>Click Alerts and acknowledge the critical alert. Notice how it moves to the acknowledged section instantly.</div>
              </div>
            </div>
          )}

          {isDemo && current.content === 'demo_ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, color: '#C4B8E8', lineHeight: 1.7 }}>
                  The AI Assistant knows your <strong style={{ color: '#F0EEFF' }}>real platform data</strong> — it can see your team's certifications, tasks, and alerts. Ask it anything about FERC, NERC CIP, OSHA, or your specific compliance situation.
                </div>
              </div>
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6EE7B7', marginBottom: 4 }}>Try asking</div>
                <div style={{ fontSize: 13, color: '#C4B8E8', fontStyle: 'italic' }}>"What are my most urgent compliance risks right now?"</div>
              </div>
            </div>
          )}

          {isDemo && current.content === 'demo_audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, color: '#C4B8E8', lineHeight: 1.7 }}>
                  Every action in ResponseOS is <strong style={{ color: '#F0EEFF' }}>time-stamped and tamper-protected</strong>. The audit log can be exported as CSV for FERC, NERC, or any third-party auditor in one click.
                </div>
              </div>
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D', marginBottom: 4 }}>Try this now</div>
                <div style={{ fontSize: 13, color: '#C4B8E8' }}>Click Audit Log and hit Export CSV. This is what you hand to an auditor.</div>
              </div>
            </div>
          )}

          {isDemo && current.content === 'demo_done' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#6EE7B7', marginBottom: 8 }}>You've seen everything!</div>
                <div style={{ fontSize: 13, color: '#C4B8E8', lineHeight: 1.7 }}>
                  Your demo includes 14 days of full access. When you're ready to set up your real team, get a custom quote and we'll migrate your data.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href="/quote" style={{
                  flex: 1, padding: '12px', textAlign: 'center',
                  background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                  color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  textDecoration: 'none', boxShadow: '0 0 16px rgba(124,58,237,0.4)'
                }}>Get a custom quote →</a>
                <button onClick={handleComplete} style={{
                  flex: 1, padding: '12px',
                  background: 'rgba(139,92,246,0.1)', color: '#C4B5FD',
                  border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}>Explore on my own</button>
              </div>
              <div style={{ fontSize: 12, color: '#6060AA', textAlign: 'center' }}>
                Questions? Email <a href="mailto:jlane@responseos.net" style={{ color: '#8B5CF6' }}>jlane@responseos.net</a>
              </div>
            </div>
          )}

          {/* ── ADMIN WIZARD CONTENT ── */}
          {!isDemo && current.content === 'admin_welcome' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#F0EEFF', marginBottom: 6 }}>
                  Hi {user?.full_name?.split(' ')[0]} — I'm your compliance assistant.
                </div>
                <div style={{ fontSize: 13, color: '#C4B8E8', lineHeight: 1.7 }}>
                  I'll walk you through setting up ResponseOS in about 2 minutes and give you a personalized action plan.
                </div>
              </div>
              {[
                { icon: ShieldCheck, text: 'Track certifications and get expiry alerts' },
                { icon: Bell,        text: 'Automated hourly compliance monitoring' },
                { icon: Bot,         text: 'AI assistant answers any compliance question' },
                { icon: ScrollText,  text: 'Audit-ready logs exported in one click' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(139,92,246,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={15} color="#8B5CF6" strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: 13, color: '#C4B8E8' }}>{text}</span>
                </div>
              ))}
            </div>
          )}

          {!isDemo && current.ai && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '14px 16px',
                background: 'rgba(139,92,246,0.08)',
                borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)'
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Bot size={14} color="#fff" strokeWidth={2} />
                </div>
                <div style={{ fontSize: 14, color: '#C4B8E8', lineHeight: 1.6 }}>
                  {current.question}
                </div>
              </div>

              {aiResponse ? (
                <div style={{
                  padding: '14px 16px',
                  background: 'rgba(52,211,153,0.08)',
                  borderRadius: 10, border: '1px solid rgba(52,211,153,0.2)',
                  fontSize: 13, color: '#6EE7B7', lineHeight: 1.7
                }}>
                  ✓ {aiResponse}
                </div>
              ) : (
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type your answer..."
                  rows={3}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)',
                    background: 'rgba(20,10,45,0.6)', color: '#F0EEFF',
                    fontSize: 14, fontFamily: 'Inter, sans-serif',
                    outline: 'none', resize: 'none', lineHeight: 1.6
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(139,92,246,0.2)'}
                />
              )}
            </div>
          )}

          {!isDemo && current.content === 'admin_done' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                borderRadius: 12, padding: '16px 20px'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6', marginBottom: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                  Your personalized action plan
                </div>
                {planLoading ? (
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '8px 0' }}>
                    {[0, 150, 300].map(d => (
                      <div key={d} style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6',
                        animation: 'bounce 1.2s infinite', animationDelay: `${d}ms`
                      }} />
                    ))}
                    <span style={{ fontSize: 12, color: '#9B8ABB', marginLeft: 6 }}>Generating your plan...</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 14, color: '#C4B8E8', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {actionPlan}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#9B8ABB', lineHeight: 1.6 }}>
                You can always ask the AI Assistant for guidance anytime from the sidebar.
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 28, alignItems: 'center' }}>
            <div>
              {!isFirst && !isLast && (
                <button onClick={() => { setStep(s => s - 1); setAiResponse('') }} style={{
                  padding: '10px 18px', borderRadius: 8,
                  border: '1px solid rgba(139,92,246,0.2)',
                  background: 'transparent', color: '#9B8ABB',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}>← Back</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {!isLast && (
                <button onClick={handleComplete} style={{
                  padding: '10px 18px', borderRadius: 8,
                  border: '1px solid rgba(139,92,246,0.15)',
                  background: 'transparent', color: '#6060AA',
                  fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}>Skip tour</button>
              )}
              {isLast && isDemo ? (
                <button onClick={handleComplete} style={{
                  padding: '12px 28px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 0 20px rgba(124,58,237,0.4)'
                }}>
                  Start exploring →
                </button>
              ) : isLast ? (
                <button onClick={handleComplete} disabled={planLoading} style={{
                  padding: '12px 28px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: planLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif', opacity: planLoading ? 0.6 : 1,
                  boxShadow: '0 0 20px rgba(124,58,237,0.4)'
                }}>
                  Enter ResponseOS →
                </button>
              ) : (
                <button onClick={handleNext}
                  disabled={loading || (!isDemo && current.ai && !input.trim() && !aiResponse)}
                  style={{
                    padding: '12px 28px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    opacity: loading || (!isDemo && current.ai && !input.trim() && !aiResponse) ? 0.5 : 1,
                    boxShadow: '0 0 20px rgba(124,58,237,0.4)',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                  {loading ? 'Thinking...' : aiResponse ? 'Continue' : 'Next'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}