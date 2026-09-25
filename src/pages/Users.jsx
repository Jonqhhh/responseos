import { useState } from 'react'
import { useData } from '../lib/useData'
import { supabase } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import PageHeader from '../components/PageHeader'
import AddUserModal from '../components/AddUserModal'
import EditUserModal from '../components/EditUserModal'
import Toast from '../components/Toast'

async function getUsers() {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return []
  const { data: profile } = await supabase
    .from('users').select('is_demo').eq('id', authUser.id).single()
  const isDemo = profile?.is_demo === true
  const { data, error } = await supabase
    .from('users').select('*').eq('is_demo', isDemo).order('full_name')
  if (error) throw error
  return data
}

const roleConfig = {
  admin:      { color: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE', label: 'Admin' },
  supervisor: { color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0', label: 'Supervisor' },
  employee:   { color: '#374151', bg: '#F9FAFB', border: '#E5E7EB', label: 'Employee' },
  auditor:    { color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', label: 'Auditor' },
}

export default function Users() {
  const { data, loading, error, refetch } = useData(getUsers)
  const users = data ?? []
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState(null)

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />

  const active   = users.filter(u => u.is_active)
  const inactive = users.filter(u => !u.is_active)

  function showToast(message, type = 'success') {
    setToast({ message, type, id: Date.now() })
  }

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { refetch(); showToast('User added successfully.') }}
        />
      )}

      {!!editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg, type) => { setEditing(null); refetch(); showToast(msg || 'User updated.', type || 'success') }}
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
            <div key={role} className="card" style={{ borderTop: `3px solid ${cfg.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: cfg.color, lineHeight: 1, marginBottom: 4 }}>{count}</div>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{cfg.label}</div>
            </div>
          )
        })}
      </div>

      {/* Active users table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #F3F4F6',
          background: '#F9FAFB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Active users</span>
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
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                        color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>
                        {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{u.full_name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#374151' }}>{u.email}</td>
                  <td>
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`
                    }}>{u.role}</span>
                  </td>
                  <td style={{ color: '#374151', fontSize: 13, fontWeight: 500 }}>{u.department || '—'}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#065F46', fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                      Active
                    </span>
                  </td>
                  <td>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(u) }}
                      style={{
                        padding: '5px 12px', borderRadius: 6,
                        border: '1px solid #E5E7EB', background: '#fff',
                        color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        transition: 'all .12s'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.color = '#7C3AED' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151' }}
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
                    width: 32, height: 32, borderRadius: 8,
                    background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700
                  }}>
                    {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{u.full_name}</span>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                  {u.role}
                </span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Email</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: '#374151', fontWeight: 500 }}>{u.email}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Department</span>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{u.department || '—'}</span>
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
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{u.full_name}</span>
                  <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>INACTIVE</span>
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
        <div className="card" style={{ padding: 0, overflow: 'hidden', opacity: 0.7 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
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
                    <td style={{ fontWeight: 600, color: '#111827' }}>{u.full_name}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#374151' }}>{u.email}</td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: '#374151', fontWeight: 500 }}>{u.department || '—'}</td>
                    <td>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(u) }}
                        style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
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