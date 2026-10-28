import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import {
  ClipboardList, Plus, X, ChevronDown, ChevronUp, Clock, Award, Target, AlertTriangle,
  Flame, Biohazard, Anchor, HeartPulse, MapPin, Users, FileDown
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Neutral palette — status colors only where they carry meaning
const N = { text: '#111827', sub: '#6B7280', muted: '#9CA3AF', border: '#E5E7EB', soft: '#F9FAFB', iconBg: '#F3F4F6', icon: '#4B5563', accent: '#7C3AED', accentBg: '#F5F3FF', accentBorder: '#DDD6FE' }
const STATUS = {
  good:   { color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
  behind: { color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
}

const CATEGORIES = [
  { id: 'fire',    label: 'Fire',    Icon: Flame,
    topics: ['Fire Extinguisher Operations', 'SCBA Operations', 'Foam Operations', 'Defensive Fire Attack', 'Fire Behavior', 'Fire Drills', 'Wildland Fire', 'Other'] },
  { id: 'hazmat',  label: 'Hazmat',  Icon: Biohazard,
    topics: ['ERG Reference', 'Air Monitoring', 'Decontamination', 'Spill Control', 'Chemical Identification', 'PPE Selection', 'Incident Command', 'Other'] },
  { id: 'rescue',  label: 'Rescue',  Icon: Anchor,
    topics: ['High-Angle Rescue', 'Confined Space Entry', 'Rope Systems', 'Vehicle Extrication', 'Water Rescue', 'Trench Rescue', 'Structural Collapse', 'Other'] },
  { id: 'medical', label: 'Medical', Icon: HeartPulse,
    topics: ['CPR/AED', 'First Aid', 'Trauma Scenarios', 'Patient Assessment', 'Hemorrhage Control', 'EMS Operations', 'Mass Casualty', 'Other'] },
]

function formatDate(str) {
  if (!str) return '—'
  return new Date(str + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function calcHours(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60)
}

function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const color = pct >= 80 ? STATUS.good.color : pct < 50 ? STATUS.behind.color : N.accent
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: N.text, fontWeight: 700 }}>{value.toFixed(1)}h / {max}h</span>
        <span style={{ color, fontWeight: 700 }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ background: N.iconBg, borderRadius: 99, height: 6 }}>
        <div style={{ width: `${pct}%`, height: 6, borderRadius: 99, background: color, transition: 'width .4s ease' }} />
      </div>
    </div>
  )
}

