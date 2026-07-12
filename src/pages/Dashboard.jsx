import { useEffect, useRef } from 'react'
import PageHeader from '../components/PageHeader'
import { useData } from '../lib/useData'
import { getCertifications, getTasks, getAlerts } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'

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

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Dashboard"
        subtitle={`ResponseOS · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 14 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="label" style={{ marginBottom: 16 }}>Certification health</div>
          {[
            { label: 'Valid', count: valid, color: 'var(--green)' },
            { label: 'Expiring soon', count: expiring, color: 'var(--amber)' },
            { label: 'Expired', count: expired, color: 'var(--red)' },
          ].map(row => (
            <div key={row.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: 'var(--text2)' }}>{row.label}</span>
                <span style={{ color: row.color, fontFamily: 'var(--mono)' }}>{row.count}</span>
              </div>
              <div style={{ background: 'var(--surface3)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                <div style={{
                  height: 4, borderRadius: 99, background: row.color,
                  width: c.length ? `${(row.count / c.length) * 100}%` : '0%',
                  transition: 'width .5s ease'
                }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="label" style={{ marginBottom: 14 }}>Recent alerts</div>
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
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{al.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: 3 }}>
                  {al.tier.toUpperCase()} · {new Date(al.created_at).toLocaleDateString()}
                  {!al.acknowledged && <span style={{ color: 'var(--red)', marginLeft: 8 }}>● Unread</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="label" style={{ marginBottom: 14 }}>Team task overview</div>
        <table className="data-table">
          <thead>
            <tr><th>Employee</th><th>Task</th><th>Type</th><th>Due date</th><th>Status</th></tr>
          </thead>
          <tbody>
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
    </div>
  )
}