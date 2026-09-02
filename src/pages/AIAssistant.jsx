import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Bot, Send, X } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const QUICK_CHIPS = [
  'What are my most urgent compliance risks?',
  'Who has expiring certifications?',
  'What training is behind schedule?',
  'Summarize this week\'s alerts',
  'What tasks are overdue?',
  'How is our compliance score calculated?',
  'Who needs more fire training hours?',
  'What quarterly training is coming up?',
]

async function getPlatformContext(userId, isDemo) {
  const [certsRes, tasksRes, alertsRes, usersRes, trainingRes] = await Promise.all([
    supabase.from('certifications').select('*, users(full_name)').eq('is_demo', isDemo),
    supabase.from('tasks').select('*, users!tasks_assigned_to_fkey(full_name)').eq('is_demo', isDemo),
    supabase.from('alerts').select('*').eq('is_demo', isDemo).eq('acknowledged', false).limit(20),
    supabase.from('users').select('id, full_name, role, department').eq('is_demo', isDemo).eq('is_active', true),
    supabase.from('training_sessions').select('*').eq('is_demo', isDemo).order('training_date', { ascending: false }).limit(50),
  ])

  const certs = certsRes.data || []
  const tasks = tasksRes.data || []
  const alerts = alertsRes.data || []
  const users = usersRes.data || []
  const training = trainingRes.data || []

  const expired = certs.filter(c => c.status === 'expired').length
  const expiring = certs.filter(c => c.status === 'expiring').length
  const overdue = tasks.filter(t => t.status === 'overdue').length
  const score = Math.max(0, 100 - (expired * 15) - (overdue * 10) - (expiring * 5))

  // Training summary by category
  const categories = ['fire', 'hazmat', 'rescue', 'medical']
  const trainingSummary = categories.map(cat => {
    const catSessions = training.filter(t => t.category === cat)
    const totalHours = catSessions.reduce((sum, t) => sum + (parseFloat(t.duration_hours) || 0), 0)
    const thisMonth = catSessions.filter(t => new Date(t.training_date).getMonth() === new Date().getMonth())
    const monthHours = thisMonth.reduce((sum, t) => sum + (parseFloat(t.duration_hours) || 0), 0)
    return { category: cat, totalSessions: catSessions.length, totalHours: totalHours.toFixed(1), monthHours: monthHours.toFixed(1) }
  })

  const totalTrainingHours = training.reduce((sum, t) => sum + (parseFloat(t.duration_hours) || 0), 0)

  return `
RESPONSEOS PLATFORM DATA — ${new Date().toLocaleDateString()}

COMPLIANCE SCORE: ${score}/100
- Expired certs: ${expired}
- Expiring certs: ${expiring}  
- Overdue tasks: ${overdue}
- Unacknowledged alerts: ${alerts.length}

TEAM (${users.length} active members):
${users.map(u => `- ${u.full_name} (${u.role}${u.department ? ', ' + u.department : ''})`).join('\n')}

CERTIFICATIONS (${certs.length} total):
${certs.map(c => `- ${c.users?.full_name}: ${c.cert_name} — ${c.status.toUpperCase()}${c.expiry_date ? ', expires ' + c.expiry_date : ''}`).join('\n')}

TASKS (${tasks.length} total):
${tasks.map(t => `- ${t.title} → ${t.users?.full_name} — ${t.status.toUpperCase()}, due ${t.due_date}`).join('\n')}

UNACKNOWLEDGED ALERTS (${alerts.length}):
${alerts.map(a => `- [${a.tier.toUpperCase()}] ${a.message}`).join('\n')}

TRAINING TRACKER (${training.length} sessions, ${totalTrainingHours.toFixed(1)} total hours):
${trainingSummary.map(s => `- ${s.category.toUpperCase()}: ${s.totalSessions} sessions, ${s.totalHours}h total (${s.monthHours}h this month)`).join('\n')}

RECENT TRAINING SESSIONS:
${training.slice(0, 15).map(t => `- ${t.training_date}: ${t.title} (${t.category}, ${t.duration_hours || '?'}h)${t.is_quarterly ? ' [QUARTERLY]' : ''}`).join('\n')}
`.trim()
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState('')
  const [user, setUser] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
        setUser(profile)
        const ctx = await getPlatformContext(authUser.id, profile?.is_demo === true)
        setContext(ctx)
      }
    }
    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          system: `You are the ResponseOS AI compliance assistant. You have access to real-time platform data including certifications, tasks, alerts, training sessions, and team information. Be specific, helpful, and concise. Use the platform data to give personalized answers. When discussing training, reference actual session counts, hours, and categories. Today is ${new Date().toLocaleDateString()}.

PLATFORM DATA:
${context}`,
          messages: newMessages
        })
      })

      const data = await res.json()
      const reply = data.content?.map(b => b.text || '').join('') || 'Sorry, I had trouble responding. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' }])
    }

    setLoading(false)
  }

  function clearChat() {
    setMessages([])
    setInput('')
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px 28px', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
            <Bot size={20} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>AI Compliance Assistant</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>Powered by Claude · Live platform data + training context</div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <X size={13} /> Clear chat
          </button>
        )}
      </div>

      {/* Quick chips */}
      {messages.length === 0 && (
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
            Ask me anything
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUICK_CHIPS.map(chip => (
              <button key={chip} onClick={() => sendMessage(chip)} style={{
                padding: '7px 14px', borderRadius: 99,
                border: '1px solid #DDD6FE', background: '#F5F3FF',
                color: '#7C3AED', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                transition: 'all .12s'
              }}
                onMouseOver={e => { e.currentTarget.style.background = '#EDE9FF'; e.currentTarget.style.borderColor = '#C4B5FD' }}
                onMouseOut={e => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.borderColor = '#DDD6FE' }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingRight: 4 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: 380 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(124,58,237,0.25)' }}>
                <Bot size={28} color="#fff" strokeWidth={2} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                Hi {user?.full_name?.split(' ')[0]} — what can I help with?
              </div>
              <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>
                I have access to your certifications, tasks, alerts, and training sessions. Ask me anything about your compliance posture.
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: msg.role === 'user' ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : '#F5F3FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              color: msg.role === 'user' ? '#fff' : '#7C3AED',
              boxShadow: msg.role === 'user' ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
              border: msg.role === 'assistant' ? '1px solid #DDD6FE' : 'none'
            }}>
              {msg.role === 'user'
                ? user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : <Bot size={15} strokeWidth={2} />
              }
            </div>
            <div style={{
              maxWidth: '72%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#111827',
              fontSize: 14, lineHeight: 1.7,
              boxShadow: msg.role === 'user' ? '0 4px 12px rgba(124,58,237,0.25)' : '0 1px 4px rgba(139,92,246,0.08)',
              border: msg.role === 'assistant' ? '1px solid #F3F4F6' : 'none',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={15} color="#7C3AED" strokeWidth={2} />
            </div>
            <div style={{ padding: '14px 18px', background: '#fff', borderRadius: '4px 14px 14px 14px', border: '1px solid #F3F4F6', display: 'flex', gap: 5, alignItems: 'center', boxShadow: '0 1px 4px rgba(139,92,246,0.08)' }}>
              {[0, 150, 300].map(d => (
                <div key={d} style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#7C3AED',
                  animation: 'bounce 1.2s infinite', animationDelay: `${d}ms`, opacity: 0.7
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        flexShrink: 0, display: 'flex', gap: 10, alignItems: 'flex-end',
        background: '#fff', borderRadius: 14,
        border: '1.5px solid #E5E7EB', padding: '10px 12px',
        boxShadow: '0 2px 12px rgba(139,92,246,0.08)',
        transition: 'border-color .15s'
      }}
        onFocusCapture={e => e.currentTarget.style.borderColor = '#C4B5FD'}
        onBlurCapture={e => e.currentTarget.style.borderColor = '#E5E7EB'}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Ask about certifications, training hours, overdue tasks, compliance risks..."
          rows={1}
          style={{
            flex: 1, border: 'none', outline: 'none', resize: 'none',
            fontSize: 14, fontFamily: 'Inter, sans-serif',
            color: '#111827', background: 'transparent',
            lineHeight: 1.5, maxHeight: 120, overflowY: 'auto'
          }}
        />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
          width: 36, height: 36, borderRadius: 9, border: 'none', flexShrink: 0,
          background: input.trim() && !loading ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : '#F3F4F6',
          color: input.trim() && !loading ? '#fff' : '#D1D5DB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
          transition: 'all .15s',
          boxShadow: input.trim() && !loading ? '0 2px 8px rgba(124,58,237,0.3)' : 'none'
        }}>
          <Send size={15} strokeWidth={2} />
        </button>
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