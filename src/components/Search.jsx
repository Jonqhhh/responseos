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
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
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
      supabase.from('certifications')
        .select('id, cert_name, issuing_body, status, users(full_name)')
        .or(`cert_name.ilike.${term},issuing_body.ilike.${term}`)
        .limit(4),
      supabase.from('tasks')
        .select('id, title, status, type, users!tasks_assigned_to_fkey(full_name)')
        .or(`title.ilike.${term},type.ilike.${term}`)
        .limit(4),
      supabase.from('users')
        .select('id, full_name, email, role, department')
        .or(`full_name.ilike.${term},email.ilike.${term},department.ilike.${term}`)
        .limit(4),
      supabase.from('alerts')
        .select('id, message, tier')
        .ilike('message', term)
        .limit(3),
    ])

    const combined = [
      ...(certsRes.data || []).map(c => ({
        id: c.id, type: 'cert', icon: '◈',
        title: c.cert_name,
        sub: `${c.users?.full_name} · ${c.issuing_body}`,
        status: c.status,
        route: '/certs'
      })),
      ...(tasksRes.data || []).map(t => ({
        id: t.id, type: 'task', icon: '◎',
        title: t.title,
        sub: `${t.users?.full_name} · ${t.type}`,
        status: t.status,
        route: '/tasks'
      })),
      ...(usersRes.data || []).map(u => ({
        id: u.id, type: 'user', icon: '◉',
        title: u.full_name,
        sub: `${u.email} · ${u.role}`,
        status: u.role,
        route: '/users'
      })),
      ...(alertsRes.data || []).map(a => ({
        id: a.id, type: 'alert', icon: '△',
        title: a.message,
        sub: a.tier,
        status: a.tier,
        route: '/alerts'
      })),
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
    valid: 'var(--green)', expiring: 'var(--amber)', expired: 'var(--red)',
    overdue: 'var(--red)', in_progress: 'var(--amber)', complete: 'var(--green)',
    scheduled: 'var(--blue)', critical: 'var(--red)', warning: 'var(--amber)',
    info: 'var(--blue)', admin: '#93C5FD', supervisor: '#6EE7B7',
    employee: 'var(--text2)', auditor: '#FCD34D'
  }

  const typeLabel = { cert: 'Certification', task: 'Task', user: 'User', alert: 'Alert' }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: 280 }}>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text3)', fontSize: 14, pointerEvents: 'none'
        }}>⌕</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder="Search certs, tasks, users..."
          style={{
            width: '100%', padding: '8px 12px 8px 30px',
            borderRadius: 'var(--radius)', border: '0.5px solid var(--border2)',
            background: 'var(--surface2)', color: 'var(--text)',
            fontSize: 13, fontFamily: 'var(--font)', outline: 'none'
          }}
        />
        {loading && (
          <span style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text3)', fontSize: 11
          }}>...</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', marginTop: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 999,
          overflow: 'hidden', maxHeight: 400, overflowY: 'auto'
        }}>
          {['cert', 'task', 'user', 'alert'].map(type => {
            const group = results.filter(r => r.type === type)
            if (!group.length) return null
            return (
              <div key={type}>
                <div style={{
                  padding: '8px 12px 4px', fontSize: 10, fontWeight: 600,
                  color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em',
                  background: 'var(--surface2)'
                }}>
                  {typeLabel[type]}s
                </div>
                {group.map(r => (
                  <div key={r.id}
                    onClick={() => handleSelect(r)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', cursor: 'pointer',
                      borderBottom: '0.5px solid var(--border)',
                      transition: 'background .1s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 16, color: 'var(--text3)', width: 20, textAlign: 'center', flexShrink: 0 }}>
                      {r.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, color: 'var(--text)', fontWeight: 500,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {r.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                        {r.sub}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 500, padding: '2px 6px',
                      borderRadius: 99, background: 'var(--surface3)',
                      color: statusColor[r.status] || 'var(--text3)',
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
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', marginTop: 4,
          padding: '16px 12px', textAlign: 'center',
          fontSize: 13, color: 'var(--text3)', zIndex: 999
        }}>
          No results for "{query}"
        </div>
      )}
    </div>
  )
}