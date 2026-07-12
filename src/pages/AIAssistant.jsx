import { useState, useRef, useEffect } from 'react'
import PageHeader from '../components/PageHeader'

const SYSTEM = `You are the AI compliance assistant for ResponseOS, a cloud-based audit 
and compliance platform built by VALE Co. You have visibility into all platform data 
including certifications, tasks, alerts, and audit logs.

Key people:
- Harrison Seals — Admin
- Jonah Lane — Supervisor

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
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM,
          messages: newMessages
        })
      })
      const data = await res.json()
      const reply = data.content.map(b => b.text || '').join('')
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error — please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <PageHeader
        title="AI Assistant"
        subtitle="Compliance guidance powered by ResponseOS."
      />

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
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
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)',
                background: m.role === 'assistant' ? 'var(--blue)' : 'var(--surface3)',
                color: m.role === 'assistant' ? '#fff' : 'var(--text2)'
              }}>
                {m.role === 'assistant' ? 'AI' : 'YOU'}
              </div>
              <div style={{
                maxWidth: '76%', padding: '10px 14px', borderRadius: 10,
                fontSize: 13, lineHeight: 1.65,
                background: m.role === 'assistant' ? 'var(--surface2)' : 'var(--blue)',
                color: m.role === 'assistant' ? 'var(--text)' : '#fff',
                borderTopLeftRadius: m.role === 'assistant' ? 3 : 10,
                borderTopRightRadius: m.role === 'user' ? 3 : 10,
                whiteSpace: 'pre-wrap'
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)',
                background: 'var(--blue)', color: '#fff'
              }}>AI</div>
              <div style={{
                padding: '12px 16px', borderRadius: 10, borderTopLeftRadius: 3,
                background: 'var(--surface2)', display: 'flex', gap: 5, alignItems: 'center'
              }}>
                {[0, 150, 300].map(d => (
                  <div key={d} style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)',
                    animation: 'bounce 1.2s infinite', animationDelay: `${d}ms`
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {showChips && (
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {CHIPS.map(c => (
              <button key={c} onClick={() => send(c)} style={{
                padding: '5px 11px', borderRadius: 99,
                border: '0.5px solid var(--border2)',
                background: 'transparent', color: 'var(--text2)',
                fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)',
              }}>
                {c}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about certifications, tasks, risks, audit readiness…"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 'var(--radius)',
              border: '0.5px solid var(--border2)', background: 'var(--surface2)',
              color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', outline: 'none'
            }}
          />
          <button
            className="btn btn-primary"
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{ opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            Send
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