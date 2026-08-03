import { useState } from 'react'
import { supabase } from '../lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to ResponseOS',
    subtitle: 'Your AI-powered compliance platform',
    ai: false,
  },
  {
    id: 'team',
    title: 'Tell me about your team',
    subtitle: 'Help me personalize your setup',
    ai: true,
    question: 'How many people are on your team and what industry are you in?',
  },
  {
    id: 'compliance',
    title: 'Your compliance needs',
    subtitle: 'What frameworks matter most to you?',
    ai: true,
    question: 'Which compliance frameworks do you need to meet? (e.g. FERC, NERC CIP, OSHA, ISO 27001, HIPAA)',
  },
  {
    id: 'pain',
    title: 'Your biggest challenge',
    subtitle: 'What keeps you up at night?',
    ai: true,
    question: 'What is your biggest compliance challenge right now?',
  },
  {
    id: 'ready',
    title: "You're all set!",
    subtitle: 'Here is your personalized action plan',
    ai: false,
  }
]

const SYSTEM_PROMPT = `You are the ResponseOS AI onboarding assistant. You are helping a new user set up their compliance platform.

ResponseOS includes:
- Certification tracking with expiry alerts
- Task management and inspection forms
- Tiered alert engine (runs every hour)
- Immutable audit log (FERC-ready)
- AI compliance assistant
- Weekly AI risk reports emailed to leadership
- Role-based access (Admin, Supervisor, Employee, Auditor)

Be warm, concise, and specific. When the user tells you about their team and compliance needs, give them a short, actionable response (2-3 sentences max) that acknowledges their situation and tells them exactly what to do first in ResponseOS. Never be generic.`

