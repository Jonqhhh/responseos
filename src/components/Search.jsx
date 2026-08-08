import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  async function doSearch(q) {
    setLoading(true)
    const term = `%${q}%`
    const [certsRes, tasksRes, usersRes, alertsRes] = await Promise.all([
      supabase.from('certifications').select('id, cert_name, issuing_body, status, users(full_name)').or(`cert_name.ilike.${term},issuing_body.ilike.${term}`).limit(4),
      supabase.from('tasks').select('id, title, status, type, users!tasks_assigned_to_fkey(full_name)').or(`title.ilike.${term},type.ilike.${term}`).limit(4),
      supabase.from('users').select('id, full_name, email, role, department').or(`full_name.ilike.${term},email.ilike.${term},department.ilike.${term}`).limit(4),
      supabase.from('alerts').select('id, message, tier').ilike('message', term).limit(3),
    ])

    const combined = [
      ...(certsRes.data || []).map(c => ({ id: c.id, type: 'cert', icon: '◈', title: c.cert_name, sub: `${c.users?.full_name} · ${c.issuing_body}`, status: c.status, route: '/certs' })),
      ...(tasksRes.data || []).map(t => ({ id: t.id, type: 'task', icon: '◎', title: t.title, sub: `${t.users?.full_name} · ${t.type}`, status: t.status, route: '/tasks' })),
      ...(usersRes.data || []).map(u => ({ id: u.id, type: 'user', icon: '◉', title: u.full_name, sub: `${u.email} · ${u.role}`, status: u.role, route: '/users' })),
      ...(alertsRes.data || []).map(a => ({ id: a.id, type: 'alert', icon: '△', title: a.message, sub: a.tier, status: a.tier, route: '/alerts' })),
    ]

    setResults(combined)
    setLoading(false)
    setOpen(true)
  }

  function handleSelect(result) {
    navigate(result.route)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const statusColor = {
    valid: '#059669', expiring: '#D97706', expired: '#DC2626',
    overdue: '#DC2626', in_progress: '#D97706', complete: '#059669',
    scheduled: '#6B4EFF', critical: '#DC2626', warning: '#D97706',
    info: '#6B4EFF', admin: '#6B4EFF', supervisor: '#059669',
    employee: '#6B7280', auditor: '#D97706'
  }

  const typeLabel = { cert: 'Certification', task: 'Task', user: 'User', alert: 'Alert' }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: 280 }}>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: '#9CA3AF', fontSize: 15, pointerEvents: 'none'
        }}>⌕</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder="Search anything..."
          style={{
            width: '100%', padding: '8px 12px 8px 34px',
            borderRadius: '8px', border: '1px solid #E4E6EF',
            background: '#F8F9FC', color: '#0F1117',
            fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none',
            transition: 'all .12s', boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}
          onFocus={e => { e.target.style.borderColor = '#6B4EFF'; e.target.style.background = '#fff'; query && setOpen(true) }}
          onBlur={e => { e.target.style.borderColor = '#E4E6EF'; e.target.style.background = '#F8F9FC' }}
        />
        {loading && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: 11 }}>...</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid #E4E6EF',
          borderRadius: '10px', marginTop: 6,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 999,
          overflow: 'hidden', maxHeight: 400, overflowY: 'auto'
        }}>
          {['cert', 'task', 'user', 'alert'].map(type => {
            const group = results.filter(r => r.type === type)
            if (!group.length) return null
            return (
              <div key={type}>
                <div style={{
                  padding: '8px 14px 4px', fontSize: 10, fontWeight: 700,
                  color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em',
                  background: '#F8F9FC', borderBottom: '1px solid #E4E6EF'
                }}>
                  {typeLabel[type]}s
                </div>
                {group.map(r => (
                  <div key={r.id} onClick={() => handleSelect(r)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: '1px solid #F3F4F8', transition: 'background .1s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#F8F9FC'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 16, color: '#9CA3AF', width: 20, textAlign: 'center', flexShrink: 0 }}>
                      {r.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#0F1117', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, fontWeight: 500 }}>{r.sub}</div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 99, background: '#F3F4F8',
                      color: statusColor[r.status] || '#9CA3AF',
                      flexShrink: 0, whiteSpace: 'nowrap'
                    }}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {open && query && !loading && results.length === 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid #E4E6EF',
          borderRadius: '10px', marginTop: 6, padding: '20px 14px',
          textAlign: 'center', fontSize: 13, color: '#9CA3AF',
          fontWeight: 500, zIndex: 999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}>
          No results for "{query}"
        </div>
      )}
    </div>
  )
}
