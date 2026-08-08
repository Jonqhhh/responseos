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

const roleConfig = {
  admin:      { color: '#6B4EFF', bg: '#EEF0FF', border: '#C7C0FF', label: 'Admin' },
  supervisor: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', label: 'Supervisor' },
  employee:   { color: '#6B7280', bg: '#F3F4F8', border: '#E4E6EF', label: 'Employee' },
  auditor:    { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Auditor' },
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
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSaved={refetch} />}
      {!!editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch() }}
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

      {/* Role summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {['admin', 'supervisor', 'employee', 'auditor'].map(role => {
          const cfg = roleConfig[role]
          const count = users.filter(u => u.role === role).length
          return (
            <div key={role} className="card" style={{ borderTop: `3px solid ${cfg.color}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: cfg.bg, color: cfg.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, border: `1px solid ${cfg.border}`
              }}>
                {count}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}>{count}</div>
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{cfg.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Active users table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #E4E6EF',
          background: '#F8F9FC', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F1117' }}>Active users</span>
          <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{active.length} members</span>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {active.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF', padding: 32 }}>No active users.</td></tr>
            )}
            {active.map(u => {
              const cfg = roleConfig[u.role] || roleConfig.employee
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: cfg.bg, color: cfg.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, flexShrink: 0, border: `1px solid ${cfg.border}`
                      }}>
                        {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.full_name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#6B7280' }}>{u.email}</td>
                  <td>
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`
                    }}>{u.role}</span>
                  </td>
                  <td style={{ color: '#6B7280', fontSize: 13 }}>{u.department || '—'}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                      Active
                    </span>
                  </td>
                  <td>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(u) }}
                      style={{
                        padding: '5px 12px', borderRadius: 6,
                        border: '1px solid #E4E6EF', background: '#fff',
                        color: '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        transition: 'all .12s'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#6B4EFF'; e.currentTarget.style.color = '#6B4EFF' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#E4E6EF'; e.currentTarget.style.color = '#6B7280' }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-card-list">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
          Active users ({active.length})
        </div>
        {active.map(u => {
          const cfg = roleConfig[u.role] || roleConfig.employee
          return (
            <div key={u.id} className="mobile-card">
              <div className="mobile-card-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: cfg.bg, color: cfg.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, border: `1px solid ${cfg.border}`
                  }}>
                    {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#0F1117' }}>{u.full_name}</span>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
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
                <button type="button" onClick={() => setEditing(u)} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
                  Edit
                </button>
              </div>
            </div>
          )
        })}

        {inactive.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 8, marginBottom: 4 }}>
              Inactive ({inactive.length})
            </div>
            {inactive.map(u => (
              <div key={u.id} className="mobile-card" style={{ opacity: 0.6 }}>
                <div className="mobile-card-row">
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#0F1117' }}>{u.full_name}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>INACTIVE</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <button type="button" onClick={() => setEditing(u)} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
                    Reactivate
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Inactive users table */}
      {inactive.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', opacity: 0.65 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E4E6EF', background: '#F8F9FC' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280' }}>Inactive users ({inactive.length})</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th></th></tr>
            </thead>
            <tbody>
              {inactive.map(u => {
                const cfg = roleConfig[u.role] || roleConfig.employee
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#6B7280' }}>{u.email}</td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: '#6B7280' }}>{u.department || '—'}</td>
                    <td>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(u) }}
                        style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #E4E6EF', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
