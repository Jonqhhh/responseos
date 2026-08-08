import { useState, useEffect } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabase'

export default function EditTaskModal({ task, onClose, onSaved }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
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
    onClose()
    onSaved('Task updated successfully.', 'success')
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
    if (error) { setError(error.message); setDeleting(false); setConfirmDelete(false); return }
    setDeleting(false)
    onClose()
    onSaved('Task deleted.', 'error')
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    borderRadius: 6, border: '1px solid #E4E6EF',
    background: '#fff', color: '#0F1117',
    fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none'
  }
  const labelStyle = { fontSize: 12, color: '#6B7280', marginBottom: 5, display: 'block', fontWeight: 600 }

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
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 6, padding: '10px 12px', fontSize: 13, color: '#DC2626'
          }}>{error}</div>
        )}

        {/* Delete confirmation */}
        {confirmDelete && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 8, padding: '14px 16px'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', marginBottom: 10 }}>
              Are you sure you want to delete "{task.title}"? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleDelete} disabled={deleting} style={{
                padding: '7px 16px', borderRadius: 6, border: 'none',
                background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1
              }}>
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
              <button onClick={() => setConfirmDelete(false)} style={{
                padding: '7px 16px', borderRadius: 6,
                border: '1px solid #E4E6EF', background: '#fff',
                color: '#6B7280', fontSize: 13, cursor: 'pointer'
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 4 }}>
          {!confirmDelete && (
            <button onClick={() => setConfirmDelete(true)} disabled={loading || deleting}
              style={{
                padding: '8px 14px', borderRadius: 6,
                border: '1px solid #FECACA', background: '#FEF2F2',
                color: '#DC2626', fontSize: 13, cursor: 'pointer',
                opacity: loading || deleting ? 0.6 : 1
              }}>
              Delete
            </button>
          )}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
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