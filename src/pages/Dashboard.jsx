import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useData } from '../lib/useData'
import { getCertifications, getAlerts, supabase } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import {
  todayStr, daysBetween, formatTime, prettyDate, DEFAULT_TIME,
  autoRenewalDate, scheduledRenewalKeys, hasRenewal, buildRenewalGroups,
  scheduleRenewal, undoAssignments
} from '../lib/training'
import {
  Settings, X, GripVertical, Eye, EyeOff, Clock, MapPin, Users, ArrowRight,
  AlertTriangle, AlertCircle, Info, CalendarCheck, Mail, Undo2, Loader2
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const SUPER_EMAILS = ['jlane@responseos.net', 'hseals@responseos.net']

const DEFAULT_WIDGETS = [
  { id: 'score',             label: 'Compliance Score',     visible: true },
  { id: 'metrics',           label: 'Key Metrics',          visible: true },
  { id: 'upcoming_training', label: 'Upcoming Training',    visible: true },
  { id: 'trend',             label: 'Score Trend',          visible: true },
  { id: 'cert_chart',        label: 'Certification Status', visible: true },
  { id: 'attendance_chart',  label: 'Training Attendance',  visible: true },
  { id: 'alerts',            label: 'Recent Alerts',        visible: true },
]

// Keep saved order/visibility, drop removed widgets, append new ones
function mergeLayout(saved) {
  const known = new Map(DEFAULT_WIDGETS.map(w => [w.id, w]))
  const kept = saved.filter(w => known.has(w.id)).map(w => ({ ...known.get(w.id), visible: w.visible }))
  const missing = DEFAULT_WIDGETS.filter(w => !kept.some(k => k.id === w.id))
  return [...kept, ...missing]
}

function emailNote(r) {
  if (r.emailError) return ' · email failed'
  return r.emailed ? ` · ${r.emailed} email${r.emailed !== 1 ? 's' : ''} sent` : ''
}

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

const PieTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#111827' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.payload.color }} />
        {p.name}: {p.value}
      </div>
      {p.payload.hint && <div style={{ color: '#6B7280', marginTop: 3 }}>{p.payload.hint}</div>}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: certs,  loading: l1, error: e1 } = useData(getCertifications)
  const { data: alerts, loading: l2, error: e2 } = useData(getAlerts)
  const [assignments, setAssignments] = useState([])
  const [loadingA, setLoadingA] = useState(true)
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS)
  const [showCustomize, setShowCustomize] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [user, setUser] = useState(null)
  const [saving, setSaving] = useState(false)

  // Auto-schedule state
  const [scheduling, setScheduling] = useState(null)   // group key | 'all' | 'undo'
  const [banner, setBanner] = useState(null)            // { text, ids, error }

  async function loadAssignments(isDemo) {
    const { data } = await supabase
      .from('training_assignments')
      .select('*, training_assignment_members(user_id, status)')
      .eq('is_demo', isDemo)
      .neq('status', 'cancelled')
      .order('scheduled_date', { ascending: true })
    setAssignments(data || [])
  }

  useEffect(() => {
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setLoadingA(false); return }
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(profile)

      if (profile?.dashboard_layout) {
        try {
          const saved = JSON.parse(profile.dashboard_layout)
          if (Array.isArray(saved) && saved.length > 0) setWidgets(mergeLayout(saved))
        } catch {}
      }

      await loadAssignments(profile?.is_demo === true)
      setLoadingA(false)
    }
    init()
  }, [])

  async function handleSave() {
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      await supabase.from('users').update({ dashboard_layout: JSON.stringify(widgets) }).eq('id', authUser.id)
    }
    setSaving(false)
    setShowCustomize(false)
  }

  function toggleWidget(id) { setWidgets(widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w)) }
  function handleDrop(id) {
    if (!dragging || dragging === id) { setDragging(null); setDragOver(null); return }
    const from = widgets.findIndex(w => w.id === dragging)
    const to   = widgets.findIndex(w => w.id === id)
    const next = [...widgets]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setWidgets(next); setDragging(null); setDragOver(null)
  }

  // ---- One-click renewals (shared with Assignments) ----
  async function autoSchedule(groups, key) {
    setScheduling(key); setBanner(null)
    const done = []
    try {
      for (const g of groups) done.push(await scheduleRenewal(user, g))
      await loadAssignments(user?.is_demo === true)
      const emails = done.reduce((s, r) => s + (r.emailed || 0), 0)
      const failed = done.some(r => r.emailError)
      const text = done.length === 1
        ? `${done[0].cert} renewal set for ${prettyDate(done[0].date)} · ${formatTime(DEFAULT_TIME)} — ${done[0].people} assigned${emailNote(done[0])}`
        : `${done.length} renewal sessions scheduled${emails ? ` · ${emails} emails sent` : ''}${failed ? ' · some emails failed' : ''}`
      setBanner({ text, ids: done.map(d => d.created.id) })
    } catch (err) {
      if (done.length) await loadAssignments(user?.is_demo === true)
      setBanner({ text: err.message, ids: done.map(d => d.created.id), error: true })
    }
    setScheduling(null)
  }

  async function undoBanner() {
    if (!banner?.ids?.length) { setBanner(null); return }
    setScheduling('undo')
    try {
      await undoAssignments(banner.ids)
      setBanner({ text: 'Undone — cancellation emails sent.', ids: [] })
    } catch (err) {
      setBanner({ text: err.message, ids: [], error: true })
    }
    await loadAssignments(user?.is_demo === true)
    setScheduling(null)
  }

  if (l1 || l2 || loadingA) return <LoadingState type="dashboard" />
  if (e1 || e2) return <ErrorState message={e1 || e2} />

  const c = certs  ?? []
  const a = alerts ?? []
  const today = todayStr()

  const expired  = c.filter(x => x.status === 'expired').length
  const expiring = c.filter(x => x.status === 'expiring').length
  const valid    = c.filter(x => x.status === 'valid').length
  const unread   = a.filter(x => !x.acknowledged).length

  const open      = assignments.filter(x => x.status === 'scheduled')
  const upcoming  = open.filter(x => x.scheduled_date >= today)
  const pastDue   = open.filter(x => x.scheduled_date < today)
  const nextWeek  = upcoming.filter(x => daysBetween(x.scheduled_date) <= 7)
  const score     = Math.max(0, 100 - (expired * 15) - (pastDue.length * 10) - (expiring * 5))

  // ---- Renewal matching ----
  const keys = scheduledRenewalKeys(assignments)
  const expiringCerts = c.filter(x => x.status === 'expiring')
  const expiredCerts  = c.filter(x => x.status === 'expired')
  const expiringScheduled   = expiringCerts.filter(x => hasRenewal(keys, x)).length
  const expiringUnscheduled = expiringCerts.length - expiringScheduled
  const expiredScheduled    = expiredCerts.filter(x => hasRenewal(keys, x)).length
  const renewalGroups = buildRenewalGroups([...expiredCerts, ...expiringCerts], keys)

  const allMembers = assignments.flatMap(x => x.training_assignment_members || [])
  const attendanceData = [
    { name: 'Attended', value: allMembers.filter(m => m.status === 'completed').length, color: '#059669' },
    { name: 'Pending',  value: allMembers.filter(m => m.status === 'pending').length,   color: '#A78BFA' },
    { name: 'Missed',   value: allMembers.filter(m => m.status === 'missed').length,    color: '#DC2626' },
  ].filter(d => d.value > 0)

  const certData = [
    { name: 'Valid',                   value: valid,               color: '#059669', hint: 'Current and in good standing' },
    { name: 'Expiring/Scheduled',      value: expiringScheduled,   color: '#7C3AED', hint: 'Renewal training is scheduled' },
    { name: 'Expiring, not scheduled', value: expiringUnscheduled, color: '#D97706', hint: 'No renewal session booked yet' },
    { name: 'Expired',                 value: expired,             color: '#DC2626', hint: expiredScheduled ? `${expiredScheduled} with renewal scheduled` : 'Needs immediate renewal' },
  ].filter(d => d.value > 0)

  const trendData = ['8w ago', '7w ago', '6w ago', '5w ago', '4w ago', '3w ago', 'Last week', 'This week']
    .map((week, i) => ({ week, score: Math.min(100, score + [22, 18, 15, 12, 8, 5, 2, 0][i]) }))

  const tier = {
    critical: { color: '#DC2626', bg: '#FEF2F2', Icon: AlertTriangle },
    warning:  { color: '#D97706', bg: '#FFFBEB', Icon: AlertCircle },
    info:     { color: '#7C3AED', bg: '#F5F3FF', Icon: Info },
  }

  const role = String(user?.role || '').toLowerCase()
  const isSuper = SUPER_EMAILS.includes(String(user?.email || '').toLowerCase())
  const isAdmin = ['admin', 'supervisor'].includes(role) || isSuper
  const canViewAll = ['admin', 'supervisor', 'auditor'].includes(role) || isSuper

  const sessionList = [...pastDue, ...upcoming].slice(0, 6)
  const legendFmt = data => v => {
    const d = data.find(x => x.name === v)
    return <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 500 }}>{v}{d ? ` (${d.value})` : ''}</span>
  }
  const busy = !!scheduling

  // ---- Widgets ----
  const W = {
    score: () => (
      <div className="card score-wrap" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <ScoreRing score={score} />
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Compliance score</div>
          <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.8 }}>
            <span style={{ color: '#DC2626', fontWeight: 600 }}>{expired} expired</span> cert{expired !== 1 ? 's' : ''}<br />
            <span style={{ color: '#D97706', fontWeight: 600 }}>{expiring} expiring</span> soon{expiringScheduled ? <span style={{ color: '#7C3AED', fontWeight: 600 }}> · {expiringScheduled} scheduled</span> : null}<br />
            <span style={{ color: pastDue.length ? '#DC2626' : '#6B7280', fontWeight: 600 }}>{pastDue.length} past-due</span> training
          </div>
        </div>
      </div>
    ),

    metrics: () => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Certifications',     value: c.length,        sub: `${valid} valid · ${expiring} expiring`, accent: '#7C3AED', subColor: '#6B7280' },
          { label: 'Scheduled training', value: upcoming.length, sub: `${nextWeek.length} in the next 7 days${pastDue.length ? ` · ${pastDue.length} past due` : ''}`, accent: pastDue.length ? '#DC2626' : '#7C3AED', subColor: pastDue.length ? '#DC2626' : '#6B7280' },
          { label: 'Unread alerts',      value: unread,          sub: `${a.filter(x => x.tier === 'critical' && !x.acknowledged).length} critical`, accent: unread ? '#DC2626' : '#7C3AED', subColor: unread ? '#DC2626' : '#6B7280' },
        ].map(m => (
          <div key={m.label} className="card" style={{ borderTop: `3px solid ${m.accent}` }}>
            <div className="label" style={{ marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#111827', lineHeight: 1, marginBottom: 6 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: m.subColor, fontWeight: 500 }}>{m.sub}</div>
          </div>
        ))}
      </div>
    ),

    upcoming_training: () => (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="label">{canViewAll ? 'Upcoming training' : 'Your upcoming training'}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{upcoming.length} scheduled{pastDue.length ? ` · ${pastDue.length} need completion` : ''}</div>
          </div>
          <button onClick={() => navigate('/tasks')} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Inter, sans-serif' }}>
            View all <ArrowRight size={14} />
          </button>
        </div>
        {sessionList.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
            No training scheduled.{isAdmin ? ' Schedule a session from Assignments.' : ''}
          </div>
        ) : sessionList.map((s, i) => {
          const members = s.training_assignment_members || []
          const done = members.filter(m => m.status === 'completed').length
          const late = s.scheduled_date < today
          const days = daysBetween(s.scheduled_date)
          const d = new Date(s.scheduled_date + 'T00:00:00')
          const mine = members.find(m => m.user_id === user?.id)
          return (
            <div key={s.id} onClick={() => navigate('/tasks')} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < sessionList.length - 1 ? '1px solid #F9FAFB' : 'none', cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.background = '#FAFAFA'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 46, flexShrink: 0, textAlign: 'center', borderRadius: 8, border: `1px solid ${late ? '#FECACA' : '#E5E7EB'}`, background: late ? '#FEF2F2' : '#F9FAFB', padding: '4px 0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: late ? '#B91C1C' : '#6B7280', textTransform: 'uppercase' }}>{d.toLocaleDateString('en-US', { month: 'short' })}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: late ? '#B91C1C' : '#111827', lineHeight: 1.1 }}>{d.getDate()}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {s.start_time && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {formatTime(s.start_time)}</span>}
                  {s.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {s.location}</span>}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Users size={11} /> {canViewAll ? `${members.length} assigned · ${done} attended` : 'Assigned to you'}</span>
                </div>
              </div>
              <span style={{
                padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                background: late ? '#FEF2F2' : '#F5F3FF', color: late ? '#B91C1C' : '#5B21B6',
                border: `1px solid ${late ? '#FECACA' : '#DDD6FE'}`
              }}>
                {late ? 'Past due' : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days}d`}
              </span>
              {!canViewAll && mine && mine.status !== 'pending' && (
                <span style={{ fontSize: 11, fontWeight: 700, color: mine.status === 'completed' ? '#047857' : '#B91C1C' }}>
                  {mine.status === 'completed' ? 'Attended' : 'Missed'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    ),

    trend: () => (
      <div className="card">
        <div className="label" style={{ marginBottom: 16 }}>Compliance score trend</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={2.5} dot={{ fill: '#7C3AED', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: '#7C3AED' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    ),

    cert_chart: () => (
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="label">Certification status</div>
          {(expiringScheduled + expiredScheduled) > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED' }}>
              {expiringScheduled + expiredScheduled} renewal{expiringScheduled + expiredScheduled !== 1 ? 's' : ''} scheduled
            </span>
          )}
        </div>
        {certData.length > 0 ? (
          <>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={certData} cx="50%" cy="42%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {certData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                  <Legend formatter={legendFmt(certData)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{c.length}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', letterSpacing: '.06em', marginTop: 2 }}>CERTS</div>
              </div>
            </div>

            {/* Confirmation banner */}
            {isAdmin && banner && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: banner.error ? '#FEF2F2' : '#F5F3FF', border: `1px solid ${banner.error ? '#FECACA' : '#DDD6FE'}`, color: banner.error ? '#B91C1C' : '#5B21B6' }}>
                {banner.error ? <AlertTriangle size={14} /> : <Mail size={14} />}
                <span style={{ flex: 1, minWidth: 0 }}>{banner.text}</span>
                {!banner.error && banner.ids?.length > 0 && (
                  <button onClick={() => navigate('/tasks')} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>View</button>
                )}
                {banner.ids?.length > 0 && (
                  <button onClick={undoBanner} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', color: '#6B7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    {scheduling === 'undo' ? <Loader2 size={12} className="spin" /> : <Undo2 size={12} />} Undo
                  </button>
                )}
                <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={13} /></button>
              </div>
            )}

            {isAdmin && renewalGroups.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    Needs a renewal session ({renewalGroups.length})
                  </div>
                  {renewalGroups.length > 1 && (
                    <button onClick={() => autoSchedule(renewalGroups, 'all')} disabled={busy}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#7C3AED', fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: busy ? 0.6 : 1 }}>
                      {scheduling === 'all' ? <Loader2 size={13} className="spin" /> : <CalendarCheck size={13} />} Auto-schedule all
                    </button>
                  )}
                </div>
                {renewalGroups.slice(0, 4).map(g => {
                  const firstName = g.certs[0]?.users?.full_name || 'Unassigned'
                  const working = scheduling === g.key
                  const autoDate = autoRenewalDate(g.soonest)
                  return (
                    <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 12 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: g.anyExpired ? '#DC2626' : '#D97706' }} />
                      <span style={{ flex: 1, minWidth: 0, color: '#111827', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.cert_name} <span style={{ color: '#9CA3AF', fontWeight: 500 }}>· {g.people === 1 ? firstName : `${g.people} people`}</span>
                      </span>
                      <span style={{ fontWeight: 700, color: g.anyExpired ? '#B91C1C' : '#B45309', whiteSpace: 'nowrap' }}>
                        {g.soonest < 0 ? `${Math.abs(g.soonest)}d overdue` : `${g.soonest}d left`}
                      </span>
                      <button onClick={() => autoSchedule([g], g.key)} disabled={busy}
                        title={`Schedule for ${prettyDate(autoDate)} and email ${g.people === 1 ? firstName : `${g.people} people`}`}
                        style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, border: '1px solid #DDD6FE', background: '#F5F3FF', cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy && !working ? 0.5 : 1 }}>
                        {working ? <Loader2 size={14} color="#7C3AED" className="spin" /> : <CalendarCheck size={14} color="#7C3AED" />}
                      </button>
                    </div>
                  )
                })}
                {renewalGroups.length > 4 && (
                  <button onClick={() => navigate('/tasks')} style={{ marginTop: 4, background: 'none', border: 'none', color: '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', padding: 0 }}>
                    +{renewalGroups.length - 4} more on Assignments →
                  </button>
                )}
              </div>
            )}
          </>
        ) : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>No certification data yet</div>}
      </div>
    ),

    attendance_chart: () => (
      <div className="card">
        <div className="label" style={{ marginBottom: 16 }}>Training attendance</div>
        {attendanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={attendanceData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {attendanceData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<PieTip />} />
              <Legend formatter={legendFmt(attendanceData)} />
            </PieChart>
          </ResponsiveContainer>
        ) : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>No assignments yet</div>}
      </div>
    ),

    alerts: () => (
      <div className="card">
        <div className="label" style={{ marginBottom: 14 }}>Recent alerts</div>
        {a.length === 0 && <div style={{ fontSize: 13, color: '#9CA3AF', padding: '20px 0', textAlign: 'center' }}>No alerts — all clear.</div>}
        {a.slice(0, 4).map(al => {
          const t = tier[al.tier] || tier.info
          return (
            <div key={al.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <t.Icon size={15} color={t.color} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#111827', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{al.message}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {String(al.tier || '').toUpperCase()} · {new Date(al.created_at).toLocaleDateString()}
                  {!al.acknowledged && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#DC2626' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} /> Unread
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    ),
  }

  // Half-width widgets pair up side by side; the rest are full width
  const HALF = ['trend', 'cert_chart', 'attendance_chart', 'alerts']
  const ordered = widgets.filter(w => w.visible)
  const rows = []
  for (let i = 0; i < ordered.length; i++) {
    const w = ordered[i]
    const next = ordered[i + 1]
    if (HALF.includes(w.id) && next && HALF.includes(next.id)) { rows.push([w.id, next.id]); i++ }
    else rows.push([w.id])
  }

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes ros-spin { to { transform: rotate(360deg) } } .spin { animation: ros-spin 0.8s linear infinite }`}</style>

      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        action={isAdmin && (
          <button className="btn btn-ghost" onClick={() => setShowCustomize(true)}>
            <Settings size={14} strokeWidth={2} /> Customize
          </button>
        )}
      />

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
                <div key={w.id} draggable
                  onDragStart={() => setDragging(w.id)}
                  onDragOver={e => { e.preventDefault(); setDragOver(w.id) }}
                  onDrop={() => handleDrop(w.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${dragOver === w.id ? '#7C3AED' : '#E5E7EB'}`, background: dragOver === w.id ? '#F5F3FF' : '#fff', cursor: 'grab', opacity: w.visible ? 1 : 0.5 }}>
                  <GripVertical size={16} color="#9CA3AF" />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#111827' }}>{w.label}</span>
                  <button onClick={() => toggleWidget(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: w.visible ? '#7C3AED' : '#9CA3AF', padding: 4 }}>
                    {w.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <button onClick={() => setWidgets(DEFAULT_WIDGETS)} className="btn btn-ghost" style={{ fontSize: 12 }}>Reset to default</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowCustomize(false)} className="btn btn-ghost">Cancel</button>
                <button onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Save layout'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rows.map(row => (
        <div key={row.join('-')} className={row.length === 2 ? 'charts-row' : undefined}
          style={{ display: 'grid', gridTemplateColumns: row.length === 2 ? '1fr 1fr' : '1fr', gap: 16 }}>
          {row.map(id => <div key={id} style={{ minWidth: 0 }}>{W[id]()}</div>)}
        </div>
      ))}
    </div>
  )
}