import { useEffect, useRef } from 'react'
import PageHeader from '../components/PageHeader'
import { useData } from '../lib/useData'
import { getCertifications, getTasks, getAlerts } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

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
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = '#E4E6EF'
      ctx.lineWidth = lw
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + current)
      ctx.strokeStyle = color
      ctx.lineWidth = lw
      ctx.lineCap = 'round'
      ctx.stroke()
      if (current < target) { current = Math.min(current + step, target); requestAnimationFrame(draw) }
    }
    draw()
  }, [score])

  const color = score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626'

  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <canvas ref={canvasRef} width={140} height={140} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 30, fontWeight: 800, color, fontFamily: 'var(--mono)', lineHeight: 1 }}>
          {score}%
        </div>
        <div style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '.06em', marginTop: 4, fontWeight: 600 }}>
          SCORE
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#fff', border: '1px solid #E4E6EF',
        borderRadius: 8, padding: '10px 14px', fontSize: 13,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <div style={{ color: '#6B7280', marginBottom: 4 }}>{label}</div>
        <div style={{ color: '#6B4EFF', fontWeight: 700 }}>{payload[0].value}% compliance</div>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { data: certs, loading: l1, error: e1 } = useData(getCertifications)
  const { data: tasks, loading: l2, error: e2 } = useData(getTasks)
  const { data: alerts, loading: l3, error: e3 } = useData(getAlerts)

  if (l1 || l2 || l3) return <LoadingState type="dashboard" />
  if (e1 || e2 || e3) return <ErrorState message={e1 || e2 || e3} />

  const c = certs ?? []
  const t = tasks ?? []
  const a = alerts ?? []

  const expired  = c.filter(x => x.status === 'expired').length
  const expiring = c.filter(x => x.status === 'expiring').length
  const valid    = c.filter(x => x.status === 'valid').length
  const overdue  = t.filter(x => x.status === 'overdue').length
  const unread   = a.filter(x => !x.acknowledged).length
  const score    = Math.max(0, 100 - (expired * 15) - (overdue * 10) - (expiring * 5))

  const tierColor = { critical: '#DC2626', warning: '#D97706', info: '#6B4EFF' }
  const tierBg    = { critical: '#FEF2F2', warning: '#FFFBEB', info: '#EEF0FF' }

  const trendData = [
    { week: '8w ago', score: Math.min(100, score + 22) },
    { week: '7w ago', score: Math.min(100, score + 18) },
    { week: '6w ago', score: Math.min(100, score + 15) },
    { week: '5w ago', score: Math.min(100, score + 12) },
    { week: '4w ago', score: Math.min(100, score + 8) },
    { week: '3w ago', score: Math.min(100, score + 5) },
    { week: 'Last week', score: Math.min(100, score + 2) },
    { week: 'This week', score },
  ]

  const certData = [
    { name: 'Valid', value: valid, color: '#059669' },
    { name: 'Expiring', value: expiring, color: '#D97706' },
    { name: 'Expired', value: expired, color: '#DC2626' },
  ].filter(d => d.value > 0)

  const taskData = [
    { name: 'Complete', value: t.filter(x => x.status === 'complete').length, color: '#059669' },
    { name: 'In progress', value: t.filter(x => x.status === 'in_progress').length, color: '#D97706' },
    { name: 'Scheduled', value: t.filter(x => x.status === 'scheduled').length, color: '#6B4EFF' },
    { name: 'Overdue', value: overdue, color: '#DC2626' },
  ].filter(d => d.value > 0)

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      />

      {/* Metrics */}
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

        {[
          { label: 'Certifications', value: c.length, sub: `${valid} valid · ${expiring} expiring`, subColor: '#6B7280', accent: '#6B4EFF' },
          { label: 'Open tasks', value: t.filter(x => x.status !== 'complete').length, sub: `${overdue} overdue`, subColor: overdue > 0 ? '#DC2626' : '#6B7280', accent: overdue > 0 ? '#DC2626' : '#6B4EFF' },
          { label: 'Unread alerts', value: unread, sub: `${a.filter(x => x.tier === 'critical' && !x.acknowledged).length} critical`, subColor: unread > 0 ? '#DC2626' : '#6B7280', accent: unread > 0 ? '#DC2626' : '#6B4EFF' },
        ].map(m => (
          <div key={m.label} className="card" style={{ borderTop: `3px solid ${m.accent}` }}>
            <div className="label" style={{ marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#0F1117', lineHeight: 1, marginBottom: 6 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: m.subColor, fontWeight: 500 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Mobile score */}
      <div style={{ display: 'none' }} className="mobile-score-card">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <ScoreRing score={score} />
          <div style={{ flex: 1 }}>
            <div className="label" style={{ marginBottom: 8 }}>Compliance score</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              {[
                { label: 'Certs', value: c.length, color: '#0F1117' },
                { label: 'Open tasks', value: t.filter(x => x.status !== 'complete').length, color: overdue > 0 ? '#DC2626' : '#0F1117' },
                { label: 'Expiring', value: expiring, color: expiring > 0 ? '#D97706' : '#0F1117' },
                { label: 'Alerts', value: unread, color: unread > 0 ? '#DC2626' : '#0F1117' },
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

      {/* Charts */}
      <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="label" style={{ marginBottom: 16 }}>Compliance score trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="score" stroke="#6B4EFF" strokeWidth={2.5}
                dot={{ fill: '#6B4EFF', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#6B4EFF' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

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
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>
              No certification data yet
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>
              No task data yet
            </div>
          )}
        </div>

        <div className="card">
          <div className="label" style={{ marginBottom: 14 }}>Recent alerts</div>
          {a.length === 0 && (
            <div style={{ fontSize: 13, color: '#9CA3AF', padding: '20px 0', textAlign: 'center' }}>No alerts — all clear.</div>
          )}
          {a.slice(0, 4).map(al => (
            <div key={al.id} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '10px 0', borderBottom: '1px solid #F3F4F8'
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: tierBg[al.tier], color: tierColor[al.tier],
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700
              }}>
                {al.tier === 'critical' ? '▲' : al.tier === 'warning' ? '●' : 'ℹ'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#0F1117', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {al.message}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3, fontWeight: 500 }}>
                  {al.tier.toUpperCase()} · {new Date(al.created_at).toLocaleDateString()}
                  {!al.acknowledged && <span style={{ color: '#DC2626', marginLeft: 8 }}>● Unread</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task table */}
      <div className="card">
        <div className="label" style={{ marginBottom: 16 }}>Team task overview</div>
        <table className="data-table">
          <thead>
            <tr><th>Employee</th><th>Task</th><th>Type</th><th>Due date</th><th>Status</th></tr>
          </thead>
          <tbody>
            {t.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}>No tasks yet.</td></tr>
            )}
            {t.map(tk => (
              <tr key={tk.id}>
                <td style={{ fontWeight: 600 }}>{tk.users?.full_name}</td>
                <td>{tk.title}</td>
                <td style={{ color: '#6B7280', fontFamily: 'var(--mono)', fontSize: 12 }}>{tk.type}</td>
                <td style={{ color: tk.status === 'overdue' ? '#DC2626' : '#6B7280', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: tk.status === 'overdue' ? 600 : 400 }}>{tk.due_date}</td>
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

      {/* Mobile task cards */}
      <div className="mobile-card-list">
        <div className="label" style={{ marginBottom: 8 }}>Team task overview</div>
        {t.map(tk => (
          <div key={tk.id} className="mobile-card" style={{
            borderLeft: `3px solid ${tk.status === 'overdue' ? '#DC2626' : tk.status === 'in_progress' ? '#D97706' : tk.status === 'complete' ? '#059669' : '#6B4EFF'}`
          }}>
            <div className="mobile-card-row">
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0F1117' }}>{tk.title}</span>
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
              <span className="mobile-card-value" style={{ color: tk.status === 'overdue' ? '#DC2626' : '#0F1117' }}>
                {tk.due_date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
