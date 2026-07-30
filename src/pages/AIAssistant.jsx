import { useState, useRef, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import { supabase } from '../lib/supabase'

const SYSTEM = `You are the AI compliance assistant for ResponseOS, a cloud-based audit
and compliance platform built by VALE Co. You have visibility into all platform data
including certifications, tasks, alerts, and audit logs.

Key people:
- Harrison Seals — Admin
- Jonah Lane — Admin

Rules:
- Be specific and direct
- Always suggest a concrete next action
- Reference FERC/NERC/OSHA regulations when relevant
- Keep responses to 3-5 sentences max unless a list is clearer
- Tone: professional compliance analyst`

const CHIPS = [
  'Which certifications expire in the next 30 days?',
  'What tasks are overdue right now?',
  'Are we FERC audit-ready?',
  'What are the top 3 compliance risks?',
  'Who needs to take action today?',
]

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export default function AIAssistant() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hello. I'm the ResponseOS compliance assistant. I can help with certifications, tasks, alerts, and audit readiness. What would you like to review?"
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showChips, setShowChips] = useState(true)
  const msgsRef = useRef(null)

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [messages, loading])

  async function send(text) {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')
    setShowChips(false)
    const newMessages = [...messages, { role: 'user', content: q }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: newMessages, system: SYSTEM })
      })

      const data = await res.json()

      if (data.error) throw new Error(data.error)

      const reply = data.content.map(b => b.text || '').join('')
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}. Please try again.` }])
    }
    setLoading(false)
  }

  return (
    <div className="page-wrap" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <PageHeader
        title="AI Assistant"
        subtitle="Compliance guidance powered by Claude AI."
      />

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>

        {/* Messages */}
        <div ref={msgsRef} style={{
          flex: 1, overflowY: 'auto', display: 'flex',
          flexDirection: 'column', gap: 12, paddingRight: 4
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: m.role === 'assistant' ? '#6B4EFF' : '#F3F4F8',
                color: m.role === 'assistant' ? '#fff' : '#6B7280',
                border: m.role === 'user' ? '1px solid #E4E6EF' : 'none'
              }}>
                {m.role === 'assistant' ? '◆' : 'U'}
              </div>
              <div style={{
                maxWidth: '76%', padding: '12px 16px', borderRadius: 12,
                fontSize: 14, lineHeight: 1.7,
                background: m.role === 'assistant' ? '#F8F9FC' : '#6B4EFF',
                color: m.role === 'assistant' ? '#0F1117' : '#fff',
                border: m.role === 'assistant' ? '1px solid #E4E6EF' : 'none',
                borderTopLeftRadius: m.role === 'assistant' ? 4 : 12,
                borderTopRightRadius: m.role === 'user' ? 4 : 12,
                whiteSpace: 'pre-wrap',
                boxShadow: m.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, background: '#6B4EFF', color: '#fff'
              }}>◆</div>
              <div style={{
                padding: '12px 16px', borderRadius: 12, borderTopLeftRadius: 4,
                background: '#F8F9FC', border: '1px solid #E4E6EF',
                display: 'flex', gap: 5, alignItems: 'center'
              }}>
                {[0, 150, 300].map(d => (
                  <div key={d} style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#9CA3AF',
                    animation: 'bounce 1.2s infinite', animationDelay: `${d}ms`
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick chips */}
        {showChips && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CHIPS.map(c => (
              <button key={c} onClick={() => send(c)} style={{
                padding: '6px 12px', borderRadius: 99,
                border: '1px solid #E4E6EF',
                background: '#fff', color: '#6B7280',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', transition: 'all .12s'
              }}
                onMouseOver={e => { e.target.style.borderColor = '#6B4EFF'; e.target.style.color = '#6B4EFF' }}
                onMouseOut={e => { e.target.style.borderColor = '#E4E6EF'; e.target.style.color = '#6B7280' }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about certifications, tasks, risks, audit readiness…"
            style={{
              flex: 1, padding: '11px 16px', borderRadius: '8px',
              border: '1px solid #E4E6EF', background: '#fff',
              color: '#0F1117', fontSize: 14, fontFamily: 'Inter, sans-serif',
              outline: 'none', transition: 'border-color .12s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
            onFocus={e => e.target.style.borderColor = '#6B4EFF'}
            onBlur={e => e.target.style.borderColor = '#E4E6EF'}
          />
          <button
            className="btn btn-primary"
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{ opacity: loading || !input.trim() ? 0.5 : 1, padding: '11px 20px' }}
          >
            Send →
          </button>
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