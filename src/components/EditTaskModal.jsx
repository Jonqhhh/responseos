import { useState, useEffect } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'

export default function EditTaskModal({ task, onClose, onSaved }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    assigned_to: task.assigned_to || '',
    title: task.title || '',
    description: task.description || '',
    type: task.type || 'inspection',
    due_date: task.due_date || '',
    status: task.status || 'scheduled',
  })

  useEffect(() => {
    supabase.from('users').select('id, full_name').order('full_name')
      .then(({ data }) => setUsers(data || []))
  }, [])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.assigned_to || !form.title || !form.due_date) {
      setError('Please fill in employee, title, and due date.')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase
      .from('tasks')
      .update(form)
      .eq('id', task.id)
    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false)
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    setDeleting(true)
    await supabase.from('tasks').delete().eq('id', task.id)
    setDeleting(false)
    onSaved()
    onClose()
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    borderRadius: 6, border: '0.5px solid var(--border2)',
    background: 'var(--surface2)', color: 'var(--text)',
    fontSize: 13, fontFamily: 'var(--font)', outline: 'none'
  }
  const labelStyle = { fontSize: 12, color: 'var(--text2)', marginBottom: 5, display: 'block' }

  return (
    <Modal title="Edit task" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Assigned to *</label>
          <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} style={inputStyle}>
            <option value="">Select employee...</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Task title *</label>
          <input type="text" value={form.title}
            onChange={e => set('title', e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Description</label>
          <textarea value={form.description}
            onChange={e => set('description', e.target.value)}
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}>
              <option value="inspection">Inspection</option>
              <option value="checklist">Checklist</option>
              <option value="log">Log</option>
              <option value="security">Security</option>
              <option value="report">Report</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In progress</option>
              <option value="complete">Complete</option>
              <option value="overdue">Overdue</option>
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
            background: 'var(--red-dim)', border: '0.5px solid var(--red)',
            borderRadius: 6, padding: '10px 12px', fontSize: 13, color: '#FCA5A5'
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 4 }}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: '8px 14px', borderRadius: 6, border: '0.5px solid var(--red)',
              background: 'var(--red-dim)', color: '#FCA5A5', fontSize: 13,
              cursor: 'pointer', opacity: deleting ? 0.6 : 1
            }}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}
              disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}