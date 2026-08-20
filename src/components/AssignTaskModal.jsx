import { useState, useEffect } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'

export default function AssignTaskModal({ onClose, onSaved, currentUser }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    assigned_to: '',
    title: '',
    description: '',
    type: 'inspection',
    due_date: '',
  })

  useEffect(() => {
    async function loadUsers() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      const { data: profile } = await supabase
        .from('users').select('is_demo').eq('id', authUser.id).single()
      const isDemo = profile?.is_demo === true
      const { data } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('is_demo', isDemo)
        .order('full_name')
      setUsers(data || [])
    }
    loadUsers()
  }, [])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.assigned_to || !form.title || !form.due_date) {
      setError('Please fill in employee, task title, and due date.')
      return
    }
    setLoading(true)
    setError(null)

    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('users').select('is_demo').eq('id', authUser.id).single()
    const isDemo = profile?.is_demo === true

    const { error } = await supabase.from('tasks').insert({
      ...form,
      assigned_by: currentUser?.id || null,
      status: 'scheduled',
      is_demo: isDemo
    })

    if (error) { setError(error.message); setLoading(false); return }

    await supabase.from('audit_logs').insert({
      actor_id: currentUser?.id || null,
      action: 'task_created',
      table_name: 'tasks',
      after_state: { task: form.title, assigned_to: form.assigned_to }
    })

    setLoading(false)
    onSaved()
    onClose()
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    borderRadius: 6, border: '1px solid rgba(139,92,246,0.25)',
    background: 'rgba(20,10,45,0.6)', color: '#F0EEFF',
    fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none'
  }

  const labelStyle = {
    fontSize: 12, color: '#C4B5FD', marginBottom: 5, display: 'block', fontWeight: 600
  }

  return (
    <Modal title="Assign task" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Assign to *</label>
          <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} style={inputStyle}>
            <option value="">Select employee...</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Task title *</label>
          <input type="text" placeholder="e.g. OSHA safety inspection"
            value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Description</label>
          <textarea placeholder="Optional details about this task..."
            value={form.description} onChange={e => set('description', e.target.value)}
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Task type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}>
              <option value="inspection">Inspection</option>
              <option value="checklist">Checklist</option>
              <option value="log">Log</option>
              <option value="security">Security</option>
              <option value="report">Report</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Due date *</label>
            <input type="date" value={form.due_date}
              onChange={e => set('due_date', e.target.value)} style={inputStyle} />
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 6, padding: '10px 12px', fontSize: 13, color: '#FCA5A5'
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}
            disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Saving...' : 'Assign task'}
          </button>
        </div>
      </div>
    </Modal>
  )
}