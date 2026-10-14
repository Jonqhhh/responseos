import { useState, useRef } from 'react'
import { useData } from '../lib/useData'
import { supabase } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/States'
import PageHeader from '../components/PageHeader'
import AddUserModal from '../components/AddUserModal'
import EditUserModal from '../components/EditUserModal'
import Toast from '../components/Toast'
import { Upload, X, CheckCircle, XCircle, Download } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

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

function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const obj = {}
    headers.forEach((h, i) => { obj[h] = vals[i] || '' })
    return {
      full_name:  obj['full_name'] || obj['name'] || obj['full name'] || '',
      email:      obj['email'] || obj['email address'] || '',
      role:       obj['role'] || 'employee',
      department: obj['department'] || obj['dept'] || '',
    }
  }).filter(u => u.full_name && u.email)
}

export default function Users() {
  const { data, loading, error, refetch } = useData(getUsers)
  const users = data ?? []
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [csvPreview, setCsvPreview] = useState([])
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState(null)
  const fileRef = useRef(null)

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />

  const active   = users.filter(u => u.is_active)
  const inactive = users.filter(u => !u.is_active)

  function showToast(message, type = 'success') {
    setToast({ message, type, id: Date.now() })
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result)
      setCsvPreview(parsed)
      setImportResults(null)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!csvPreview.length) return
    setImporting(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('is_demo').eq('id', authUser.id).single()
    const isDemo = profile?.is_demo === true
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ users: csvPreview.map(u => ({ ...u, is_demo: isDemo })) })
    })
    const data = await res.json()
    setImportResults(data.results || [])
    setImporting(false)
    const succeeded = (data.results || []).filter(r => r.success).length
    const failed    = (data.results || []).filter(r => !r.success).length
    await refetch()
    if (succeeded > 0) showToast(`${succeeded} user${succeeded !== 1 ? 's' : ''} imported${failed > 0 ? `, ${failed} failed` : ''}.`, failed > 0 ? 'error' : 'success')
  }

  function downloadTemplate() {
    const csv = 'full_name,email,role,department\nJane Smith,jane@company.com,employee,Operations\nJohn Doe,john@company.com,supervisor,Safety'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'responseos-roster-template.csv'; a.click()
    URL.revokeObjectURL(url)
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => { setShowImport(true); setCsvPreview([]); setImportResults(null) }}>
              <Upload size={14} strokeWidth={2} /> Import roster
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
              + Add user
            </button>
          </div>
        }
      />

      {showImport && (
        <div className="card" style={{ borderTop: '3px solid #7C3AED' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Import team roster</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Upload a CSV with columns: full_name, email, role, department</div>
            </div>
            <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
              <X size={18} />
            </button>
          </div>

          {!csvPreview.length && !importResults && (
            <div>
              <div onClick={() => fileRef.current?.click()}
                style={{ border: '2px dashed #DDD6FE', borderRadius: 10, padding: '36px', textAlign: 'center', cursor: 'pointer', background: '#F5F3FF', transition: 'all .12s', marginBottom: 12 }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.background = '#EDE9FF' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#DDD6FE'; e.currentTarget.style.background = '#F5F3FF' }}>
                <Upload size={28} color="#7C3AED" strokeWidth={1.5} style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#7C3AED', marginBottom: 4 }}>Click to upload CSV</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>or drag and drop your roster file here</div>
              </div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              <button onClick={downloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#7C3AED', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                <Download size={14} /> Download CSV template
              </button>
            </div>
          )}

          {csvPreview.length > 0 && !importResults && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 10 }}>
                Preview — {csvPreview.length} user{csvPreview.length !== 1 ? 's' : ''} found
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto', borderRadius: 8, border: '1px solid #E5E7EB', marginBottom: 14 }}>
                <table className="data-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th></tr></thead>
                  <tbody>
                    {csvPreview.map((u, i) => {
                      const cfg = roleConfig[u.role] || roleConfig.employee
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, color: '#111827' }}>{u.full_name}</td>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#374151' }}>{u.email}</td>
                          <td><span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{u.role}</span></td>
                          <td style={{ color: '#374151', fontSize: 13 }}>{u.department || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400E', marginBottom: 14, fontWeight: 500 }}>
                ⚠️ Each user will receive a welcome email with their temporary password.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => { setCsvPreview([]); if(fileRef.current) fileRef.current.value = '' }}>← Choose different file</button>
                <button className="btn btn-primary" onClick={handleImport} disabled={importing} style={{ opacity: importing ? 0.6 : 1 }}>
                  {importing ? 'Importing...' : `Import ${csvPreview.length} users →`}
                </button>
              </div>
            </div>
          )}

          {importResults && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle size={20} color="#059669" />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>{importResults.filter(r => r.success).length}</div>
                    <div style={{ fontSize: 12, color: '#065F46', fontWeight: 500 }}>Users imported</div>
                  </div>
                </div>
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <XCircle size={20} color="#DC2626" />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#DC2626' }}>{importResults.filter(r => !r.success).length}</div>
                    <div style={{ fontSize: 12, color: '#991B1B', fontWeight: 500 }}>Failed</div>
                  </div>
                </div>
              </div>
              {importResults.filter(r => !r.success).map((r, i) => (
                <div key={i} style={{ fontSize: 12, color: '#DC2626', marginBottom: 4 }}>{r.email} — {r.error}</div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-ghost" onClick={() => { setShowImport(false); setCsvPreview([]); setImportResults(null) }}>Done</button>
                <button className="btn btn-ghost" onClick={() => { setCsvPreview([]); setImportResults(null); if(fileRef.current) fileRef.current.value = '' }}>Import another file</button>
              </div>
            </div>
          )}
        </div>
      )}

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

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Active users</span>
          <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{active.length} members</span>
        </div>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {active.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF', padding: 32 }}>No active users.</td></tr>}
            {active.map(u => {
              const cfg = roleConfig[u.role] || roleConfig.employee
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{u.full_name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#374151' }}>{u.email}</td>
                  <td><span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{u.role}</span></td>
                  <td style={{ color: '#374151', fontSize: 13, fontWeight: 500 }}>{u.department || '—'}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#065F46', fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />Active
                    </span>
                  </td>
                  <td>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(u) }}
                      style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .12s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.color = '#7C3AED' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mobile-card-list">
        {active.map(u => {
          const cfg = roleConfig[u.role] || roleConfig.employee
          return (
            <div key={u.id} className="mobile-card">
              <div className="mobile-card-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                    {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{u.full_name}</span>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{u.role}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Email</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: '#374151' }}>{u.email}</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <button type="button" onClick={() => setEditing(u)} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>Edit</button>
              </div>
            </div>
          )
        })}
      </div>

      {inactive.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', opacity: 0.7 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280' }}>Inactive users ({inactive.length})</span>
          </div>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th></th></tr></thead>
            <tbody>
              {inactive.map(u => {
                const cfg = roleConfig[u.role] || roleConfig.employee
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: '#111827' }}>{u.full_name}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#374151' }}>{u.email}</td>
                    <td><span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{u.role}</span></td>
                    <td style={{ color: '#374151' }}>{u.department || '—'}</td>
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