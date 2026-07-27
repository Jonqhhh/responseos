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

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {showAdd && (
        <AssignTaskModal
          onClose={() => setShowAdd(false)}
          onSaved={refetch}
          currentUser={currentUser}
        />
      )}

      {!!editing && (
        <EditTaskModal
          task={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}

      <PageHeader
        title="Tasks"
        subtitle="Assigned work, inspections, and scheduled compliance activities."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + Assign task
          </button>
        }
      />

      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: 'Overdue', count: tasks.filter(t => t.status === 'overdue').length, cls: 'pill-red' },
          { label: 'In progress', count: tasks.filter(t => t.status === 'in_progress').length, cls: 'pill-amber' },
          { label: 'Scheduled', count: tasks.filter(t => t.status === 'scheduled').length, cls: 'pill-blue' },
          { label: 'Complete', count: tasks.filter(t => t.status === 'complete').length, cls: 'pill-green' },
        ].map(s => (
          <span key={s.label} className={`pill ${s.cls}`} style={{ fontSize: 13, padding: '5px 12px' }}>
            {s.count} {s.label}
          </span>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th><th>Assigned to</th><th>Type</th><th>Due date</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>
                  No tasks yet — click + Assign task to get started.
                </td>
              </tr>
            )}
            {tasks.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 500 }}>{t.title}</td>
                <td>{t.users?.full_name}</td>
                <td className="mono" style={{ color: 'var(--text2)' }}>{t.type}</td>
                <td className="mono"
                  style={{ color: t.status === 'overdue' ? 'var(--red)' : 'var(--text2)' }}>
                  {t.due_date}
                </td>
                <td>
                  <span className={`pill ${
                    t.status === 'overdue' ? 'pill-red' :
                    t.status === 'in_progress' ? 'pill-amber' :
                    t.status === 'complete' ? 'pill-green' : 'pill-blue'
                  }`}>{t.status.replace('_', ' ')}</span>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEditing(t); }}
                    style={{
                      padding: '4px 10px', borderRadius: 4,
                      border: '0.5px solid var(--border2)',
                      background: 'transparent', color: 'var(--text2)',
                      fontSize: 12, cursor: 'pointer'
                    }}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}