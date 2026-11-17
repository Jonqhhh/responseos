import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import {
  todayStr, daysBetween, formatTime, prettyDate, DEFAULT_TIME,
  autoRenewalDate, scheduledRenewalKeys, buildRenewalGroups,
  createAssignment, scheduleRenewal, undoAssignments, notifyAssignment
} from '../lib/training'
import {
  CalendarPlus, CalendarCheck, X, ChevronDown, ChevronUp, Calendar, Clock, MapPin, User, Users,
  CheckCircle2, XCircle, AlertTriangle, Flame, Biohazard, Anchor, HeartPulse, ShieldAlert, Search,
  SlidersHorizontal, RefreshCw, Undo2, Loader2, Mail
} from 'lucide-react'

const SUPER_EMAILS = ['jlane@responseos.net', 'hseals@responseos.net']

const CATEGORIES = [
  { id: 'fire',    label: 'Fire',    Icon: Flame,      topics: ['Fire Extinguisher Operations', 'SCBA Operations', 'Foam Operations', 'Defensive Fire Attack', 'Fire Behavior', 'Fire Drills', 'Wildland Fire', 'Other'] },
  { id: 'hazmat',  label: 'Hazmat',  Icon: Biohazard,  topics: ['ERG Reference', 'Air Monitoring', 'Decontamination', 'Spill Control', 'Chemical Identification', 'PPE Selection', 'Incident Command', 'Other'] },
  { id: 'rescue',  label: 'Rescue',  Icon: Anchor,     topics: ['High-Angle Rescue', 'Confined Space Entry', 'Rope Systems', 'Vehicle Extrication', 'Water Rescue', 'Trench Rescue', 'Structural Collapse', 'Other'] },
  { id: 'medical', label: 'Medical', Icon: HeartPulse, topics: ['CPR/AED', 'First Aid', 'Trauma Scenarios', 'Patient Assessment', 'Hemorrhage Control', 'EMS Operations', 'Mass Casualty', 'Other'] },
]