function CatIcon({ cat, size = 16, active = false, box = 32 }) {
  return (
    <div style={{ width: box, height: box, borderRadius: 8, flexShrink: 0, background: active ? N.accentBg : N.iconBg, border: `1px solid ${active ? N.accentBorder : N.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <cat.Icon size={size} color={active ? N.accent : N.icon} strokeWidth={2} />
    </div>
  )
}

export default function TrainingTracker() {
  const [sessions, setSessions] = useState([])
  const [users, setUsers] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [user, setUser] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFrom, setExportFrom] = useState('')
  const [exportTo, setExportTo] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingGoals, setSavingGoals] = useState(false)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [activeTab, setActiveTab] = useState('sessions')

  const [form, setForm] = useState({
    title: '', category: 'fire', topic: '',
    training_date: new Date().toISOString().split('T')[0],
    start_time: '', end_time: '', duration_hours: '',
    location: '', notes: '', is_quarterly: false,
    third_party_provider: '', instructor_id: '', participants: [],
  })

  const [goalForm, setGoalForm] = useState({
    fire:    { daily_hours: 1, quarterly_hours: 8 },
    hazmat:  { daily_hours: 1, quarterly_hours: 8 },
    rescue:  { daily_hours: 1, quarterly_hours: 8 },
    medical: { daily_hours: 1, quarterly_hours: 8 },
  })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(profile)
      const isDemo = profile?.is_demo === true
      const [sessRes, usersRes, goalsRes] = await Promise.all([
        supabase.from('training_sessions')
          .select('*, users!training_sessions_logged_by_fkey(full_name), instructor:users!training_sessions_instructor_id_fkey(full_name)')
          .eq('is_demo', isDemo).order('training_date', { ascending: false }),
        supabase.from('users').select('id, full_name').eq('is_demo', isDemo).eq('is_active', true).order('full_name'),
        supabase.from('training_goals').select('*').eq('is_demo', isDemo),
      ])
      setSessions(sessRes.data || [])
      setUsers(usersRes.data || [])
      const goalsData = goalsRes.data || []
      setGoals(goalsData)
      if (goalsData.length > 0) {
        const gf = { ...goalForm }
        goalsData.forEach(g => { if (gf[g.category]) gf[g.category] = { daily_hours: g.daily_hours, quarterly_hours: g.quarterly_hours } })
        setGoalForm(gf)
      }
    }
    setLoading(false)
  }

  function showToast(message, type = 'success') { setToast({ message, type, id: Date.now() }) }

  function setF(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'start_time' || field === 'end_time') {
        const hrs = calcHours(field === 'start_time' ? value : prev.start_time, field === 'end_time' ? value : prev.end_time)
        if (hrs > 0) next.duration_hours = hrs.toFixed(2)
      }
      if (field === 'category') next.topic = ''
      return next
    })
  }

  function toggleParticipant(id) {
    setForm(prev => ({ ...prev, participants: prev.participants.includes(id) ? prev.participants.filter(p => p !== id) : [...prev.participants, id] }))
  }

  async function handleSubmit() {
    if (!form.title || !form.category || !form.topic || !form.training_date) { showToast('Please fill in title, category, topic, and date.', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('training_sessions').insert({
      logged_by: user?.id, instructor_id: form.instructor_id || null,
      title: form.title, category: form.category, topic: form.topic,
      training_date: form.training_date, start_time: form.start_time || null, end_time: form.end_time || null,
      duration_hours: form.duration_hours ? parseFloat(form.duration_hours) : null,
      location: form.location || null, notes: form.notes || null,
      is_quarterly: form.is_quarterly, third_party_provider: form.third_party_provider || null,
      participants: form.participants, is_demo: user?.is_demo === true
    })
    if (error) { showToast(error.message, 'error'); setSaving(false); return }
    setSaving(false); setShowNew(false)
    setForm({ title: '', category: 'fire', topic: '', training_date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', duration_hours: '', location: '', notes: '', is_quarterly: false, third_party_provider: '', instructor_id: '', participants: [] })
    await loadAll(); showToast('Training session logged successfully.')
  }

  async function handleSaveGoals() {
    setSavingGoals(true)
    for (const cat of CATEGORIES) {
      const g = goalForm[cat.id]
      const existing = goals.find(goal => goal.category === cat.id)
      if (existing) {
        await supabase.from('training_goals').update({ daily_hours: parseFloat(g.daily_hours), quarterly_hours: parseFloat(g.quarterly_hours) }).eq('id', existing.id)
      } else {
        await supabase.from('training_goals').insert({ category: cat.id, daily_hours: parseFloat(g.daily_hours), quarterly_hours: parseFloat(g.quarterly_hours), is_demo: user?.is_demo === true })
      }
    }
    await loadAll(); setSavingGoals(false); setShowGoals(false); showToast('Training goals updated.')
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this training session?')) return
    setDeleting(id)
    await supabase.from('training_sessions').delete().eq('id', id)
    await loadAll(); setDeleting(null); showToast('Training session deleted.', 'error')
  }

  // Stats
  const now = new Date()
  const inMonth = s => { const d = new Date(s.training_date + 'T00:00:00'); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }
  const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  const inQuarter = s => new Date(s.training_date + 'T00:00:00') >= qStart
  const hrs = list => list.reduce((sum, s) => sum + (parseFloat(s.duration_hours) || 0), 0)

  const totalHours = hrs(sessions)
  const monthHours = hrs(sessions.filter(inMonth))
  const quarterHours = hrs(sessions.filter(inQuarter))

  const catStats = CATEGORIES.map(cat => {
    const catSess = sessions.filter(s => s.category === cat.id)
    const goal = goals.find(g => g.category === cat.id)
    const dailyGoal = parseFloat(goal?.daily_hours || 1)
    const quarterlyGoal = parseFloat(goal?.quarterly_hours || 8)
    const monthGoal = dailyGoal * new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const monthHrs = hrs(catSess.filter(inMonth))
    const qHrs = hrs(catSess.filter(inQuarter))
    return { ...cat, catHours: hrs(catSess), monthHrs, qHrs, monthGoal, quarterlyGoal, monthBehind: monthHrs < monthGoal * 0.5, qBehind: qHrs < quarterlyGoal * 0.5, sessCount: catSess.length }
  })

  const behindCount = catStats.filter(c => c.monthBehind || c.qBehind).length
  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.category === filter)
  const isAdmin = ['admin', 'supervisor'].includes(user?.role)
  const formCat = CATEGORIES.find(c => c.id === form.category)

  const exportFiltered = sessions.filter(s => {
    if (exportFrom && s.training_date < exportFrom) return false
    if (exportTo && s.training_date > exportTo) return false
    return true
  })
  const exportHours = hrs(exportFiltered)

  function exportSessionPDF(s) {
    const c = CATEGORIES.find(x => x.id === s.category) || CATEGORIES[0]
    const participantNames = (s.participants || []).map(pid => users.find(u => u.id === pid)?.full_name || '').filter(Boolean)
    const doc = new jsPDF()
    const sessionId = s.id?.slice(0, 8).toUpperCase() || 'N/A'
    doc.setFillColor(124, 58, 237); doc.rect(0, 0, 220, 32, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('ResponseOS — Training Record', 14, 12)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Session ID: ROS-${sessionId}`, 14, 20)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 14, 27)
    doc.setTextColor(0, 0, 0); doc.setFontSize(18); doc.setFont('helvetica', 'bold')
    doc.text(s.title, 14, 46)
    doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
    doc.text(`${c.label} Training${s.is_quarterly ? '  ·  Quarterly Session' : ''}${s.third_party_provider ? `  ·  ${s.third_party_provider}` : ''}`, 14, 54)
    doc.setDrawColor(220, 214, 254); doc.setLineWidth(0.5); doc.line(14, 58, 196, 58)
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0)
    doc.text('Session Details', 14, 68)
    autoTable(doc, {
      startY: 72, head: [],
      body: [
        ['Training Date', formatDate(s.training_date), 'Category', c.label],
        ['Start Time', s.start_time || '—', 'End Time', s.end_time || '—'],
        ['Duration', s.duration_hours ? `${parseFloat(s.duration_hours).toFixed(1)} hours` : '—', 'Location', s.location || '—'],
        ['Instructor', s.instructor?.full_name || '—', 'Logged By', s.users?.full_name || '—'],
        ['Topic', s.topic || '—', 'Type', s.is_quarterly ? 'Quarterly' : 'Daily'],
      ],
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 36, fillColor: [245, 243, 255], textColor: [91, 33, 182] }, 1: { cellWidth: 58 }, 2: { fontStyle: 'bold', cellWidth: 36, fillColor: [245, 243, 255], textColor: [91, 33, 182] }, 3: { cellWidth: 58 } },
      bodyStyles: { fontSize: 10, cellPadding: 5 }, theme: 'grid', tableLineColor: [221, 214, 254], tableLineWidth: 0.3,
    })
    const y2 = doc.lastAutoTable.finalY + 12
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0)
    doc.text(`Participants (${participantNames.length})`, 14, y2)
    if (participantNames.length > 0) {
      autoTable(doc, { startY: y2 + 4, head: [['#', 'Name', 'Attended']], body: participantNames.map((name, i) => [i + 1, name, 'Yes']), headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', fontSize: 10 }, bodyStyles: { fontSize: 10 }, alternateRowStyles: { fillColor: [245, 243, 255] }, columnStyles: { 0: { cellWidth: 14 }, 2: { cellWidth: 24, halign: 'center' } } })
    } else {
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150)
      doc.text('No participants recorded.', 14, y2 + 10)
    }
    if (s.notes) {
      const y3 = (participantNames.length > 0 ? doc.lastAutoTable.finalY : y2 + 16) + 12
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); doc.text('Notes', 14, y3)
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 65, 81)
      doc.text(doc.splitTextToSize(s.notes, 172), 14, y3 + 8)
    }
    const sigY = Math.min(doc.internal.pageSize.height - 50, 240)
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.4)
    doc.line(14, sigY, 90, sigY); doc.line(110, sigY, 186, sigY)
    doc.setFontSize(9); doc.setTextColor(150, 150, 150)
    doc.text('Instructor Signature', 14, sigY + 6); doc.text('Supervisor Signature', 110, sigY + 6)
    doc.text('Date: _______________', 14, sigY + 14); doc.text('Date: _______________', 110, sigY + 14)
    doc.setFontSize(8); doc.setTextColor(180, 180, 180)
    doc.text(`ResponseOS Training Record  ·  Session ID: ROS-${sessionId}  ·  responseos.net`, 14, doc.internal.pageSize.height - 8)
    doc.save(`training-record-${s.training_date}-${sessionId}.pdf`)
    showToast('Session record exported as PDF.')
  }

  function exportPDF(exportSessions = sessions) {
    const doc = new jsPDF()
    doc.setFillColor(124, 58, 237); doc.rect(0, 0, 220, 32, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('ResponseOS — Training Report', 14, 11)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 14, 20)
    doc.text(`Total: ${exportSessions.length} sessions · ${hrs(exportSessions).toFixed(1)}h${exportFrom || exportTo ? ` · ${exportFrom || 'start'} to ${exportTo || 'today'}` : ''}`, 14, 27)
    doc.setTextColor(0, 0, 0); doc.setFontSize(12); doc.setFont('helvetica', 'bold')
    doc.text('Category Summary', 14, 44)
    autoTable(doc, {
      startY: 48,
      head: [['Category', 'Sessions', 'Total Hours']],
      body: CATEGORIES.map(cat => { const s = exportSessions.filter(x => x.category === cat.id); return [cat.label, s.length.toString(), hrs(s).toFixed(1) + 'h'] }),
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', fontSize: 10 }, bodyStyles: { fontSize: 10 }, alternateRowStyles: { fillColor: [245, 243, 255] },
    })
    const y1 = doc.lastAutoTable.finalY + 12
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('Training Sessions', 14, y1)
    autoTable(doc, {
      startY: y1 + 4,
      head: [['Date', 'Title', 'Category', 'Topic', 'Hours', 'Instructor', 'Location', 'Q?']],
      body: exportSessions.map(s => { const c = CATEGORIES.find(x => x.id === s.category); return [formatDate(s.training_date), s.title, c?.label || s.category, s.topic, s.duration_hours ? parseFloat(s.duration_hours).toFixed(1) + 'h' : '—', s.instructor?.full_name || '—', s.location || '—', s.is_quarterly ? 'Yes' : 'No'] }),
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', fontSize: 9 }, bodyStyles: { fontSize: 8 }, alternateRowStyles: { fillColor: [245, 243, 255] }, columnStyles: { 1: { cellWidth: 35 }, 3: { cellWidth: 30 } }
    })
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150, 150, 150)
      doc.text(`ResponseOS Training Report · Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 8)
      doc.text('responseos.net', doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 8, { align: 'right' })
    }
    doc.save(`training-report-${new Date().toISOString().split('T')[0]}.pdf`)
    showToast('Training report exported as PDF.')
  }

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${N.border}`, background: '#fff', color: N.text, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color .12s' }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: N.sub, marginBottom: 5, display: 'block' }
  const focusOn = e => e.target.style.borderColor = N.accent
  const focusOff = e => e.target.style.borderColor = N.border
  const metaItem = { display: 'inline-flex', alignItems: 'center', gap: 4 }

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Training Tracker"
        subtitle="Log, track, and export daily and quarterly training sessions by category."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && (
              <button className="btn btn-ghost" onClick={() => setShowGoals(true)}>
                <Target size={14} strokeWidth={2} /> Set goals
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => setShowExportModal(true)} disabled={sessions.length === 0} style={{ opacity: sessions.length === 0 ? 0.5 : 1 }}>
              <FileDown size={14} strokeWidth={2} /> Export PDF
            </button>
            <button className="btn btn-primary" onClick={() => setShowNew(true)}>
              <Plus size={15} strokeWidth={2} /> Log session
            </button>
          </div>
        }
      />

      {/* Export modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: N.text }}>Export training report</div>
              <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: N.muted }}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>From date</label>
                <input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
              </div>
              <div>
                <label style={labelStyle}>To date</label>
                <input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
              </div>
              <div style={{ background: N.soft, border: `1px solid ${N.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: N.text, fontWeight: 600 }}>
                {exportFiltered.length} session{exportFiltered.length !== 1 ? 's' : ''} · {exportHours.toFixed(1)}h
                {(!exportFrom && !exportTo) && <span style={{ color: N.muted, fontWeight: 400 }}> (all time)</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => { setExportFrom(''); setExportTo('') }} style={{ background: 'none', border: 'none', color: N.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Clear dates</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" onClick={() => setShowExportModal(false)}>Cancel</button>
                  <button className="btn btn-primary" disabled={exportFiltered.length === 0} style={{ opacity: exportFiltered.length === 0 ? 0.5 : 1 }}
                    onClick={() => { exportPDF(exportFiltered); setShowExportModal(false) }}>
                    Export {exportFiltered.length} sessions →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {behindCount > 0 && (
        <div style={{ background: STATUS.behind.bg, border: `1px solid ${STATUS.behind.border}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color={STATUS.behind.color} strokeWidth={2} />
          <span style={{ fontSize: 13, fontWeight: 600, color: STATUS.behind.color }}>
            {behindCount} training {behindCount === 1 ? 'category is' : 'categories are'} behind goal — check the Progress tab.
          </span>
        </div>
      )}

      {/* Stats — one accent */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total sessions', value: sessions.length,                Icon: ClipboardList },
          { label: 'Total hours',    value: totalHours.toFixed(1) + 'h',    Icon: Clock },
          { label: 'This month',     value: monthHours.toFixed(1) + 'h',    Icon: Award },
          { label: 'This quarter',   value: quarterHours.toFixed(1) + 'h',  Icon: Target },
        ].map(s => (
          <div key={s.label} className="card">
            <div style={{ width: 36, height: 36, borderRadius: 9, background: N.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <s.Icon size={16} color={N.accent} strokeWidth={2} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: N.text, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: N.muted, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category cards — neutral, click to filter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {catStats.map(cat => {
          const on = filter === cat.id
          const behind = cat.monthBehind || cat.qBehind
          return (
            <div key={cat.id} className="card" onClick={() => { setActiveTab('sessions'); setFilter(on ? 'all' : cat.id) }}
              style={{ cursor: 'pointer', border: `1.5px solid ${on ? N.accent : N.border}`, boxShadow: on ? '0 2px 10px rgba(124,58,237,0.12)' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <CatIcon cat={cat} active={on} />
                <span style={{ fontSize: 14, fontWeight: 700, color: N.text, flex: 1 }}>{cat.label}</span>
                {behind && <AlertTriangle size={14} color={STATUS.behind.color} />}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: N.text }}>{cat.catHours.toFixed(1)}h</div>
              <div style={{ fontSize: 12, color: N.muted, marginTop: 2 }}>{cat.sessCount} sessions</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 4, background: N.soft, borderRadius: 10, padding: 4, border: `1px solid ${N.border}`, width: 'fit-content' }}>
        {[{ id: 'sessions', label: 'Sessions' }, { id: 'progress', label: `Progress${behindCount > 0 ? ` (${behindCount} behind)` : ''}` }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            background: activeTab === t.id ? '#fff' : 'transparent',
            color: activeTab === t.id ? N.accent : N.sub,
            boxShadow: activeTab === t.id ? '0 1px 4px rgba(139,92,246,0.12)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Goals modal */}
      {showGoals && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: N.text }}>Training goals</div>
              <button onClick={() => setShowGoals(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: N.muted }}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CATEGORIES.map(cat => (
                <div key={cat.id} style={{ background: N.soft, border: `1px solid ${N.border}`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <CatIcon cat={cat} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: N.text }}>{cat.label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Daily goal (hours)</label>
                      <input type="number" step="0.5" min="0" value={goalForm[cat.id].daily_hours}
                        onChange={e => setGoalForm(prev => ({ ...prev, [cat.id]: { ...prev[cat.id], daily_hours: e.target.value } }))}
                        style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                    <div>
                      <label style={labelStyle}>Quarterly goal (hours)</label>
                      <input type="number" step="1" min="0" value={goalForm[cat.id].quarterly_hours}
                        onChange={e => setGoalForm(prev => ({ ...prev, [cat.id]: { ...prev[cat.id], quarterly_hours: e.target.value } }))}
                        style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowGoals(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveGoals} disabled={savingGoals} style={{ opacity: savingGoals ? 0.6 : 1 }}>{savingGoals ? 'Saving...' : 'Save goals'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress tab */}
      {activeTab === 'progress' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {catStats.map(cat => {
            const behind = cat.monthBehind || cat.qBehind
            return (
              <div key={cat.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <CatIcon cat={cat} size={18} box={36} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: N.text }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: N.muted }}>{cat.sessCount} sessions · {cat.catHours.toFixed(1)}h</div>
                  </div>
                  <span style={{ marginLeft: 'auto', padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: behind ? STATUS.behind.bg : STATUS.good.bg, color: behind ? STATUS.behind.color : STATUS.good.color, border: `1px solid ${behind ? STATUS.behind.border : STATUS.good.border}` }}>
                    {behind ? 'Behind' : 'On track'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: N.sub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Monthly (goal: {cat.monthGoal.toFixed(0)}h)</div>
                    <ProgressBar value={cat.monthHrs} max={cat.monthGoal} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: N.sub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Quarterly (goal: {cat.quarterlyGoal}h)</div>
                    <ProgressBar value={cat.qHrs} max={cat.quarterlyGoal} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Sessions tab */}
      {activeTab === 'sessions' && (
        <>
          {showNew && (
            <div className="card" style={{ borderTop: `3px solid ${N.accent}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: N.text }}>Log training session</div>
                <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: N.muted }}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Training category *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {CATEGORIES.map(c => {
                      const on = form.category === c.id
                      return (
                        <button key={c.id} onClick={() => setF('category', c.id)} style={{ padding: 10, borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${on ? N.accent : N.border}`, background: on ? N.accentBg : '#fff', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter, sans-serif' }}>
                          <c.Icon size={16} color={on ? N.accent : N.icon} strokeWidth={2} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: on ? N.accent : N.text }}>{c.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Session title *</label>
                    <input type="text" value={form.title} onChange={e => setF('title', e.target.value)} placeholder="e.g. SCBA Donning & Doffing Drill" style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                  </div>
                  <div>
                    <label style={labelStyle}>Topic *</label>
                    <select value={form.topic} onChange={e => setF('topic', e.target.value)} style={inputStyle}>
                      <option value="">Select topic...</option>
                      {formCat?.topics.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>Date *</label><input type="date" value={form.training_date} onChange={e => setF('training_date', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Start time</label><input type="time" value={form.start_time} onChange={e => setF('start_time', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>End time</label><input type="time" value={form.end_time} onChange={e => setF('end_time', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Duration (hrs)</label><input type="number" step="0.25" min="0" value={form.duration_hours} onChange={e => setF('duration_hours', e.target.value)} placeholder="Auto" style={inputStyle} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Instructor</label>
                    <select value={form.instructor_id} onChange={e => setF('instructor_id', e.target.value)} style={inputStyle}>
                      <option value="">Select instructor...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Location</label>
                    <input type="text" value={form.location} onChange={e => setF('location', e.target.value)} placeholder="e.g. Station 4, Training Bay" style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: N.soft, borderRadius: 8, border: `1px solid ${N.border}` }}>
                  <input type="checkbox" id="quarterly" checked={form.is_quarterly} onChange={e => setF('is_quarterly', e.target.checked)} style={{ width: 16, height: 16, accentColor: N.accent }} />
                  <label htmlFor="quarterly" style={{ fontSize: 13, fontWeight: 600, color: N.text, cursor: 'pointer' }}>This is a quarterly third-party training session</label>
                </div>
                {form.is_quarterly && (
                  <div>
                    <label style={labelStyle}>Third-party provider</label>
                    <input type="text" value={form.third_party_provider} onChange={e => setF('third_party_provider', e.target.value)} placeholder="e.g. Texas Fire Training Institute" style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Participants ({form.participants.length} selected)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxHeight: 160, overflowY: 'auto', padding: 4 }}>
                    {users.map(u => {
                      const on = form.participants.includes(u.id)
                      return (
                        <div key={u.id} onClick={() => toggleParticipant(u.id)} style={{ padding: '7px 10px', borderRadius: 7, cursor: 'pointer', border: `1.5px solid ${on ? N.accent : N.border}`, background: on ? N.accentBg : '#fff', fontSize: 12, fontWeight: 500, color: on ? N.accent : N.text, userSelect: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: on ? N.accent : N.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: on ? '#fff' : N.sub, fontWeight: 700 }}>
                            {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          {u.full_name?.split(' ')[0]}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea value={form.notes} onChange={e => setF('notes', e.target.value)} rows={3} placeholder="Training objectives, observations, follow-up items..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} onFocus={focusOn} onBlur={focusOff} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Log session →'}</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[{ id: 'all', label: 'All sessions' }, ...CATEGORIES].map(f => {
              const on = filter === f.id
              return (
                <button key={f.id} onClick={() => setFilter(on && f.id !== 'all' ? 'all' : f.id)} style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: `1.5px solid ${on ? N.accent : N.border}`, background: on ? N.accentBg : '#fff', color: on ? N.accent : N.sub, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {f.Icon && <f.Icon size={13} color={on ? N.accent : N.muted} strokeWidth={2} />}
                  {f.label}
                </button>
              )
            })}
          </div>

          {loading ? (
            <div className="card" style={{ textAlign: 'center', color: N.muted, padding: 40 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <ClipboardList size={40} color={N.accentBorder} strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: N.sub, marginBottom: 4 }}>No training sessions yet</div>
              <div style={{ fontSize: 13, color: N.muted }}>Click Log session to record your first session.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(s => {
                const c = CATEGORIES.find(x => x.id === s.category) || CATEGORIES[0]
                const expanded = expandedId === s.id
                const participantNames = (s.participants || []).map(pid => users.find(u => u.id === pid)?.full_name || '').filter(Boolean)
                return (
                  <div key={s.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }} onClick={() => setExpandedId(expanded ? null : s.id)}>
                      <CatIcon cat={c} size={18} box={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: N.text }}>{s.title}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: N.iconBg, color: N.sub, border: `1px solid ${N.border}` }}>{c.label}</span>
                          {s.is_quarterly && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: N.iconBg, color: N.sub, border: `1px solid ${N.border}` }}>Quarterly</span>}
                        </div>
                        <div style={{ fontSize: 12, color: N.sub, marginTop: 3, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          <span>{formatDate(s.training_date)}</span>
                          {s.duration_hours && <span style={metaItem}><Clock size={12} /> {parseFloat(s.duration_hours).toFixed(1)}h</span>}
                          {s.location && <span style={metaItem}><MapPin size={12} /> {s.location}</span>}
                          {participantNames.length > 0 && <span style={metaItem}><Users size={12} /> {participantNames.length} participants</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={e => { e.stopPropagation(); exportSessionPDF(s) }} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${N.border}`, background: '#fff', color: N.text, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <FileDown size={12} /> PDF
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(s.id) }} disabled={deleting === s.id} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${N.border}`, background: '#fff', color: STATUS.behind.color, fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: deleting === s.id ? 0.5 : 1 }}>
                          {deleting === s.id ? '...' : 'Delete'}
                        </button>
                        {expanded ? <ChevronUp size={16} color={N.muted} /> : <ChevronDown size={16} color={N.muted} />}
                      </div>
                    </div>
                    {expanded && (
                      <div style={{ padding: '0 18px 16px', borderTop: '1px solid #F3F4F6' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingTop: 14 }}>
                          {[
                            { label: 'Topic', value: s.topic },
                            { label: 'Instructor', value: s.instructor?.full_name || '—' },
                            { label: 'Logged by', value: s.users?.full_name || '—' },
                            { label: 'Start time', value: s.start_time || '—' },
                            { label: 'End time', value: s.end_time || '—' },
                            { label: 'Duration', value: s.duration_hours ? `${parseFloat(s.duration_hours).toFixed(1)} hours` : '—' },
                            { label: 'Provider', value: s.third_party_provider || '—' },
                            { label: 'Location', value: s.location || '—' },
                            { label: 'Quarterly', value: s.is_quarterly ? 'Yes' : 'No' },
                          ].map(row => (
                            <div key={row.label}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: N.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{row.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: N.text }}>{row.value}</div>
                            </div>
                          ))}
                        </div>
                        {participantNames.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: N.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Participants</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {participantNames.map(name => <span key={name} style={{ padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: N.iconBg, color: N.text, border: `1px solid ${N.border}` }}>{name}</span>)}
                            </div>
                          </div>
                        )}
                        {s.notes && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: N.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Notes</div>
                            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, background: N.soft, padding: '10px 12px', borderRadius: 8 }}>{s.notes}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}