import { useData } from '../lib/useData'
import { getTasks } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import PageHeader from '../components/PageHeader'

export default function Tasks() {
  const { data, loading, error } = useData(getTasks)
  const tasks = data ?? []

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Tasks"
        subtitle="Assigned work, inspections, and scheduled compliance activities."
        action={<button className="btn btn-primary">+ Assign task</button>}
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
              <th>Title</th><th>Assigned to</th><th>Type</th><th>Due date</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}