export default function OnboardingWizard({ user, onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [input, setInput] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionPlan, setActionPlan] = useState('')
  const [planLoading, setPlanLoading] = useState(false)

  async function getAiResponse(question, answer) {
    setLoading(true)
    setAiResponse('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `${question}\n\nUser answer: ${answer}` }]
        })
      })
      const data = await res.json()
      const reply = data.content?.map(b => b.text || '').join('') || ''
      setAiResponse(reply)
    } catch (e) {
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: [{
            role: 'user',
            content: `Based on this user's onboarding answers, give them a personalized 3-step action plan to get started with ResponseOS. Be specific and actionable. Format as 3 numbered steps, each one sentence.\n\nUser info:\n${context}\nUser name: ${user?.full_name}`
          }]
        })
      })
      const data = await res.json()
      const reply = data.content?.map(b => b.text || '').join('') || ''
      setActionPlan(reply)
    } catch (e) {
      setActionPlan('1. Add your team members under the Users page.\n2. Log your team\'s certifications with expiry dates.\n3. Check the Dashboard daily to monitor your compliance score.')
    }
    setPlanLoading(false)
  }

  async function handleNext() {
    const current = STEPS[step]

    if (current.ai && !aiResponse) {
      if (!input.trim()) return
      const newAnswers = { ...answers, [current.id]: input.trim() }
      setAnswers(newAnswers)
      await getAiResponse(current.question, input.trim())
      setInput('')
      return
    }

    const nextStep = step + 1
    setStep(nextStep)
    setAiResponse('')

    if (nextStep === STEPS.length - 1) {
      generateActionPlan(answers)
    }
  }

  async function handleComplete() {
    try {
      const { error } = await supabase
        .from('users')
        .update({ onboarded: true })
        .eq('id', user?.id)
      console.log('Onboarding update:', { userId: user?.id, error })
    } catch (e) {
      console.log('Onboarding error:', e)
    }
    onComplete()
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,17,23,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520,
        boxShadow: '0 32px 80px rgba(0,0,0,0.2)', overflow: 'hidden'
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: '#F3F4F8' }}>
          <div style={{
            height: 3, background: '#6B4EFF',
            width: `${((step + 1) / STEPS.length) * 100}%`,
            transition: 'width .4s ease'
          }} />
        </div>

        <div style={{ padding: '36px 40px' }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B4EFF', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Step {step + 1} of {STEPS.length}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F1117', marginBottom: 6, letterSpacing: '-.02em' }}>
              {current.title}
            </div>
            <div style={{ fontSize: 14, color: '#6B7280' }}>{current.subtitle}</div>
          </div>

          {/* Welcome step */}
          {isFirst && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '20px', background: '#EEF0FF', borderRadius: 12, border: '1px solid #C7C0FF' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>👋</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1117', marginBottom: 6 }}>
                  Hi {user?.full_name?.split(' ')[0]} — I'm your compliance assistant.
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
                  I'll walk you through setting up ResponseOS in about 2 minutes and give you a personalized action plan.
                </div>
              </div>
              {[
                { icon: '◈', text: 'Track certifications and get expiry alerts' },
                { icon: '△', text: 'Automated hourly compliance monitoring' },
                { icon: '◆', text: 'AI assistant answers any compliance question' },
                { icon: '≡', text: 'Audit-ready logs exported in one click' },
              ].map(f => (
                <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#6B7280' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EEF0FF', color: '#6B4EFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  {f.text}
                </div>
              ))}
            </div>
          )}

          {/* AI question steps */}
          {current.ai && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '14px 16px', background: '#F8F9FC',
                borderRadius: 10, border: '1px solid #E4E6EF'
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: '#6B4EFF', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700
                }}>◆</div>
                <div style={{ fontSize: 14, color: '#0F1117', lineHeight: 1.6 }}>
                  {current.question}
                </div>
              </div>

              {aiResponse ? (
                <div style={{
                  padding: '14px 16px', background: '#ECFDF5',
                  borderRadius: 10, border: '1px solid #A7F3D0',
                  fontSize: 13, color: '#065F46', lineHeight: 1.7
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
                    borderRadius: 8, border: '1px solid #E4E6EF',
                    background: '#fff', color: '#0F1117',
                    fontSize: 14, fontFamily: 'Inter, sans-serif',
                    outline: 'none', resize: 'none', lineHeight: 1.6
                  }}
                  onFocus={e => e.target.style.borderColor = '#6B4EFF'}
                  onBlur={e => e.target.style.borderColor = '#E4E6EF'}
                />
              )}
            </div>
          )}

          {/* Final step */}
          {isLast && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '20px', background: '#EEF0FF', borderRadius: 12, border: '1px solid #C7C0FF' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#6B4EFF', marginBottom: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                  ◆ Your personalized action plan
                </div>
                {planLoading ? (
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '8px 0' }}>
                    {[0, 150, 300].map(d => (
                      <div key={d} style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#6B4EFF',
                        animation: 'bounce 1.2s infinite', animationDelay: `${d}ms`
                      }} />
                    ))}
                    <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 6 }}>Generating your plan...</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 14, color: '#0F1117', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {actionPlan}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                You can always ask the AI Assistant for guidance anytime from the sidebar.
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 28 }}>
            {!isFirst && !isLast && (
              <button onClick={() => { setStep(s => s - 1); setAiResponse('') }}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: '1px solid #E4E6EF',
                  background: '#fff', color: '#6B7280', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}>
                Back
              </button>
            )}
            {isLast ? (
              <button onClick={handleComplete} disabled={planLoading}
                style={{
                  padding: '12px 28px', borderRadius: 8, border: 'none',
                  background: '#6B4EFF', color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: planLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif', opacity: planLoading ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(107,78,255,0.3)'
                }}>
                Enter ResponseOS →
              </button>
            ) : (
              <button onClick={handleNext}
                disabled={loading || (current.ai && !input.trim() && !aiResponse)}
                style={{
                  padding: '12px 28px', borderRadius: 8, border: 'none',
                  background: '#6B4EFF', color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: loading || (current.ai && !input.trim() && !aiResponse) ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  opacity: loading || (current.ai && !input.trim() && !aiResponse) ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(107,78,255,0.3)'
                }}>
                {loading ? 'Thinking...' : aiResponse ? 'Continue →' : 'Next →'}
              </button>
            )}
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