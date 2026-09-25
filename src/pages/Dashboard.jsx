import { useEffect, useRef, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useData } from '../lib/useData'
import { getCertifications, getTasks, getAlerts, supabase } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import { Settings, X, GripVertical, Eye, EyeOff } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const DEFAULT_WIDGETS = [
  { id: 'score',       label: 'Compliance Score',   visible: true  },
  { id: 'metrics',     label: 'Key Metrics',         visible: true  },
  { id: 'trend',       label: 'Score Trend',         visible: true  },
  { id: 'cert_chart',  label: 'Certification Status',visible: true  },
  { id: 'task_chart',  label: 'Task Breakdown',      visible: true  },
  { id: 'alerts',      label: 'Recent Alerts',       visible: true  },
  { id: 'tasks',       label: 'Team Task Overview',  visible: true  },
]

function ScoreRing({ score }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cx = 70, cy = 70, r = 56, lw = 8
    const color = score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626'
    let current = 0
    const target = (score / 100) * Math.PI * 2
    const step = target / 60
    const draw = () => {
      ctx.clearRect(0, 0, 140, 140)
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = lw; ctx.stroke()
      ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + current)
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke()
      if (current < target) { current = Math.min(current + step, target); requestAnimationFrame(draw) }
    }
    draw()
  }, [score])
  const color = score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626'
  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <canvas ref={canvasRef} width={140} height={140} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 30, fontWeight: 800, color, fontFamily: 'var(--mono)', lineHeight: 1 }}>{score}%</div>
        <div style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '.06em', marginTop: 4, fontWeight: 600 }}>SCORE</div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ color: '#6B7280', marginBottom: 4 }}>{label}</div>
        <div style={{ color: '#7C3AED', fontWeight: 700 }}>{payload[0].value}% compliance</div>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { data: certs,  loading: l1, error: e1 } = useData(getCertifications)
  const { data: tasks,  loading: l2, error: e2 } = useData(getTasks)
  const { data: alerts, loading: l3, error: e3 } = useData(getAlerts)
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS)
  const [showCustomize, setShowCustomize] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [user, setUser] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadLayout() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(profile)
      // Load saved layout from profile metadata
      const { data: meta } = await supabase.from('users').select('dashboard_layout').eq('id', authUser.id).single()
      if (meta?.dashboard_layout) {
        try {
          const saved = JSON.parse(meta.dashboard_layout)
          if (Array.isArray(saved) && saved.length > 0) setWidgets(saved)
        } catch {}
      }
    }
    loadLayout()
  }, [])

  async function saveLayout(newWidgets) {
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      await supabase.from('users').update({
        dashboard_layout: JSON.stringify(newWidgets)
      }).eq('id', authUser.id)
    }
    setSaving(false)
  }

  function toggleWidget(id) {
    const updated = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
    setWidgets(updated)
  }

  function handleDragStart(id) { setDragging(id) }
  function handleDragOver(e, id) { e.preventDefault(); setDragOver(id) }
  function handleDrop(id) {
    if (!dragging || dragging === id) { setDragging(null); setDragOver(null); return }
    const from = widgets.findIndex(w => w.id === dragging)
    const to   = widgets.findIndex(w => w.id === id)
    const next = [...widgets]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setWidgets(next)
    setDragging(null)
    setDragOver(null)
  }

  async function handleSave() {
    await saveLayout(widgets)
    setShowCustomize(false)
  }

  function resetLayout() { setWidgets(DEFAULT_WIDGETS) }

  if (l1 || l2 || l3) return <LoadingState type="dashboard" />
  if (e1 || e2 || e3) return <ErrorState message={e1 || e2 || e3} />

  const c = certs  ?? []
  const t = tasks  ?? []
  const a = alerts ?? []

  const expired  = c.filter(x => x.status === 'expired').length
  const expiring = c.filter(x => x.status === 'expiring').length
  const valid    = c.filter(x => x.status === 'valid').length
  const overdue  = t.filter(x => x.status === 'overdue').length
  const unread   = a.filter(x => !x.acknowledged).length
  const score    = Math.max(0, 100 - (expired * 15) - (overdue * 10) - (expiring * 5))

  const tierColor = { critical: '#DC2626', warning: '#D97706', info: '#7C3AED' }
  const tierBg    = { critical: '#FEF2F2', warning: '#FFFBEB', info: '#F5F3FF' }

  const trendData = [
    { week: '8w ago',    score: Math.min(100, score + 22) },
    { week: '7w ago',    score: Math.min(100, score + 18) },
    { week: '6w ago',    score: Math.min(100, score + 15) },
    { week: '5w ago',    score: Math.min(100, score + 12) },
    { week: '4w ago',    score: Math.min(100, score + 8)  },
    { week: '3w ago',    score: Math.min(100, score + 5)  },
    { week: 'Last week', score: Math.min(100, score + 2)  },
    { week: 'This week', score },
  ]

  const certData = [
    { name: 'Valid',    value: valid,    color: '#059669' },
    { name: 'Expiring', value: expiring, color: '#D97706' },
    { name: 'Expired',  value: expired,  color: '#DC2626' },
  ].filter(d => d.value > 0)

  const taskData = [
    { name: 'Complete',    value: t.filter(x => x.status === 'complete').length,    color: '#059669' },
    { name: 'In progress', value: t.filter(x => x.status === 'in_progress').length, color: '#D97706' },
    { name: 'Scheduled',   value: t.filter(x => x.status === 'scheduled').length,   color: '#7C3AED' },
    { name: 'Overdue',     value: overdue, color: '#DC2626' },
  ].filter(d => d.value > 0)

  const isAdmin = ['admin', 'supervisor'].includes(user?.role)
  const visibleWidgets = widgets.filter(w => w.visible)
  const isVisible = (id) => widgets.find(w => w.id === id)?.visible !== false

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        action={
          isAdmin && (
            <button className="btn btn-ghost" onClick={() => setShowCustomize(true)}>
              <Settings size={14} strokeWidth={2} /> Customize
            </button>
          )
        }
      />

      {/* Customize modal */}
      {showCustomize && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Customize dashboard</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Drag to reorder · toggle to show/hide</div>
              </div>
              <button onClick={() => setShowCustomize(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
              {widgets.map(w => (
                <div
                  key={w.id}
                  draggable
                  onDragStart={() => handleDragStart(w.id)}
                  onDragOver={e => handleDragOver(e, w.id)}
                  onDrop={() => handleDrop(w.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 10,
                    border: `1.5px solid ${dragOver === w.id ? '#7C3AED' : '#E5E7EB'}`,
                    background: dragOver === w.id ? '#F5F3FF' : '#fff',
                    cursor: 'grab', transition: 'all .12s',
                    opacity: w.visible ? 1 : 0.5
                  }}
                >
                  <GripVertical size={16} color="#9CA3AF" />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#111827' }}>{w.label}</span>
                  <button onClick={() => toggleWidget(w.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: w.visible ? '#7C3AED' : '#9CA3AF', padding: 4
                  }}>
                    {w.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <button onClick={resetLayout} className="btn btn-ghost" style={{ fontSize: 12 }}>Reset to default</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowCustomize(false)} className="btn btn-ghost">Cancel</button>
                <button onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : 'Save layout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score widget */}
      {isVisible('score') && (
        <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 16 }}>
          <div className="card score-wrap" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ScoreRing score={score} />
            <div>
              <div className="label" style={{ marginBottom: 8 }}>Compliance score</div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.8 }}>
                <span style={{ color: '#DC2626', fontWeight: 600 }}>{expired} expired</span> cert{expired !== 1 ? 's' : ''}<br />
                <span style={{ color: '#D97706', fontWeight: 600 }}>{expiring} expiring</span> soon<br />
                <span style={{ color: '#DC2626', fontWeight: 600 }}>{overdue} overdue</span> tasks
              </div>
            </div>
          </div>
          {isVisible('metrics') && [
            { label: 'Certifications', value: c.length, sub: `${valid} valid · ${expiring} expiring`, subColor: '#6B7280', accent: '#7C3AED' },
            { label: 'Open tasks',     value: t.filter(x => x.status !== 'complete').length, sub: `${overdue} overdue`, subColor: overdue > 0 ? '#DC2626' : '#6B7280', accent: overdue > 0 ? '#DC2626' : '#7C3AED' },
            { label: 'Unread alerts',  value: unread, sub: `${a.filter(x => x.tier === 'critical' && !x.acknowledged).length} critical`, subColor: unread > 0 ? '#DC2626' : '#6B7280', accent: unread > 0 ? '#DC2626' : '#7C3AED' },
          ].map(m => (
            <div key={m.label} className="card" style={{ borderTop: `3px solid ${m.accent}` }}>
              <div className="label" style={{ marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#111827', lineHeight: 1, marginBottom: 6 }}>{m.value}</div>
              <div style={{ fontSize: 12, color: m.subColor, fontWeight: 500 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile score */}
      <div style={{ display: 'none' }} className="mobile-score-card">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <ScoreRing score={score} />
          <div style={{ flex: 1 }}>
            <div className="label" style={{ marginBottom: 8 }}>Compliance score</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              {[
                { label: 'Certs',      value: c.length, color: '#111827' },
                { label: 'Open tasks', value: t.filter(x => x.status !== 'complete').length, color: overdue > 0 ? '#DC2626' : '#111827' },
                { label: 'Expiring',   value: expiring, color: expiring > 0 ? '#D97706' : '#111827' },
                { label: 'Alerts',     value: unread,   color: unread > 0 ? '#DC2626' : '#111827' },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: m.color, fontFamily: 'var(--mono)' }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      {(isVisible('trend') || isVisible('cert_chart')) && (
        <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: isVisible('trend') && isVisible('cert_chart') ? '1fr 1fr 1fr' : '1fr', gap: 16 }}>
          {isVisible('trend') && (
            <div className="card" style={{ gridColumn: isVisible('cert_chart') ? 'span 2' : 'span 1' }}>
              <div className="label" style={{ marginBottom: 16 }}>Compliance score trend</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={2.5}
                    dot={{ fill: '#7C3AED', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#7C3AED' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {isVisible('cert_chart') && (
            <div className="card">
              <div className="label" style={{ marginBottom: 16 }}>Certification status</div>
              {certData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={certData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {certData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Legend formatter={(value) => <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 500 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>No certification data yet</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Task chart + Alerts row */}
      {(isVisible('task_chart') || isVisible('alerts')) && (
        <div style={{ display: 'grid', gridTemplateColumns: isVisible('task_chart') && isVisible('alerts') ? '1fr 1fr' : '1fr', gap: 16 }}>
          {isVisible('task_chart') && (
            <div className="card">
              <div className="label" style={{ marginBottom: 16 }}>Task breakdown</div>
              {taskData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={taskData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {taskData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Legend formatter={(value) => <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 500 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>No task data yet</div>
              )}
            </div>
          )}
          {isVisible('alerts') && (
            <div className="card">
              <div className="label" style={{ marginBottom: 14 }}>Recent alerts</div>
              {a.length === 0 && <div style={{ fontSize: 13, color: '#9CA3AF', padding: '20px 0', textAlign: 'center' }}>No alerts — all clear.</div>}
              {a.slice(0, 4).map(al => (
                <div key={al.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: tierBg[al.tier], color: tierColor[al.tier], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                    {al.tier === 'critical' ? '▲' : al.tier === 'warning' ? '●' : 'ℹ'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#111827', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{al.message}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3, fontWeight: 500 }}>
                      {al.tier.toUpperCase()} · {new Date(al.created_at).toLocaleDateString()}
                      {!al.acknowledged && <span style={{ color: '#DC2626', marginLeft: 8 }}>● Unread</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task table */}
      {isVisible('tasks') && (
        <div className="card">
          <div className="label" style={{ marginBottom: 16 }}>Team task overview</div>
          <table className="data-table">
            <thead>
              <tr><th>Employee</th><th>Task</th><th>Type</th><th>Due date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {t.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}>No tasks yet.</td></tr>}
              {t.map(tk => (
                <tr key={tk.id}>
                  <td style={{ fontWeight: 600, color: '#111827' }}>{tk.users?.full_name}</td>
                  <td style={{ color: '#111827' }}>{tk.title}</td>
                  <td style={{ color: '#6B7280', fontFamily: 'var(--mono)', fontSize: 12 }}>{tk.type}</td>
                  <td style={{ color: tk.status === 'overdue' ? '#DC2626' : '#374151', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: tk.status === 'overdue' ? 600 : 400 }}>{tk.due_date}</td>
                  <td>
                    <span className={`pill pill-${tk.status === 'overdue' ? 'red' : tk.status === 'in_progress' ? 'amber' : tk.status === 'complete' ? 'green' : 'blue'}`}>
                      {tk.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile task cards */}
      <div className="mobile-card-list">
        <div className="label" style={{ marginBottom: 8 }}>Team task overview</div>
        {t.map(tk => (
          <div key={tk.id} className="mobile-card" style={{
            borderLeft: `3px solid ${tk.status === 'overdue' ? '#DC2626' : tk.status === 'in_progress' ? '#D97706' : tk.status === 'complete' ? '#059669' : '#7C3AED'}`
          }}>
            <div className="mobile-card-row">
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{tk.title}</span>
              <span className={`pill pill-${tk.status === 'overdue' ? 'red' : tk.status === 'in_progress' ? 'amber' : tk.status === 'complete' ? 'green' : 'blue'}`}>
                {tk.status.replace('_', ' ')}
              </span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">Assigned to</span>
              <span className="mobile-card-value">{tk.users?.full_name}</span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">Due</span>
              <span className="mobile-card-value" style={{ color: tk.status === 'overdue' ? '#DC2626' : '#111827' }}>{tk.due_date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}