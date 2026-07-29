import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { acknowledgeAlert } from '../lib/supabase'

export default function NotificationBell() {
  const [alerts, setAlerts] = useState([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadAlerts()

    // realtime subscription
    const channel = supabase
      .channel('alerts-bell')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => loadAlerts()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadAlerts() {
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(10)
    setAlerts(data || [])
  }

  async function handleAcknowledge(e, id) {
    e.stopPropagation()
    await acknowledgeAlert(id)
    loadAlerts()
  }

  function handleViewAll() {
    navigate('/alerts')
    setOpen(false)
  }

  const unread = alerts.length
  const tierColor = { critical: 'var(--red)', warning: 'var(--amber)', info: 'var(--blue)' }
  const tierBg    = { critical: 'var(--red-dim)', warning: 'var(--amber-dim)', info: 'var(--blue-dim)' }
  const tierIcon  = { critical: '▲', warning: '●', info: 'ℹ' }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative', width: 36, height: 36,
          borderRadius: 'var(--radius)', border: '0.5px solid var(--border)',
          background: open ? 'var(--surface2)' : 'transparent',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 17, color: unread > 0 ? 'var(--text)' : 'var(--text3)',
          transition: 'all .12s'
        }}
      >
        △
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--red)', color: '#fff',
            fontSize: 9, fontWeight: 700,
            width: 16, height: 16, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid var(--bg)'
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0,
          width: 340, marginTop: 6,
          background: 'var(--surface)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 999, overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderBottom: '0.5px solid var(--border)',
            background: 'var(--surface2)'
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
              Notifications
            </span>
            {unread > 0 && (
              <span style={{
                padding: '2px 8px', borderRadius: 99, fontSize: 11,
                background: 'var(--red-dim)', color: '#FCA5A5', fontWeight: 500
              }}>
                {unread} unread
              </span>
            )}
          </div>

          {/* Alert list */}
          {alerts.length === 0 ? (
            <div style={{
              padding: '24px 16px', textAlign: 'center',
              fontSize: 13, color: 'var(--text3)'
            }}>
              All caught up — no unread alerts.
            </div>
          ) : (
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {alerts.map(a => (
                <div key={a.id} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '12px 16px',
                  borderBottom: '0.5px solid var(--border)',
                  transition: 'background .1s'
                }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: tierBg[a.tier], color: tierColor[a.tier],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, marginTop: 1
                  }}>
                    {tierIcon[a.tier]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, color: 'var(--text)', lineHeight: 1.5,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                    }}>
                      {a.message}
                    </div>
                    <div style={{
                      fontSize: 11, color: 'var(--text3)',
                      fontFamily: 'var(--mono)', marginTop: 3
                    }}>
                      {a.tier.toUpperCase()} · {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleAcknowledge(e, a.id)}
                    style={{
                      padding: '3px 8px', borderRadius: 4, flexShrink: 0,
                      border: '0.5px solid var(--border2)',
                      background: 'transparent', color: 'var(--text3)',
                      fontSize: 11, cursor: 'pointer', marginTop: 2
                    }}>
                    ✓
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: '10px 16px',
            borderTop: '0.5px solid var(--border)',
            background: 'var(--surface2)'
          }}>
            <button
              onClick={handleViewAll}
              style={{
                width: '100%', padding: '7px',
                borderRadius: 'var(--radius)', border: 'none',
                background: 'transparent', color: 'var(--blue)',
                fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)'
              }}>
              View all alerts →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}