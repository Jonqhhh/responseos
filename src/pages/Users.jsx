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
  admin:      { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', label: 'Admin' },
  supervisor: { color: '#34D399', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.3)', label: 'Supervisor' },
  employee:   { color: '#9B8ABB', bg: 'rgba(155,138,187,0.15)', border: 'rgba(155,138,187,0.3)', label: 'Employee' },
  auditor:    { color: '#FBBF24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', label: 'Auditor' },
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

  const cardStyle = {
    background: 'rgba(18,10,42,0.75)',
    border: '1px solid rgba(139,92,246,0.18)',
    borderRadius: 14, padding: 0, overflow: 'hidden',
    backdropFilter: 'blur(12px)'
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
                <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{cfg.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Active users table */}
      <div style={cardStyle}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid rgba(139,92,246,0.15)',
          background: 'rgba(30,15,60,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Active users</span>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{active.length} members</span>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {active.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>No active users.</td></tr>
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
                        boxShadow: '0 0 8px rgba(124,58,237,0.4)'
                      }}>
                        {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{u.full_name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>{u.email}</td>
                  <td>
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`
                    }}>{u.role}</span>
                  </td>
                  <td style={{ color: 'var(--text2)', fontSize: 13 }}>{u.department || '—'}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#34D399', fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', display: 'inline-block', boxShadow: '0 0 6px #34D399' }} />
                      Active
                    </span>
                  </td>
                  <td>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(u) }}
                      style={{
                        padding: '5px 12px', borderRadius: 6,
                        border: '1px solid rgba(139,92,246,0.25)',
                        background: 'rgba(139,92,246,0.08)',
                        color: '#C4B5FD', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        transition: 'all .12s'
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.2)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)' }}
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
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
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
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{u.full_name}</span>
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
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 8, marginBottom: 4 }}>
              Inactive ({inactive.length})
            </div>
            {inactive.map(u => (
              <div key={u.id} className="mobile-card" style={{ opacity: 0.6 }}>
                <div className="mobile-card-row">
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{u.full_name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>INACTIVE</span>
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
        <div style={{ ...cardStyle, opacity: 0.65 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(139,92,246,0.15)', background: 'rgba(30,15,60,0.5)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>Inactive users ({inactive.length})</span>
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
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{u.full_name}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>{u.email}</td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{u.department || '—'}</td>
                    <td>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(u) }}
                        style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.08)', color: '#C4B5FD', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
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