import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Toast from '../components/Toast'
import PageHeader from '../components/PageHeader'
import {
  CheckCircle2, XCircle, Clock, Mail, Building2, Users, Briefcase, Calendar, Globe2,
  Lock, Search, Check, X, MoreVertical, Copy, Inbox, ShieldCheck, StickyNote
} from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ADMIN_EMAILS = ['jlane@responseos.net', 'hseals@responseos.net']

// Same neutral palette as Training / Document Vault
const N = { text: '#111827', sub: '#6B7280', muted: '#9CA3AF', border: '#E5E7EB', soft: '#F9FAFB', iconBg: '#F3F4F6', icon: '#4B5563', accent: '#7C3AED', accentBg: '#F5F3FF', accentBorder: '#DDD6FE' }
const STATUS = {
  pending:  { label: 'Pending',  color: N.accent,  bg: N.accentBg, border: N.accentBorder },
  approved: { label: 'Approved', color: '#047857', bg: '#ECFDF5',  border: '#A7F3D0' },
  denied:   { label: 'Denied',   color: '#B91C1C', bg: '#FEF2F2',  border: '#FECACA' },
}

function splitList(s) {
  if (!s) return []
  return String(s).split(',').map(x => x.trim()).filter(Boolean)
}

function initials(name) {
  return String(name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

/* ---------- Three-dot menu ---------- */

function RowMenu({ items }) {
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!pos) return
    const close = () => setPos(null)
    const onDown = e => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return
      close()
    }
    const onKey = e => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [pos])

  function toggle(e) {
    e.stopPropagation()
    if (pos) { setPos(null); return }
    const r = btnRef.current.getBoundingClientRect()
    const MW = 190, MH = items.length * 38 + 10
    const openUp = r.bottom + MH + 8 > window.innerHeight
    setPos({ top: openUp ? r.top - MH - 4 : r.bottom + 4, left: Math.max(8, r.right - MW) })
  }

  return (
    <>
      <button ref={btnRef} type="button" onClick={toggle} aria-label="Request actions" title="Actions"
        style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          border: `1px solid ${pos ? N.accent : N.border}`,
          background: pos ? N.accentBg : '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s'
        }}
        onMouseOver={e => { if (!pos) e.currentTarget.style.borderColor = '#C4B5FD' }}
        onMouseOut={e => { if (!pos) e.currentTarget.style.borderColor = N.border }}
      >
        <MoreVertical size={15} color={pos ? N.accent : N.sub} />
      </button>

      {pos && (
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left, width: 190, zIndex: 1000,
          background: '#fff', border: `1px solid ${N.border}`, borderRadius: 10, padding: 5,
          boxShadow: '0 12px 32px rgba(17,24,39,0.14)'
        }}>
          {items.map(({ icon: Icon, label, fn }) => (
            <button key={label} type="button"
              onClick={e => { e.stopPropagation(); setPos(null); fn() }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 7, border: 'none', background: 'transparent',
                fontSize: 13, fontWeight: 500, color: '#374151',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left'
              }}
              onMouseOver={e => { e.currentTarget.style.background = N.accentBg; e.currentTarget.style.color = N.accent }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#374151' }}
            >
              <Icon size={15} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/* ---------- Page ---------- */

export default function Admin() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [acting, setActing] = useState(null)
  const [authorized, setAuthorized] = useState(false)
  const [denyModal, setDenyModal] = useState(null)
  const [denyNote, setDenyNote] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !ADMIN_EMAILS.includes(String(user.email || '').toLowerCase())) { setAuthorized(false); setLoading(false); return }
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

      const res = await fetch(`${SUPABASE_URL}/functions/v1/demo-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ full_name: req.full_name, email: req.email, company: req.company })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const { error } = await supabase.from('demo_requests').update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      }).eq('id', req.id)
      if (error) throw new Error(error.message)

      await loadRequests()
      showToast(`Demo approved for ${req.full_name} — account created and email sent.`)
    } catch (err) {
      showToast(err.message, 'error')
    }
    setActing(null)
  }

  async function handleDeny(req) {
    setActing(req.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('demo_requests').update({
        status: 'denied',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        notes: denyNote || null
      }).eq('id', req.id)
      if (error) throw new Error(error.message)

      await fetch(`${SUPABASE_URL}/functions/v1/quote-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'DENIAL', full_name: req.full_name, email: req.email, company: req.company })
      })

      await loadRequests()
      showToast(`Demo request from ${req.full_name} denied.`, 'error')
    } catch (err) {
      showToast(err.message, 'error')
    }
    setDenyModal(null)
    setDenyNote('')
    setActing(null)
  }

  async function copyEmail(email) {
    try { await navigator.clipboard.writeText(email); showToast('Email copied.') }
    catch { showToast('Could not copy — ' + email, 'error') }
  }

  const q = search.trim().toLowerCase()
  const filtered = requests
    .filter(r => filter === 'all' ? true : r.status === filter)
    .filter(r => !q || [r.full_name, r.email, r.company].some(v => String(v || '').toLowerCase().includes(q)))

  const counts = {
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    denied:   requests.filter(r => r.status === 'denied').length,
  }

  if (!loading && !authorized) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: N.iconBg, border: `1px solid ${N.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={28} color={N.icon} strokeWidth={2} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: N.text, marginBottom: 8 }}>Access denied</div>
          <div style={{ fontSize: 14, color: N.muted }}>This page is restricted to ResponseOS administrators.</div>
        </div>
      </div>
    )
  }

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${N.border}`, background: '#fff', color: N.text, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color .12s' }
  const focusOn = e => e.target.style.borderColor = N.accent
  const focusOff = e => e.target.style.borderColor = N.border
  const chip = { display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: N.iconBg, color: N.sub, border: `1px solid ${N.border}`, whiteSpace: 'nowrap' }
  const sectionLabel = { fontSize: 10, fontWeight: 700, color: N.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }

  return (
    <div className="page-wrap" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Deny modal */}
      {denyModal && (
        <div onClick={() => { setDenyModal(null); setDenyNote('') }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: STATUS.denied.bg, border: `1px solid ${STATUS.denied.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <XCircle size={18} color={STATUS.denied.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: N.text }}>Deny demo request</div>
                <div style={{ fontSize: 13, color: N.muted, marginTop: 3 }}>{denyModal.full_name} · {denyModal.email}</div>
              </div>
              <button onClick={() => { setDenyModal(null); setDenyNote('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: N.muted }}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: N.sub, marginBottom: 6, display: 'block' }}>Internal note (optional)</label>
                <textarea value={denyNote} onChange={e => setDenyNote(e.target.value)} placeholder="Reason for denial, follow-up notes..." rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} onFocus={focusOn} onBlur={focusOff} />
                <div style={{ fontSize: 11, color: N.muted, marginTop: 6 }}>The requester gets a polite decline email. This note stays internal.</div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => { setDenyModal(null); setDenyNote('') }}>Cancel</button>
                <button onClick={() => handleDeny(denyModal)} disabled={acting === denyModal.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: STATUS.denied.color, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: acting === denyModal.id ? 0.6 : 1 }}>
                  <X size={14} strokeWidth={2.5} /> {acting === denyModal.id ? 'Denying...' : 'Deny request'}
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

      {/* Stats — matches Training */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total requests', value: requests.length, Icon: Inbox },
          { label: 'Pending review', value: counts.pending,  Icon: Clock },
          { label: 'Approved',       value: counts.approved, Icon: CheckCircle2 },
          { label: 'Denied',         value: counts.denied,   Icon: XCircle },
        ].map(s => (
          <div key={s.label} className="card">
            <div style={{ width: 36, height: 36, borderRadius: 9, background: N.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <s.Icon size={16} color={N.accent} strokeWidth={2} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: N.text, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: N.muted, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4, background: N.soft, borderRadius: 10, padding: 4, border: `1px solid ${N.border}`, width: 'fit-content' }}>
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
              color: filter === t.id ? N.accent : N.sub,
              boxShadow: filter === t.id ? '0 1px 4px rgba(139,92,246,0.12)' : 'none',
              transition: 'all .12s'
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} color={N.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, company, email..."
            style={{ ...inputStyle, paddingLeft: 32 }} onFocus={focusOn} onBlur={focusOff} />
        </div>
      </div>

      {/* Requests list */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', color: N.muted, padding: 40 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Inbox size={40} color={N.accentBorder} strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: N.sub, marginBottom: 4 }}>
            {q ? 'No matching requests' : `No ${filter === 'all' ? '' : filter + ' '}requests`}
          </div>
          <div style={{ fontSize: 13, color: N.muted }}>{q ? 'Try a different search.' : 'Demo requests will appear here when submitted.'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(r => {
            const st = STATUS[r.status] || { label: r.status, color: N.sub, bg: N.soft, border: N.border }
            const needs = splitList(r.compliance_needs)
            const avail = splitList(r.availability)
            const busy = acting === r.id

            return (
              <div key={r.id} className="card" style={{ opacity: busy ? 0.7 : 1 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: N.iconBg, border: `1px solid ${N.border}`, color: N.icon, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                    {initials(r.full_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: N.text }}>{r.full_name}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color }} />
                        {st.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: N.sub, marginTop: 3, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Building2 size={12} /> {r.company || '—'}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Mail size={12} /> {r.email}</span>
                      <span style={{ color: N.muted }}>
                        {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => setDenyModal(r)} disabled={busy}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1px solid ${N.border}`, background: '#fff', color: N.sub, fontSize: 13, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s' }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = STATUS.denied.border; e.currentTarget.style.color = STATUS.denied.color }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = N.border; e.currentTarget.style.color = N.sub }}>
                          <X size={14} strokeWidth={2.5} /> Deny
                        </button>
                        <button onClick={() => handleApprove(r)} disabled={busy}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 8px rgba(124,58,237,0.25)' }}>
                          <Check size={14} strokeWidth={2.5} /> {busy ? 'Approving...' : 'Approve'}
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: STATUS.approved.color, fontWeight: 600 }}>
                        <ShieldCheck size={15} /> Account created
                      </span>
                    )}
                    {r.status === 'denied' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: N.sub, fontWeight: 600 }}>
                        <XCircle size={15} color={STATUS.denied.color} /> Declined
                      </span>
                    )}
                    <RowMenu items={[
                      { icon: Mail, label: 'Email requester', fn: () => { window.location.href = `mailto:${r.email}?subject=${encodeURIComponent('Your ResponseOS demo')}` } },
                      { icon: Copy, label: 'Copy email',      fn: () => copyEmail(r.email) },
                    ]} />
                  </div>
                </div>

                {/* Details */}
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F3F4F6', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Industry',  Icon: Briefcase, value: r.industry },
                    { label: 'Team size', Icon: Users,     value: r.team_size },
                    { label: 'Timezone',  Icon: Globe2,    value: r.timezone },
                  ].map(d => (
                    <div key={d.label}>
                      <div style={sectionLabel}>{d.label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: d.value ? N.text : N.muted }}>
                        <d.Icon size={13} color={N.muted} /> {d.value || '—'}
                      </div>
                    </div>
                  ))}
                </div>

                {(needs.length > 0 || avail.length > 0) && (
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                    {needs.length > 0 && (
                      <div>
                        <div style={sectionLabel}>Compliance needs</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {needs.map(n => <span key={n} style={chip}>{n}</span>)}
                        </div>
                      </div>
                    )}
                    {avail.length > 0 && (
                      <div>
                        <div style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={11} /> Availability</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {avail.map(a => <span key={a} style={chip}>{a}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {r.notes && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: N.sub, background: N.soft, border: `1px solid ${N.border}`, borderRadius: 8, padding: '8px 12px' }}>
                    <StickyNote size={13} color={N.muted} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span><strong style={{ color: '#374151' }}>Internal note:</strong> {r.notes}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}