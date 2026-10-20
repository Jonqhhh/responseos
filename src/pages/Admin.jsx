import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Toast from '../components/Toast'
import PageHeader from '../components/PageHeader'
import { CheckCircle, XCircle, Clock, Mail, Building, Users, Globe, Calendar } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const ADMIN_EMAILS = ['jlane@responseos.net', 'hseals@responseos.net']

export default function Admin() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [acting, setActing] = useState(null)
  const [authorized, setAuthorized] = useState(false)
  const [denyModal, setDenyModal] = useState(null)
  const [denyNote, setDenyNote] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !ADMIN_EMAILS.includes(user.email)) { setAuthorized(false); setLoading(false); return }
      setAuthorized(true)
      await loadRequests()
    }
    init()
  }, [])

  async function loadRequests() {
    setLoading(true)
    const { data } = await supabase.from('demo_requests').select('*').order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  function showToast(message, type = 'success') { setToast({ message, type, id: Date.now() }) }

  async function handleApprove(req) {
    setActing(req.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()

      // Create their account
      const res = await fetch(`${SUPABASE_URL}/functions/v1/demo-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ full_name: req.full_name, email: req.email, company: req.company })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Update request status
      await supabase.from('demo_requests').update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      }).eq('id', req.id)

      await loadRequests()
      showToast(`✓ Demo approved for ${req.full_name} — account created and email sent.`)
    } catch (err) {
      showToast(err.message, 'error')
    }
    setActing(null)
  }

  async function handleDeny(req) {
    setActing(req.id)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('demo_requests').update({
      status: 'denied',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      notes: denyNote || null
    }).eq('id', req.id)

    // Send denial email
    await fetch(`${SUPABASE_URL}/functions/v1/quote-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'DENIAL',
        full_name: req.full_name,
        email: req.email,
        company: req.company
      })
    })

    await loadRequests()
    setDenyModal(null)
    setDenyNote('')
    setActing(null)
    showToast(`Demo request from ${req.full_name} denied.`, 'error')
  }

  const filtered = requests.filter(r => filter === 'all' ? true : r.status === filter)

  const counts = {
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    denied:   requests.filter(r => r.status === 'denied').length,
  }

  if (!loading && !authorized) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Access denied</div>
          <div style={{ fontSize: 14, color: '#9CA3AF' }}>This page is restricted to ResponseOS administrators.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Deny modal */}
      {denyModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Deny demo request</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>{denyModal.full_name} · {denyModal.email}</div>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, display: 'block' }}>Internal note (optional)</label>
                <textarea value={denyNote} onChange={e => setDenyNote(e.target.value)} placeholder="Reason for denial, follow-up notes..." rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#111827', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => { setDenyModal(null); setDenyNote('') }}>Cancel</button>
                <button onClick={() => handleDeny(denyModal)} disabled={acting === denyModal.id}
                  style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: acting === denyModal.id ? 0.6 : 1 }}>
                  {acting === denyModal.id ? 'Denying...' : 'Deny request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Admin Panel"
        subtitle="Review and manage demo requests."
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Pending review', count: counts.pending,  color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: Clock },
          { label: 'Approved',       count: counts.approved, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: CheckCircle },
          { label: 'Denied',         count: counts.denied,   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: XCircle },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card" style={{ borderTop: `3px solid ${s.color}`, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={s.color} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#F9FAFB', borderRadius: 10, padding: 4, border: '1px solid #E5E7EB', width: 'fit-content' }}>
        {[
          { id: 'pending',  label: `Pending (${counts.pending})`   },
          { id: 'approved', label: `Approved (${counts.approved})` },
          { id: 'denied',   label: `Denied (${counts.denied})`     },
          { id: 'all',      label: 'All'                           },
        ].map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            background: filter === t.id ? '#fff' : 'transparent',
            color: filter === t.id ? '#7C3AED' : '#6B7280',
            boxShadow: filter === t.id ? '0 1px 4px rgba(139,92,246,0.12)' : 'none',
            transition: 'all .12s'
          }}>{t.label}</button>
        ))}
      </div>

      {/* Requests list */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Clock size={40} color="#DDD6FE" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>
            No {filter === 'all' ? '' : filter} requests
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>Demo requests will appear here when submitted.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(r => {
            const statusConfig = {
              pending:  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Pending' },
              approved: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', label: 'Approved' },
              denied:   { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Denied' },
            }[r.status] || { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', label: r.status }

            return (
              <div key={r.id} className="card" style={{ borderLeft: `4px solid ${statusConfig.color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{r.full_name}</div>
                      <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.border}` }}>
                        {statusConfig.label}
                      </span>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                        {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      {[
                        { icon: Mail,      value: r.email },
                        { icon: Building,  value: r.company || '—' },
                        { icon: Globe,     value: r.industry || '—' },
                        { icon: Users,     value: r.team_size || '—' },
                        { icon: Calendar,  value: r.availability || '—' },
                        { icon: Globe,     value: r.timezone || '—' },
                      ].map((item, i) => {
                        const Icon = item.icon
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151' }}>
                            <Icon size={13} color="#9CA3AF" strokeWidth={2} />
                            <span>{item.value}</span>
                          </div>
                        )
                      })}
                    </div>
                    {r.compliance_needs && (
                      <div style={{ marginTop: 8, fontSize: 13, color: '#6B7280' }}>
                        <span style={{ fontWeight: 600, color: '#374151' }}>Compliance needs: </span>
                        {r.compliance_needs}
                      </div>
                    )}
                    {r.notes && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>Note: {r.notes}</div>
                    )}
                  </div>

                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => { setDenyModal(r) }}
                        disabled={acting === r.id}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: acting === r.id ? 0.6 : 1 }}>
                        ✕ Deny
                      </button>
                      <button onClick={() => handleApprove(r)}
                        disabled={acting === r.id}
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 8px rgba(124,58,237,0.3)', opacity: acting === r.id ? 0.6 : 1 }}>
                        {acting === r.id ? 'Approving...' : '✓ Approve'}
                      </button>
                    </div>
                  )}

                  {r.status === 'approved' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#059669', fontWeight: 600, flexShrink: 0 }}>
                      <CheckCircle size={16} strokeWidth={2} /> Account created
                    </div>
                  )}

                  {r.status === 'denied' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#DC2626', fontWeight: 600, flexShrink: 0 }}>
                      <XCircle size={16} strokeWidth={2} /> Denied
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}