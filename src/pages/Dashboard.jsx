import { useEffect, useRef, useState } from 'react'
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
    const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'
    let current = 0
    const target = (score / 100) * Math.PI * 2
    const step = target / 60
    const draw = () => {
      ctx.clearRect(0, 0, 140, 140)
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = '#1E3A52'
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

  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <canvas ref={canvasRef} width={140} height={140} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 30, fontWeight: 700, color, fontFamily: 'var(--mono)', lineHeight: 1 }}>
          {score}%
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.06em', marginTop: 4 }}>
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
        background: 'var(--surface2)', border: '0.5px solid var(--border)',
        borderRadius: 8, padding: '10px 14px', fontSize: 13
      }}>
        <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
        <div style={{ color: '#3B7CFF', fontWeight: 600 }}>{payload[0].value}% compliance</div>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { data: certs, loading: l1, error: e1 } = useData(getCertifications)
  const { data: tasks, loading: l2, error: e2 } = useData(getTasks)
  const { data: alerts, loading: l3, error: e3 } = useData(getAlerts)

  if (l1 || l2 || l3) return <LoadingState />
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

  const tierColor = { critical: 'var(--red)', warning: 'var(--amber)', info: 'var(--blue)' }
  const tierBg    = { critical: 'var(--red-dim)', warning: 'var(--amber-dim)', info: 'var(--blue-dim)' }

  // Simulated weekly trend — last 8 weeks leading to current score
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

  // Cert donut data
  const certData = [
    { name: 'Valid', value: valid, color: '#10B981' },
    { name: 'Expiring', value: expiring, color: '#F59E0B' },
    { name: 'Expired', value: expired, color: '#EF4444' },
  ].filter(d => d.value > 0)

  // Task breakdown
  const taskData = [
    { name: 'Complete', value: t.filter(x => x.status === 'complete').length, color: '#10B981' },
    { name: 'In progress', value: t.filter(x => x.status === 'in_progress').length, color: '#F59E0B' },
    { name: 'Scheduled', value: t.filter(x => x.status === 'scheduled').length, color: '#3B7CFF' },
    { name: 'Overdue', value: overdue, color: '#EF4444' },
  ].filter(d => d.value > 0)

  return (
    <div className="page-wrap" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Dashboard"
        subtitle={`ResponseOS · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
      />

      {/* Score + metrics */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 14 }}>
        <div className="card score-wrap" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <ScoreRing score={score} />
          <div>
            <div className="label" style={{ marginBottom: 8 }}>Compliance score</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
              <span style={{ color: 'var(--red)', fontWeight: 500 }}>{expired} expired</span> cert{expired !== 1 ? 's' : ''}<br />
              <span style={{ color: 'var(--amber)', fontWeight: 500 }}>{expiring} expiring</span> soon<br />
              <span style={{ color: 'var(--red)', fontWeight: 500 }}>{overdue} overdue</span> tasks
            </div>
          </div>
        </div>
        {[
          { label: 'Certifications', value: c.length, sub: `${valid} valid · ${expiring} expiring`, subColor: 'var(--text2)' },
          { label: 'Open tasks', value: t.filter(x => x.status !== 'complete').length, sub: `${overdue} overdue`, subColor: 'var(--red)' },
          { label: 'Unread alerts', value: unread, sub: `${a.filter(x => x.tier === 'critical' && !x.acknowledged).length} critical`, subColor: 'var(--red)' },
        ].map(m => (
          <div key={m.label} className="card">
            <div className="label" style={{ marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--mono)', lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: m.subColor, marginTop: 5 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Mobile score card */}
      <div style={{ display: 'none' }} className="mobile-score-card">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <ScoreRing score={score} />
          <div style={{ flex: 1 }}>
            <div className="label" style={{ marginBottom: 8 }}>Compliance score</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              {[
                { label: 'Certs', value: c.length, color: 'var(--text)' },
                { label: 'Open tasks', value: t.filter(x => x.status !== 'complete').length, color: overdue > 0 ? 'var(--red)' : 'var(--text)' },
                { label: 'Expiring', value: expiring, color: expiring > 0 ? 'var(--amber)' : 'var(--text)' },
                { label: 'Alerts', value: unread, color: unread > 0 ? 'var(--red)' : 'var(--text)' },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{m.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: m.color, fontFamily: 'var(--mono)' }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* Compliance trend */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="label" style={{ marginBottom: 16 }}>Compliance score trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fill: '#4F6A84', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#4F6A84', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="score"
                stroke="#2563EB" strokeWidth={2.5}
                dot={{ fill: '#2563EB', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#2563EB' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cert donut */}
        <div className="card">
          <div className="label" style={{ marginBottom: 16 }}>Certification status</div>
          {certData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={certData} cx="50%" cy="45%"
                  innerRadius={50} outerRadius={75}
                  paddingAngle={3} dataKey="value"
                >
                  {certData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span style={{ color: 'var(--text2)', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No certification data yet
            </div>
          )}
        </div>
      </div>

      {/* Task breakdown + recent alerts */}
      <div className="grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Task donut */}
        <div className="card">
          <div className="label" style={{ marginBottom: 16 }}>Task breakdown</div>
          {taskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={taskData} cx="50%" cy="45%"
                  innerRadius={50} outerRadius={75}
                  paddingAngle={3} dataKey="value"
                >
                  {taskData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span style={{ color: 'var(--text2)', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No task data yet
            </div>
          )}
        </div>

        {/* Recent alerts */}
        <div className="card">
          <div className="label" style={{ marginBottom: 14 }}>Recent alerts</div>
          {a.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>No alerts — all clear.</div>
          )}
          {a.slice(0, 4).map(al => (
            <div key={al.id} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '10px 0', borderBottom: '0.5px solid var(--border)'
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                background: tierBg[al.tier], color: tierColor[al.tier],
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13
              }}>
                {al.tier === 'critical' ? '▲' : al.tier === 'warning' ? '●' : 'ℹ'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {al.message}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: 3 }}>
                  {al.tier.toUpperCase()} · {new Date(al.created_at).toLocaleDateString()}
                  {!al.acknowledged && <span style={{ color: 'var(--red)', marginLeft: 8 }}>● Unread</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task overview table */}
      <div className="card">
        <div className="label" style={{ marginBottom: 14 }}>Team task overview</div>
        <table className="data-table">
          <thead>
            <tr><th>Employee</th><th>Task</th><th>Type</th><th>Due date</th><th>Status</th></tr>
          </thead>
          <tbody>
            {t.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>No tasks yet.</td></tr>
            )}
            {t.map(tk => (
              <tr key={tk.id}>
                <td style={{ fontWeight: 500 }}>{tk.users?.full_name}</td>
                <td>{tk.title}</td>
                <td className="mono">{tk.type}</td>
                <td className="mono" style={{ color: tk.status === 'overdue' ? 'var(--red)' : 'var(--text2)' }}>{tk.due_date}</td>
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
            borderLeft: `3px solid ${tk.status === 'overdue' ? 'var(--red)' : tk.status === 'in_progress' ? 'var(--amber)' : tk.status === 'complete' ? 'var(--green)' : 'var(--blue)'}`
          }}>
            <div className="mobile-card-row">
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{tk.title}</span>
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
              <span className="mobile-card-value" style={{ color: tk.status === 'overdue' ? 'var(--red)' : 'var(--text)' }}>
                {tk.due_date}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}