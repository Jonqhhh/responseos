import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import { ClipboardList, Plus, X, ChevronDown, ChevronUp, Users, Clock, Award } from 'lucide-react'

const CATEGORIES = [
  { id: 'fire',    label: 'Fire',    icon: '🔥', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA',
    topics: ['Fire Extinguisher Operations', 'SCBA Operations', 'Foam Operations', 'Defensive Fire Attack', 'Fire Behavior', 'Fire Drills', 'Wildland Fire', 'Other'] },
  { id: 'hazmat',  label: 'Hazmat',  icon: '☣️', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A',
    topics: ['ERG Reference', 'Air Monitoring', 'Decontamination', 'Spill Control', 'Chemical Identification', 'PPE Selection', 'Incident Command', 'Other'] },
  { id: 'rescue',  label: 'Rescue',  icon: '🪢', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE',
    topics: ['High-Angle Rescue', 'Confined Space Entry', 'Rope Systems', 'Vehicle Extrication', 'Water Rescue', 'Trench Rescue', 'Structural Collapse', 'Other'] },
  { id: 'medical', label: 'Medical', icon: '🏥', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0',
    topics: ['CPR/AED', 'First Aid', 'Trauma Scenarios', 'Patient Assessment', 'Hemorrhage Control', 'EMS Operations', 'Mass Casualty', 'Other'] },
]

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function calcHours(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60)
}