const STATE = {
  upcoming:  { label: 'Upcoming',  color: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE' },
  overdue:   { label: 'Past due',  color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  completed: { label: 'Completed', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
  cancelled: { label: 'Cancelled', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
}
const MEMBER_STATE = {
  pending:   { label: 'Pending',  color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
  completed: { label: 'Attended', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
  missed:    { label: 'Missed',   color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
}

const EMPTY_FORM = {
  title: '', category: 'fire', topic: '', description: '',
  scheduled_date: '', start_time: '', end_time: '', location: '',
  instructor_id: '', related_cert_name: '', members: []
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(String(str).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
function calcHours(start, end) {
  if (!start || !end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const hrs = ((eh * 60 + em) - (sh * 60 + sm)) / 60
  return hrs > 0 ? Math.round(hrs * 100) / 100 : null
}
function stateOf(a) {
  if (a.status === 'completed') return 'completed'
  if (a.status === 'cancelled') return 'cancelled'
  if (a.scheduled_date < todayStr()) return 'overdue'
  return 'upcoming'
}
function initials(name) {
  return (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
function roleOf(p) { return String(p?.role || '').toLowerCase() }
function isManagerProfile(p) {
  return ['admin', 'supervisor'].includes(roleOf(p)) || SUPER_EMAILS.includes(String(p?.email || '').toLowerCase())
}
function emailNote(r) {
  if (r.emailError) return ' · email failed'
  return r.emailed ? ` · ${r.emailed} email${r.emailed !== 1 ? 's' : ''} sent` : ''
}

function Pill({ cfg }) {
  return (
    <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  )
}

function CategoryChips({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {CATEGORIES.map(c => {
        const on = value === c.id
        return (
          <button key={c.id} type="button" onClick={() => onChange(c.id)} style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${on ? '#7C3AED' : '#E5E7EB'}`, background: on ? '#F5F3FF' : '#fff', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter, sans-serif' }}>
            <c.Icon size={15} color={on ? '#7C3AED' : '#6B7280'} strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 600, color: on ? '#7C3AED' : '#374151' }}>{c.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function Tasks() {
  const [user, setUser] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [users, setUsers] = useState([])
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [filter, setFilter] = useState('upcoming')
  const [expandedId, setExpandedId] = useState(null)
  const [acting, setActing] = useState(null)

  // One-click renewals
  const [scheduling, setScheduling] = useState(null)  // group key | 'all' | 'undo'
  const [banner, setBanner] = useState(null)          // { text, ids, error }

  // Manual schedule form
  const [showForm, setShowForm] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [memberSearch, setMemberSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const isManager = isManagerProfile(user)
  const canViewAll = isManager || roleOf(user) === 'auditor'

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setLoading(false); return }
    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    setUser(profile)
    const isDemo = profile?.is_demo === true
    const manager = isManagerProfile(profile)
    const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]

    const [aRes, uRes, cRes] = await Promise.all([
      supabase.from('training_assignments')
        .select('*, instructor:users!training_assignments_instructor_id_fkey(full_name), training_assignment_members(*, user:users!training_assignment_members_user_id_fkey(id, full_name, email))')
        .eq('is_demo', isDemo)
        .order('scheduled_date', { ascending: true }),
      supabase.from('users').select('id, full_name, department').eq('is_demo', isDemo).eq('is_active', true).order('full_name'),
      manager
        ? supabase.from('certifications').select('id, cert_name, expiry_date, status, user_id, users(full_name)').eq('is_demo', isDemo).lte('expiry_date', in60).order('expiry_date', { ascending: true })
        : Promise.resolve({ data: [] }),
    ])

    if (aRes.error) setToast({ message: aRes.error.message, type: 'error', id: Date.now() })
    setAssignments(aRes.data || [])
    setUsers(uRes.data || [])
    setCerts(cRes.data || [])
    setLoading(false)
  }

  function showToast(message, type = 'success') { setToast({ message, type, id: Date.now() }) }
  function setF(field, value) { setForm(prev => ({ ...prev, [field]: value })) }
  function toggleMember(id) {
    setForm(prev => ({ ...prev, members: prev.members.includes(id) ? prev.members.filter(m => m !== id) : [...prev.members, id] }))
  }

  async function logAudit(action, record_id, after_state) {
    await supabase.from('audit_logs').insert({ actor_id: user?.id, action, table_name: 'training_assignments', record_id, after_state })
  }

  // ---- Renewal groups ----
  const keys = scheduledRenewalKeys(assignments)
  const renewalGroups = buildRenewalGroups(certs, keys)

  async function autoSchedule(groups, key) {
    setScheduling(key); setBanner(null)
    const done = []
    try {
      for (const g of groups) done.push(await scheduleRenewal(user, g))
      await loadAll()
      const emails = done.reduce((s, r) => s + (r.emailed || 0), 0)
      const failed = done.some(r => r.emailError)
      const text = done.length === 1
        ? `${done[0].cert} renewal set for ${prettyDate(done[0].date)} · ${formatTime(DEFAULT_TIME)} — ${done[0].people} assigned${emailNote(done[0])}`
        : `${done.length} renewal sessions scheduled${emails ? ` · ${emails} emails sent` : ''}${failed ? ' · some emails failed' : ''}`
      setBanner({ text, ids: done.map(d => d.created.id) })
      if (done.length === 1) { setFilter('upcoming'); setExpandedId(done[0].created.id) }
    } catch (err) {
      if (done.length) await loadAll()
      setBanner({ text: err.message, ids: done.map(d => d.created.id), error: true })
    }
    setScheduling(null)
  }

  async function undoBanner() {
    if (!banner?.ids?.length) { setBanner(null); return }
    setScheduling('undo')
    try {
      await undoAssignments(banner.ids)
      showToast('Undone — cancellation emails sent.', 'error')
    } catch (err) {
      showToast(err.message, 'error')
    }
    setBanner(null)
    await loadAll()
    setScheduling(null)
  }

  // ---- Manual schedule form ----
  function openForm() {
    setForm(EMPTY_FORM)
    setShowMore(false)
    setMemberSearch('')
    setShowForm(true)
  }

  async function handleSchedule() {
    if (!form.title.trim() || !form.scheduled_date) { showToast('Add a title and a date.', 'error'); return }
    if (form.members.length === 0) { showToast('Assign at least one employee.', 'error'); return }
    setSaving(true)
    try {
      const r = await createAssignment(user, {
        title: form.title.trim(), category: form.category, topic: form.topic || null,
        description: form.description || null, scheduled_date: form.scheduled_date,
        start_time: form.start_time || null, end_time: form.end_time || null,
        location: form.location || null, instructor_id: form.instructor_id || null,
        related_cert_name: form.related_cert_name.trim() || null,
      }, form.members)
      setShowForm(false)
      setForm(EMPTY_FORM)
      await loadAll()
      setFilter('upcoming')
      setExpandedId(r.created.id)
      showToast(`Scheduled for ${r.people} employee${r.people !== 1 ? 's' : ''}${emailNote(r)}.`, r.emailError ? 'error' : 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
    setSaving(false)
  }

  // ---- Per-employee completion ----
  async function markMember(member, status) {
    setActing(member.id)
    const { error } = await supabase.from('training_assignment_members').update({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      completed_by: status === 'pending' ? null : user?.id,
    }).eq('id', member.id)
    if (error) showToast(error.message, 'error')
    await loadAll()
    setActing(null)
  }

  // ---- Finalize ----
  async function finalize(a) {
    const members = a.training_assignment_members || []
    const attended = members.filter(m => m.status === 'completed')
    const pending = members.filter(m => m.status === 'pending')
    if (!window.confirm(`Finalize this session?\n\n${attended.length} attended will be logged to Training.\n${pending.length} still pending will be marked missed.`)) return

    setActing(a.id)
    if (pending.length) {
      await supabase.from('training_assignment_members')
        .update({ status: 'missed', completed_by: user?.id })
        .in('id', pending.map(m => m.id))
    }
    await supabase.from('training_assignments').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', a.id)

    if (attended.length) {
      await supabase.from('training_sessions').insert({
        logged_by: user?.id, instructor_id: a.instructor_id || null,
        title: a.title, category: a.category, topic: a.topic || 'Other',
        training_date: a.scheduled_date, start_time: a.start_time || null, end_time: a.end_time || null,
        duration_hours: calcHours(a.start_time, a.end_time),
        location: a.location || null, notes: a.description || null,
        participants: attended.map(m => m.user_id), is_demo: user?.is_demo === true
      })
    }

    await logAudit('training_completed', a.id, { title: a.title, attended: attended.length, missed: pending.length + members.filter(m => m.status === 'missed').length })
    await loadAll()
    setActing(null)
    showToast(`Session finalized — ${attended.length} attendance record${attended.length !== 1 ? 's' : ''} logged.`)
  }

  async function cancelAssignment(a) {
    if (!window.confirm('Cancel this training? Assigned employees will get a cancellation email.')) return
    setActing(a.id)
    await supabase.from('training_assignments').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', a.id)
    await logAudit('training_cancelled', a.id, { title: a.title })
    const mail = await notifyAssignment(a.id, 'cancelled')
    await loadAll()
    setActing(null)
    showToast(`Training cancelled${mail.sent ? ` · ${mail.sent} email${mail.sent !== 1 ? 's' : ''} sent` : ''}.`, 'error')
  }

  // ---- Derived ----
  const today = todayStr()
  const counts = {
    upcoming:  assignments.filter(a => stateOf(a) === 'upcoming').length,
    week:      assignments.filter(a => stateOf(a) === 'upcoming' && daysBetween(a.scheduled_date) <= 7).length,
    overdue:   assignments.filter(a => stateOf(a) === 'overdue').length,
    completed: assignments.filter(a => stateOf(a) === 'completed').length,
  }
  const visible = assignments
    .filter(a => filter === 'all' ? true : stateOf(a) === filter)
    .sort((x, y) => filter === 'completed' ? y.scheduled_date.localeCompare(x.scheduled_date) : x.scheduled_date.localeCompare(y.scheduled_date))

  const formCat = CATEGORIES.find(c => c.id === form.category)
  const filteredUsers = users.filter(u => u.full_name?.toLowerCase().includes(memberSearch.toLowerCase()))
  const allCertNames = [...new Set(certs.map(c => c.cert_name).filter(Boolean))]
  const busy = !!scheduling

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#111827', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 5, display: 'block' }
  const smallBtn = { padding: '5px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 4 }
  const overlay = { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes ros-spin { to { transform: rotate(360deg) } } .spin { animation: ros-spin 0.8s linear infinite }`}</style>

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Training Assignments"
        subtitle={isManager ? 'Schedule training, assign employees, and document completion.' : 'Your scheduled training sessions.'}
        action={isManager && (
          <button className="btn btn-primary" onClick={openForm}>
            <CalendarPlus size={15} strokeWidth={2} /> Schedule training
          </button>
        )}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Upcoming',    value: counts.upcoming },
          { label: 'Next 7 days', value: counts.week },
          { label: 'Past due',    value: counts.overdue, alert: counts.overdue > 0 },
          { label: 'Completed',   value: counts.completed },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderTop: `3px solid ${s.alert ? '#DC2626' : '#7C3AED'}` }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.alert ? '#B91C1C' : '#111827', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Banner */}
      {isManager && banner && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: banner.error ? '#FEF2F2' : '#F5F3FF', border: `1px solid ${banner.error ? '#FECACA' : '#DDD6FE'}`, color: banner.error ? '#B91C1C' : '#5B21B6' }}>
          {banner.error ? <AlertTriangle size={16} /> : <Mail size={16} />}
          <span style={{ flex: 1, minWidth: 0 }}>{banner.text}</span>
          {banner.ids?.length > 0 && (
            <button onClick={undoBanner} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#6B7280', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              {scheduling === 'undo' ? <Loader2 size={13} className="spin" /> : <Undo2 size={13} />} Undo
            </button>
          )}
          <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={14} /></button>
        </div>
      )}

      {/* Certifications needing renewal — one click */}
      {isManager && renewalGroups.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <ShieldAlert size={16} color="#7C3AED" strokeWidth={2} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Certifications needing renewal</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>Click ✓ to schedule — date is picked automatically and everyone is emailed</div>
            </div>
            {renewalGroups.length > 1 && (
              <button className="btn btn-ghost" disabled={busy} onClick={() => autoSchedule(renewalGroups, 'all')} style={{ fontSize: 12, opacity: busy ? 0.6 : 1 }}>
                {scheduling === 'all' ? <Loader2 size={13} className="spin" /> : <CalendarCheck size={13} />} Schedule all ({renewalGroups.length})
              </button>
            )}
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {renewalGroups.map(g => {
              const names = [...new Set(g.certs.map(c => c.users?.full_name || 'Unassigned'))]
              const urgent = g.soonest <= 7
              const working = scheduling === g.key
              const autoDate = autoRenewalDate(g.soonest)
              return (
                <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid #F9FAFB' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: '#F3F4F6', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw size={15} color="#4B5563" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                      {g.cert_name} <span style={{ fontWeight: 500, color: '#6B7280' }}>· {names.join(', ')}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                      Will schedule {prettyDate(autoDate)} · {formatTime(DEFAULT_TIME)}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: urgent ? '#B91C1C' : '#374151', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
                    {g.soonest < 0 ? `${Math.abs(g.soonest)}d overdue` : `${g.soonest}d left`}
                  </span>
                  <button onClick={() => autoSchedule([g], g.key)} disabled={busy} title={`Schedule for ${prettyDate(autoDate)} and email ${names.length === 1 ? names[0] : `${names.length} people`}`}
                    style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, border: '1px solid #DDD6FE', background: '#F5F3FF', cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy && !working ? 0.5 : 1 }}>
                    {working ? <Loader2 size={15} color="#7C3AED" className="spin" /> : <CalendarCheck size={15} color="#7C3AED" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#F9FAFB', borderRadius: 10, padding: 4, border: '1px solid #E5E7EB', width: 'fit-content', flexWrap: 'wrap' }}>
        {[
          { id: 'upcoming',  label: `Upcoming (${counts.upcoming})` },
          { id: 'overdue',   label: `Past due (${counts.overdue})` },
          { id: 'completed', label: `Completed (${counts.completed})` },
          { id: 'all',       label: 'All' },
        ].map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            background: filter === t.id ? '#fff' : 'transparent',
            color: filter === t.id ? '#7C3AED' : '#6B7280',
            boxShadow: filter === t.id ? '0 1px 4px rgba(139,92,246,0.12)' : 'none'
          }}>{t.label}</button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>Loading...</div>
      ) : visible.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Calendar size={40} color="#DDD6FE" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>No {filter === 'all' ? '' : STATE[filter]?.label.toLowerCase()} training</div>
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>{isManager ? 'Click Schedule training to plan a session.' : 'Assigned training will show up here.'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(a => {
            const st = stateOf(a)
            const cat = CATEGORIES.find(c => c.id === a.category) || CATEGORIES[0]
            const members = a.training_assignment_members || []
            const done = members.filter(m => m.status === 'completed').length
            const expanded = expandedId === a.id
            const open = st === 'upcoming' || st === 'overdue'
            const days = daysBetween(a.scheduled_date)
            const mine = members.find(m => m.user_id === user?.id)
            const assignedNames = members.map(m => m.user?.full_name).filter(Boolean)

            return (
              <div key={a.id} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `4px solid ${STATE[st].color}`, opacity: st === 'cancelled' ? 0.6 : 1 }}>
                <div onClick={() => setExpandedId(expanded ? null : a.id)} style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: '#F3F4F6', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <cat.Icon size={18} color="#4B5563" strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{a.title}</span>
                      <Pill cfg={STATE[st]} />
                      {a.related_cert_name && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280', fontWeight: 600 }}>
                          <RefreshCw size={11} /> Renews {a.related_cert_name}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {formatDate(a.scheduled_date)}{open && days >= 0 && days <= 7 ? ` · ${days === 0 ? 'today' : `in ${days}d`}` : ''}</span>
                      {a.start_time && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {formatTime(a.start_time)}{a.end_time ? `–${formatTime(a.end_time)}` : ''}</span>}
                      {a.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {a.location}</span>}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Users size={12} />
                        {canViewAll
                          ? (assignedNames.length <= 2 && assignedNames.length > 0 ? assignedNames.join(', ') : `${done}/${members.length} attended`)
                          : (mine ? MEMBER_STATE[mine.status].label : '—')}
                      </span>
                    </div>
                  </div>
                  {expanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
                </div>

                {expanded && (
                  <div style={{ padding: '0 18px 16px', borderTop: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingTop: 14 }}>
                      {[
                        { label: 'Category',   value: cat.label },
                        { label: 'Topic',      value: a.topic || '—' },
                        { label: 'Instructor', value: a.instructor?.full_name || '—' },
                      ].map(r => (
                        <div key={r.label}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{r.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{r.value}</div>
                        </div>
                      ))}
                    </div>

                    {a.description && (
                      <div style={{ marginTop: 12, fontSize: 13, color: '#374151', lineHeight: 1.6, background: '#F9FAFB', padding: '10px 12px', borderRadius: 8 }}>{a.description}</div>
                    )}

                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                        {canViewAll ? `Assigned employees (${members.length})` : 'Your status'}
                      </div>
                      {members.length === 0 ? (
                        <div style={{ fontSize: 13, color: '#9CA3AF', padding: '10px 12px', border: '1px dashed #E5E7EB', borderRadius: 10 }}>No one assigned.</div>
                      ) : (
                        <div style={{ border: '1px solid #F3F4F6', borderRadius: 10, overflow: 'hidden' }}>
                          {members.map((m, i) => (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: i < members.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                              <div style={{ width: 28, height: 28, borderRadius: 7, background: '#F3F4F6', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                                {initials(m.user?.full_name)}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{m.user?.full_name || 'Employee'}</div>
                                {m.notified_at && <div style={{ fontSize: 11, color: '#9CA3AF', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Mail size={10} /> Emailed {new Date(m.notified_at).toLocaleDateString()}</div>}
                              </div>
                              <Pill cfg={MEMBER_STATE[m.status] || MEMBER_STATE.pending} />
                              {isManager && open && (
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button disabled={acting === m.id} onClick={() => markMember(m, m.status === 'completed' ? 'pending' : 'completed')} style={{ ...smallBtn, opacity: acting === m.id ? 0.5 : 1 }}>
                                    <CheckCircle2 size={12} /> {m.status === 'completed' ? 'Undo' : 'Attended'}
                                  </button>
                                  <button disabled={acting === m.id} onClick={() => markMember(m, m.status === 'missed' ? 'pending' : 'missed')} style={{ ...smallBtn, opacity: acting === m.id ? 0.5 : 1 }}>
                                    <XCircle size={12} /> {m.status === 'missed' ? 'Undo' : 'Missed'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {isManager && open && (
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost" disabled={acting === a.id} onClick={() => cancelAssignment(a)}>Cancel session</button>
                        <button className="btn btn-primary" disabled={acting === a.id} onClick={() => finalize(a)} style={{ opacity: acting === a.id ? 0.6 : 1 }}>
                          <CheckCircle2 size={14} /> Finalize session
                        </button>
                      </div>
                    )}

                    {st === 'overdue' && isManager && (
                      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#B91C1C', fontWeight: 600 }}>
                        <AlertTriangle size={14} /> This session date has passed — record attendance and finalize it.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ---------- Manual schedule form ---------- */}
      {showForm && (
        <div style={overlay} onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Schedule training</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Assigned employees and you will get an email</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
            </div>

            <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input value={form.title} onChange={e => setF('title', e.target.value)} placeholder="e.g. Monthly SCBA drill" style={inputStyle} autoFocus />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Date *</label><input type="date" min={today} value={form.scheduled_date} onChange={e => setF('scheduled_date', e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Start time</label><input type="time" value={form.start_time} onChange={e => setF('start_time', e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Location</label><input value={form.location} onChange={e => setF('location', e.target.value)} placeholder="Training Bay" style={inputStyle} /></div>
              </div>

              <div>
                <label style={labelStyle}>Category</label>
                <CategoryChips value={form.category} onChange={v => setForm(prev => ({ ...prev, category: v, topic: '' }))} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Assign employees * ({form.members.length} selected)</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setF('members', users.map(u => u.id))} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Select all</button>
                    <button type="button" onClick={() => setF('members', [])} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Clear</button>
                  </div>
                </div>
                {users.length > 9 && (
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                    <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search employees..." style={{ ...inputStyle, paddingLeft: 30 }} />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxHeight: 180, overflowY: 'auto', padding: 2 }}>
                  {filteredUsers.map(u => {
                    const on = form.members.includes(u.id)
                    return (
                      <div key={u.id} onClick={() => toggleMember(u.id)} style={{ padding: '7px 10px', borderRadius: 7, cursor: 'pointer', userSelect: 'none', border: `1.5px solid ${on ? '#7C3AED' : '#E5E7EB'}`, background: on ? '#F5F3FF' : '#fff', fontSize: 12, fontWeight: 500, color: on ? '#5B21B6' : '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={12} color={on ? '#7C3AED' : '#9CA3AF'} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button type="button" onClick={() => setShowMore(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', background: 'none', border: 'none', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', padding: 0 }}>
                <SlidersHorizontal size={14} /> More options {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showMore && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Topic</label>
                      <select value={form.topic} onChange={e => setF('topic', e.target.value)} style={inputStyle}>
                        <option value="">Select topic...</option>
                        {formCat?.topics.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>End time</label>
                      <input type="time" value={form.end_time} onChange={e => setF('end_time', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Instructor</label>
                      <select value={form.instructor_id} onChange={e => setF('instructor_id', e.target.value)} style={inputStyle}>
                        <option value="">Select instructor...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Renews certification</label>
                      <input list="cert-names" value={form.related_cert_name} onChange={e => setF('related_cert_name', e.target.value)} placeholder="None" style={inputStyle} />
                      <datalist id="cert-names">
                        {allCertNames.map(n => <option key={n} value={n} />)}
                      </datalist>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Notes / objectives</label>
                    <textarea rows={2} value={form.description} onChange={e => setF('description', e.target.value)} placeholder="What to bring, objectives, prerequisites..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSchedule} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Scheduling...' : `Schedule & email ${form.members.length || 0} →`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}