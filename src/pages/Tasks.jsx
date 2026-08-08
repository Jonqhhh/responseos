import { useState } from 'react'
import { useData } from '../lib/useData'
import { getTasks } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import PageHeader from '../components/PageHeader'
import AssignTaskModal from '../components/AssignTaskModal'
import EditTaskModal from '../components/EditTaskModal'
import { supabase } from '../lib/supabase'

export default function Tasks() {
  const { data, loading, error, refetch } = useData(getTasks)
  const tasks = data ?? []
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  useState(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from('users').select('*').eq('id', user.id).single()
        setCurrentUser(profile)
      }
    })
  }, [])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  const overdue    = tasks.filter(t => t.status === 'overdue').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const scheduled  = tasks.filter(t => t.status === 'scheduled').length
  const complete   = tasks.filter(t => t.status === 'complete').length

  const statusColor = {
    overdue: '#DC2626', in_progress: '#D97706',
    complete: '#059669', scheduled: '#6B4EFF'
  }

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {showAdd && <AssignTaskModal onClose={() => setShowAdd(false)} onSaved={refetch} currentUser={currentUser} />}
      {!!editing && (
        <EditTaskModal
          task={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch() }}
        />
      )}

      <PageHeader
        title="Tasks"
        subtitle="Assigned work, inspections, and scheduled compliance activities."
        action={
          <button type="button" className="btn btn-primary mobile-full" onClick={() => setShowAdd(true)}>
            + Assign task
          </button>
        }
      />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Overdue', count: overdue, color: '#DC2626', bg: '#FEF2F2', border: '#DC2626' },
          { label: 'In progress', count: inProgress, color: '#D97706', bg: '#FFFBEB', border: '#D97706' },
          { label: 'Scheduled', count: scheduled, color: '#6B4EFF', bg: '#EEF0FF', border: '#6B4EFF' },
          { label: 'Complete', count: complete, color: '#059669', bg: '#ECFDF5', border: '#059669' },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderTop: `3px solid ${s.border}` }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.count}</div>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th><th>Assigned to</th><th>Type</th><th>Due date</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF', padding: 32 }}>
                No tasks yet — click + Assign task to get started.
              </td></tr>
            )}
            {tasks.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>{t.title}</td>
                <td style={{ fontWeight: 500 }}>{t.users?.full_name}</td>
                <td style={{ color: '#6B7280', fontFamily: 'var(--mono)', fontSize: 12 }}>{t.type}</td>
                <td style={{
                  fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
                  color: t.status === 'overdue' ? '#DC2626' : '#6B7280'
                }}>{t.due_date}</td>
                <td>
                  <span className={`pill pill-${t.status === 'overdue' ? 'red' : t.status === 'in_progress' ? 'amber' : t.status === 'complete' ? 'green' : 'blue'}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(t) }}
                    style={{
                      padding: '5px 12px', borderRadius: 6,
                      border: '1px solid #E4E6EF', background: '#fff',
                      color: '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      transition: 'all .12s'
                    }}
                    onMouseOver={e => { e.target.style.borderColor = '#6B4EFF'; e.target.style.color = '#6B4EFF' }}
                    onMouseOut={e => { e.target.style.borderColor = '#E4E6EF'; e.target.style.color = '#6B7280' }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-card-list">
        {tasks.length === 0 && (
          <div className="mobile-card" style={{ textAlign: 'center', color: '#9CA3AF' }}>
            No tasks yet — tap + Assign task.
          </div>
        )}
        {tasks.map(t => (
          <div key={t.id} className="mobile-card" style={{ borderLeft: `3px solid ${statusColor[t.status] || '#E4E6EF'}` }}>
            <div className="mobile-card-row">
              <span style={{ fontSize: 15, fontWeight: 600, color: '#0F1117' }}>{t.title}</span>
              <span className={`pill pill-${t.status === 'overdue' ? 'red' : t.status === 'in_progress' ? 'amber' : t.status === 'complete' ? 'green' : 'blue'}`}>
                {t.status.replace('_', ' ')}
              </span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">Assigned to</span>
              <span className="mobile-card-value">{t.users?.full_name}</span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">Due date</span>
              <span className="mobile-card-value" style={{ color: t.status === 'overdue' ? '#DC2626' : '#0F1117', fontWeight: t.status === 'overdue' ? 600 : 500 }}>
                {t.due_date}
              </span>
            </div>
            <div style={{ marginTop: 10 }}>
              <button type="button" onClick={() => setEditing(t)} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