export default function TrainingTracker() {
  const [sessions, setSessions] = useState([])
  const [users, setUsers] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [user, setUser] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const [form, setForm] = useState({
    title: '',
    category: 'fire',
    topic: '',
    training_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    duration_hours: '',
    location: '',
    notes: '',
    is_quarterly: false,
    third_party_provider: '',
    instructor_id: '',
    participants: [],
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
        supabase.from('training_sessions').select('*, users!training_sessions_logged_by_fkey(full_name), instructor:users!training_sessions_instructor_id_fkey(full_name)')
          .eq('is_demo', isDemo).order('training_date', { ascending: false }),
        supabase.from('users').select('id, full_name').eq('is_demo', isDemo).eq('is_active', true).order('full_name'),
        supabase.from('training_goals').select('*').eq('is_demo', isDemo),
      ])
      setSessions(sessRes.data || [])
      setUsers(usersRes.data || [])
      setGoals(goalsRes.data || [])
    }
    setLoading(false)
  }

  function showToast(message, type = 'success') {
    setToast({ message, type, id: Date.now() })
  }

  function setF(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'start_time' || field === 'end_time') {
        const hrs = calcHours(
          field === 'start_time' ? value : prev.start_time,
          field === 'end_time' ? value : prev.end_time
        )
        if (hrs > 0) next.duration_hours = hrs.toFixed(2)
      }
      return next
    })
  }

  function toggleParticipant(id) {
    setForm(prev => ({
      ...prev,
      participants: prev.participants.includes(id)
        ? prev.participants.filter(p => p !== id)
        : [...prev.participants, id]
    }))
  }

  async function handleSubmit() {
    if (!form.title || !form.category || !form.topic || !form.training_date) {
      showToast('Please fill in title, category, topic, and date.', 'error')
      return
    }
    setSaving(true)
    const isDemo = user?.is_demo === true
    const { error } = await supabase.from('training_sessions').insert({
      logged_by: user?.id,
      instructor_id: form.instructor_id || null,
      title: form.title,
      category: form.category,
      topic: form.topic,
      training_date: form.training_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      duration_hours: form.duration_hours ? parseFloat(form.duration_hours) : null,
      location: form.location || null,
      notes: form.notes || null,
      is_quarterly: form.is_quarterly,
      third_party_provider: form.third_party_provider || null,
      participants: form.participants,
      is_demo: isDemo
    })
    if (error) { showToast(error.message, 'error'); setSaving(false); return }
    setSaving(false)
    setShowNew(false)
    setForm({
      title: '', category: 'fire', topic: '',
      training_date: new Date().toISOString().split('T')[0],
      start_time: '', end_time: '', duration_hours: '',
      location: '', notes: '', is_quarterly: false,
      third_party_provider: '', instructor_id: '', participants: []
    })
    await loadAll()
    showToast('Training session logged successfully.')
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this training session?')) return
    setDeleting(id)
    await supabase.from('training_sessions').delete().eq('id', id)
    await loadAll()
    setDeleting(null)
    showToast('Training session deleted.', 'error')
  }

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.category === filter)

  // Stats
  const totalHours = sessions.reduce((sum, s) => sum + (parseFloat(s.duration_hours) || 0), 0)
  const thisMonth = sessions.filter(s => new Date(s.training_date).getMonth() === new Date().getMonth())
  const monthHours = thisMonth.reduce((sum, s) => sum + (parseFloat(s.duration_hours) || 0), 0)
  const quarterly = sessions.filter(s => s.is_quarterly)

  const cat = CATEGORIES.find(c => c.id === form.category)

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid #E5E7EB', background: '#fff', color: '#111827',
    fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color .12s'
  }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 5, display: 'block' }

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Training Tracker"
        subtitle="Log, track, and export daily and quarterly training sessions by category."
        action={
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={15} strokeWidth={2} /> Log training session
          </button>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total sessions', value: sessions.length, color: '#7C3AED', icon: ClipboardList },
          { label: 'Total hours', value: totalHours.toFixed(1) + 'h', color: '#059669', icon: Clock },
          { label: 'This month', value: monthHours.toFixed(1) + 'h', color: '#D97706', icon: Award },
          { label: 'Quarterly sessions', value: quarterly.length, color: '#2563EB', icon: Users },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={s.color} strokeWidth={2} />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Category breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {CATEGORIES.map(c => {
          const catSessions = sessions.filter(s => s.category === c.id)
          const catHours = catSessions.reduce((sum, s) => sum + (parseFloat(s.duration_hours) || 0), 0)
          return (
            <div key={c.id} className="card" style={{ borderTop: `3px solid ${c.color}`, cursor: 'pointer' }}
              onClick={() => setFilter(filter === c.id ? 'all' : c.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{c.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{catHours.toFixed(1)}h</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{catSessions.length} sessions</div>
            </div>
          )
        })}
      </div>

      {/* New session form */}
      {showNew && (
        <div className="card" style={{ borderTop: '3px solid #7C3AED' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Log training session</div>
            <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Category selector */}
            <div>
              <label style={labelStyle}>Training category *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setF('category', c.id)} style={{
                    padding: '10px', borderRadius: 8, cursor: 'pointer',
                    border: `2px solid ${form.category === c.id ? c.color : '#E5E7EB'}`,
                    background: form.category === c.id ? c.bg : '#fff',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: 'Inter, sans-serif', transition: 'all .12s'
                  }}>
                    <span style={{ fontSize: 18 }}>{c.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: form.category === c.id ? c.color : '#6B7280' }}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Session title *</label>
                <input type="text" value={form.title} onChange={e => setF('title', e.target.value)}
                  placeholder="e.g. SCBA Donning & Doffing Drill" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#7C3AED'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
              <div>
                <label style={labelStyle}>Topic *</label>
                <select value={form.topic} onChange={e => setF('topic', e.target.value)} style={inputStyle}>
                  <option value="">Select topic...</option>
                  {cat?.topics.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Date *</label>
                <input type="date" value={form.training_date} onChange={e => setF('training_date', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Start time</label>
                <input type="time" value={form.start_time} onChange={e => setF('start_time', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>End time</label>
                <input type="time" value={form.end_time} onChange={e => setF('end_time', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Duration (hrs)</label>
                <input type="number" step="0.25" min="0" value={form.duration_hours} onChange={e => setF('duration_hours', e.target.value)}
                  placeholder="Auto-calc" style={inputStyle} />
              </div>
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
                <input type="text" value={form.location} onChange={e => setF('location', e.target.value)}
                  placeholder="e.g. Station 4, Training Bay" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#7C3AED'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
            </div>

            {/* Quarterly toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
              <input type="checkbox" id="quarterly" checked={form.is_quarterly}
                onChange={e => setF('is_quarterly', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#7C3AED' }} />
              <label htmlFor="quarterly" style={{ fontSize: 13, fontWeight: 600, color: '#111827', cursor: 'pointer' }}>
                This is a quarterly third-party training session
              </label>
            </div>

            {form.is_quarterly && (
              <div>
                <label style={labelStyle}>Third-party provider</label>
                <input type="text" value={form.third_party_provider} onChange={e => setF('third_party_provider', e.target.value)}
                  placeholder="e.g. Texas Fire Training Institute" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#7C3AED'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
            )}

            {/* Participants */}
            <div>
              <label style={labelStyle}>Participants ({form.participants.length} selected)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxHeight: 160, overflowY: 'auto', padding: 4 }}>
                {users.map(u => (
                  <div key={u.id} onClick={() => toggleParticipant(u.id)} style={{
                    padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                    border: `1.5px solid ${form.participants.includes(u.id) ? '#7C3AED' : '#E5E7EB'}`,
                    background: form.participants.includes(u.id) ? '#F5F3FF' : '#fff',
                    fontSize: 12, fontWeight: 500,
                    color: form.participants.includes(u.id) ? '#7C3AED' : '#374151',
                    transition: 'all .12s', userSelect: 'none',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: form.participants.includes(u.id) ? '#7C3AED' : '#E5E7EB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: form.participants.includes(u.id) ? '#fff' : '#9CA3AF', fontWeight: 700
                    }}>
                      {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    {u.full_name?.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={e => setF('notes', e.target.value)}
                rows={3} placeholder="Training objectives, observations, follow-up items..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}
                style={{ opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Log session →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[{ id: 'all', label: 'All sessions' }, ...CATEGORIES].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
            border: `1.5px solid ${filter === f.id ? '#7C3AED' : '#E5E7EB'}`,
            background: filter === f.id ? '#F5F3FF' : '#fff',
            color: filter === f.id ? '#7C3AED' : '#6B7280',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', gap: 5
          }}>
            {'icon' in f && <span>{f.icon}</span>}
            {f.label}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <ClipboardList size={40} color="#DDD6FE" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>No training sessions yet</div>
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>Click Log training session to record your first session.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(s => {
            const cat = CATEGORIES.find(c => c.id === s.category) || CATEGORIES[0]
            const expanded = expandedId === s.id
            const participantNames = (s.participants || []).map(pid => {
              const u = users.find(u => u.id === pid)
              return u?.full_name || ''
            }).filter(Boolean)

            return (
              <div key={s.id} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `4px solid ${cat.color}` }}>
                <div style={{
                  padding: '14px 18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 14
                }} onClick={() => setExpandedId(expanded ? null : s.id)}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, border: `1px solid ${cat.border}`
                  }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{s.title}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>
                        {cat.label}
                      </span>
                      {s.is_quarterly && (
                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
                          Quarterly
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>{formatDate(s.training_date)}</span>
                      {s.duration_hours && <span>⏱ {parseFloat(s.duration_hours).toFixed(1)}h</span>}
                      {s.location && <span>📍 {s.location}</span>}
                      {participantNames.length > 0 && <span>👥 {participantNames.length} participants</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={e => { e.stopPropagation(); handleDelete(s.id) }}
                      disabled={deleting === s.id}
                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: deleting === s.id ? 0.5 : 1 }}>
                      {deleting === s.id ? '...' : 'Delete'}
                    </button>
                    {expanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
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
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{row.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{row.value}</div>
                        </div>
                      ))}
                    </div>
                    {participantNames.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Participants</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {participantNames.map(name => (
                            <span key={name} style={{ padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {s.notes && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Notes</div>
                        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, background: '#F9FAFB', padding: '10px 12px', borderRadius: 8 }}>{s.notes}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}