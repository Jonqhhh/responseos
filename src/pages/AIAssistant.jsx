import { useState, useRef, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import { supabase } from '../lib/supabase'
import { getCertifications, getTasks, getAlerts } from '../lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

function buildSystemPrompt(certs, tasks, alerts, users) {
  const now = new Date()

  const certSummary = certs.map(c => {
    const days = Math.ceil((new Date(c.expiry_date) - now) / (1000 * 60 * 60 * 24))
    return `- ${c.users?.full_name}: ${c.cert_name} (${c.issuing_body}) — ${days < 0 ? `EXPIRED ${Math.abs(days)} days ago` : `expires in ${days} days`} — Status: ${c.status.toUpperCase()}`
  }).join('\n')

  const taskSummary = tasks.map(t =>
    `- ${t.users?.full_name}: "${t.title}" (${t.type}) — Due: ${t.due_date} — Status: ${t.status.toUpperCase()}`
  ).join('\n')

  const alertSummary = alerts.map(a =>
    `- [${a.tier.toUpperCase()}] ${a.message} — ${a.acknowledged ? 'Acknowledged' : 'UNREAD'}`
  ).join('\n')

  const overdue = tasks.filter(t => t.status === 'overdue')
  const expiring = certs.filter(c => c.status === 'expiring' || c.status === 'expired')
  const unread = alerts.filter(a => !a.acknowledged)
  const score = Math.max(0, 100 - (certs.filter(c => c.status === 'expired').length * 15) - (overdue.length * 10) - (certs.filter(c => c.status === 'expiring').length * 5))

  return `You are the AI compliance assistant for ResponseOS, an AI-powered compliance and audit platform built for energy, utility, and critical infrastructure teams.

TODAY'S DATE: ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

CURRENT COMPLIANCE SCORE: ${score}%

LIVE CERTIFICATION DATA (${certs.length} total):
${certSummary || 'No certifications on file.'}

LIVE TASK DATA (${tasks.length} total):
${taskSummary || 'No tasks on file.'}

LIVE ALERT DATA (${alerts.length} total):
${alertSummary || 'No alerts.'}

SUMMARY:
- ${overdue.length} overdue tasks
- ${expiring.length} expired or expiring certifications  
- ${unread.length} unread alerts
- Compliance score: ${score}%

KEY PEOPLE:
- Harrison Seals — Admin
- Jonah Lane — Admin

YOUR ROLE:
You are a sharp, knowledgeable compliance analyst. You have full visibility into the live platform data above. When answering questions, reference specific names, dates, and cert names from the data. Never give generic answers when you have real data to work with.

RULES:
- Always reference real names and data from above when relevant
- Be direct and specific — name the person, the cert, the deadline
- Suggest a concrete next action for every issue you identify
- Reference FERC, NERC CIP, OSHA, ISO 27001 regulations when relevant
- Keep responses concise — 3-6 sentences or a short list
- Tone: confident compliance analyst, not a chatbot`
}

const CHIPS = [
  'What certifications expire in the next 30 days?',
  'Which tasks are overdue right now?',
  'Are we FERC audit-ready?',
  'What are our top 3 compliance risks?',
  'Who needs to take action today?',
  'What is our current compliance score?',
  'Show me all unread alerts',
]

export default function AIAssistant() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hello. I'm the ResponseOS compliance assistant — I have full visibility into your live certification, task, and alert data. Ask me anything about your team's compliance status."
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [showChips, setShowChips] = useState(true)
  const [platformData, setPlatformData] = useState({ certs: [], tasks: [], alerts: [], users: [] })
  const msgsRef = useRef(null)

  useEffect(() => {
    async function loadData() {
      const [certsRes, tasksRes, alertsRes, usersRes] = await Promise.all([
        getCertifications(),
        getTasks(),
        getAlerts(),
        supabase.from('users').select('*').then(r => r.data || [])
      ])
      setPlatformData({
        certs: certsRes || [],
        tasks: tasksRes || [],
        alerts: alertsRes || [],
        users: usersRes || []
      })
      setDataLoading(false)
    }
    loadData()
  }, [])

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

      const systemPrompt = buildSystemPrompt(
        platformData.certs,
        platformData.tasks,
        platformData.alerts,
        platformData.users
      )

      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: newMessages, system: systemPrompt })
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

  const score = Math.max(0, 100 -
    (platformData.certs.filter(c => c.status === 'expired').length * 15) -
    (platformData.tasks.filter(t => t.status === 'overdue').length * 10) -
    (platformData.certs.filter(c => c.status === 'expiring').length * 5)
  )

  return (
    <div className="page-wrap" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <PageHeader
        title="AI Assistant"
        subtitle="Compliance guidance powered by Claude AI — with live platform data."
      />

      {/* Live data summary bar */}
      {!dataLoading && (
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap',
          padding: '12px 16px', background: '#F8F9FC',
          borderRadius: 10, border: '1px solid #E4E6EF'
        }}>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Live data:</div>
          {[
            { label: `${platformData.certs.length} certs`, color: '#6B4EFF' },
            { label: `${platformData.tasks.filter(t => t.status === 'overdue').length} overdue tasks`, color: '#DC2626' },
            { label: `${platformData.alerts.filter(a => !a.acknowledged).length} unread alerts`, color: '#D97706' },
            { label: `${score}% score`, color: score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626' },
          ].map(s => (
            <span key={s.label} style={{
              padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
              background: '#fff', color: s.color, border: `1px solid ${s.color}22`
            }}>{s.label}</span>
          ))}
          <span style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginLeft: 'auto' }}>
            ● AI has full visibility into your platform
          </span>
        </div>
      )}

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
            placeholder={dataLoading ? 'Loading platform data...' : 'Ask about your certifications, tasks, alerts, risks...'}
            disabled={dataLoading}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: '8px',
              border: '1px solid #E4E6EF', background: '#fff',
              color: '#0F1117', fontSize: 14, fontFamily: 'Inter, sans-serif',
              outline: 'none', transition: 'border-color .12s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              opacity: dataLoading ? 0.5 : 1
            }}
            onFocus={e => e.target.style.borderColor = '#6B4EFF'}
            onBlur={e => e.target.style.borderColor = '#E4E6EF'}
          />
          <button
            className="btn btn-primary"
            onClick={() => send()}
            disabled={loading || !input.trim() || dataLoading}
            style={{ opacity: loading || !input.trim() || dataLoading ? 0.5 : 1, padding: '11px 20px' }}
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
