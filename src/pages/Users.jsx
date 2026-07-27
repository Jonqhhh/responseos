import { useState } from 'react'
import { useData } from '../lib/useData'
import { supabase } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import PageHeader from '../components/PageHeader'
import AddUserModal from '../components/AddUserModal'
import EditUserModal from '../components/EditUserModal'

async function getUsers() {
  const { data, error } = await supabase
    .from('users').select('*').order('full_name')
  if (error) throw error
  return data
}

const roleColor = {
  admin:      { bg: 'var(--blue-dim)',  text: '#93C5FD' },
  supervisor: { bg: 'var(--green-dim)', text: '#6EE7B7' },
  employee:   { bg: 'var(--surface3)', text: 'var(--text2)' },
  auditor:    { bg: 'var(--amber-dim)', text: '#FCD34D' },
}

export default function Users() {
  const { data, loading, error, refetch } = useData(getUsers)
  const users = data ?? []
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />

  const active   = users.filter(u => u.is_active)
  const inactive = users.filter(u => !u.is_active)

  return (
    <div className="page-wrap" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSaved={refetch} />}
      {!!editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}

      <PageHeader
        title="User management"
        subtitle="Add, edit, and manage team access to ResponseOS."
        action={
          <button type="button" className="btn btn-primary mobile-full" onClick={() => setShowAdd(true)}>
            + Add user
          </button>
        }
      />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {['admin','supervisor','employee','auditor'].map(role => (
          <span key={role} style={{
            padding: '5px 12px', borderRadius: 99, fontSize: 13,
            background: roleColor[role]?.bg, color: roleColor[role]?.text,
            border: '0.5px solid var(--border)'
          }}>
            {users.filter(u => u.role === role).length} {role}
          </span>
        ))}
      </div>

      {/* Desktop table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
          <span className="label">Active users ({active.length})</span>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th></th></tr>
          </thead>
          <tbody>
            {active.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                <td style={{ color: 'var(--text2)', fontSize: 12, fontFamily: 'var(--mono)' }}>{u.email}</td>
                <td>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: roleColor[u.role]?.bg, color: roleColor[u.role]?.text }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ color: 'var(--text2)' }}>{u.department || '—'}</td>
                <td>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(u) }}
                    style={{ padding: '4px 10px', borderRadius: 4, border: '0.5px solid var(--border2)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards — active */}
      <div className="mobile-card-list">
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
          Active users ({active.length})
        </div>
        {active.map(u => (
          <div key={u.id} className="mobile-card">
            <div className="mobile-card-row">
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{u.full_name}</span>
              <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: roleColor[u.role]?.bg, color: roleColor[u.role]?.text }}>
                {u.role}
              </span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">Email</span>
              <span className="mobile-card-value" style={{ fontSize: 12, fontFamily: 'var(--mono)' }}>{u.email}</span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">Department</span>
              <span className="mobile-card-value">{u.department || '—'}</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <button type="button" onClick={() => setEditing(u)}
                className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {inactive.length > 0 && (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden', opacity: 0.6 }}>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
              <span className="label">Inactive users ({inactive.length})</span>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th></th></tr>
              </thead>
              <tbody>
                {inactive.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12, fontFamily: 'var(--mono)' }}>{u.email}</td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: roleColor[u.role]?.bg, color: roleColor[u.role]?.text }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{u.department || '—'}</td>
                    <td>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(u) }}
                        style={{ padding: '4px 10px', borderRadius: 4, border: '0.5px solid var(--border2)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobile-card-list" style={{ opacity: 0.6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
              Inactive users ({inactive.length})
            </div>
            {inactive.map(u => (
              <div key={u.id} className="mobile-card">
                <div className="mobile-card-row">
                  <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{u.full_name}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: roleColor[u.role]?.bg, color: roleColor[u.role]?.text }}>
                    {u.role}
                  </span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <button type="button" onClick={() => setEditing(u)}
                    className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
                    Reactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}