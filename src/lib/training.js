import { supabase } from './supabase'

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/training-notify`

// Auto-schedule window
export const MIN_DAYS_OUT = 7
export const MAX_DAYS_OUT = 45
export const LEAD_DAYS    = 14
export const DEFAULT_TIME = '09:00'

export function todayStr() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}
export function toDateStr(d) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}
export function daysBetween(dateStr) {
  return Math.round((new Date(String(dateStr).slice(0, 10) + 'T00:00:00') - new Date(todayStr() + 'T00:00:00')) / 86400000)
}
export function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
export function prettyDate(str) {
  return new Date(String(str).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
export function norm(s) { return String(s || '').trim().toLowerCase() }

export function guessCategory(name) {
  const n = norm(name)
  if (/cpr|aed|first aid|ems|emt|medic|trauma|bls|bloodborne/.test(n)) return 'medical'
  if (/hazmat|hazwoper|chemical|spill|decon|erg/.test(n)) return 'hazmat'
  if (/confined|rope|rescue|angle|trench|extrication|fall/.test(n)) return 'rescue'
  return 'fire'
}

// ~2 weeks before expiry, clamped to 7–45 days out, weekdays only
export function autoRenewalDate(soonestDays) {
  const offset = Math.max(MIN_DAYS_OUT, Math.min(MAX_DAYS_OUT, soonestDays - LEAD_DAYS))
  const d = new Date(todayStr() + 'T00:00:00')
  d.setDate(d.getDate() + offset)
  const dow = d.getDay()
  if (dow === 6 || dow === 0) {
    const toMonday = dow === 6 ? 2 : 1
    const toFriday = dow === 6 ? -1 : -2
    d.setDate(d.getDate() + (offset + toMonday <= MAX_DAYS_OUT ? toMonday : toFriday))
  }
  return toDateStr(d)
}

// ---------- Renewal lookups ----------

export function scheduledRenewalKeys(assignments) {
  const keys = new Set()
  ;(assignments || []).filter(a => a.status === 'scheduled').forEach(a => {
    const cert = norm(a.related_cert_name)
    if (!cert) return
    ;(a.training_assignment_members || []).forEach(m => {
      if (m.status === 'pending') keys.add(`${m.user_id}|${cert}`)
    })
  })
  return keys
}
export function hasRenewal(keys, cert) {
  return keys.has(`${cert.user_id}|${norm(cert.cert_name)}`)
}

export function renewalFor(assignments, cert) {
  const cn = norm(cert.cert_name)
  for (const a of assignments || []) {
    if (a.status !== 'scheduled' || norm(a.related_cert_name) !== cn) continue
    if ((a.training_assignment_members || []).some(m => m.user_id === cert.user_id && m.status === 'pending')) return a
  }
  return null
}

export function joinableSession(assignments, certName) {
  const cn = norm(certName)
  const today = todayStr()
  return (assignments || [])
    .filter(a => a.status === 'scheduled' && norm(a.related_cert_name) === cn
      && a.scheduled_date > today && daysBetween(a.scheduled_date) <= MAX_DAYS_OUT)
    .sort((x, y) => x.scheduled_date.localeCompare(y.scheduled_date))[0] || null
}

export function buildRenewalGroups(certs, keys) {
  return Object.values(
    (certs || []).filter(c => c.user_id && !hasRenewal(keys, c)).reduce((acc, c) => {
      const k = norm(c.cert_name)
      if (!acc[k]) acc[k] = { key: k, cert_name: c.cert_name, certs: [] }
      acc[k].certs.push(c)
      return acc
    }, {})
  )
    .map(g => ({
      ...g,
      soonest: Math.min(...g.certs.map(c => c.expiry_date ? daysBetween(c.expiry_date) : 0)),
      anyExpired: g.certs.some(c => c.status === 'expired' || (c.expiry_date && daysBetween(c.expiry_date) < 0)),
      people: new Set(g.certs.map(c => c.user_id)).size,
    }))
    .sort((a, b) => a.soonest - b.soonest)
}

// ---------- Email ----------

export async function notifyAssignment(assignmentId, action = 'scheduled', userIds = null) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ assignment_id: assignmentId, action, user_ids: userIds }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { sent: 0, error: data.error || `Email failed (${res.status})` }
    return data
  } catch (e) {
    return { sent: 0, error: e.message }
  }
}

async function audit(user, action, recordId, after) {
  await supabase.from('audit_logs').insert({
    actor_id: user?.id, action, table_name: 'training_assignments', record_id: recordId, after_state: after,
  })
}

// ---------- Create / remove ----------

export async function createAssignment(user, payload, memberIds) {
  const isDemo = user?.is_demo === true
  const ids = [...new Set((memberIds || []).filter(Boolean))]
  if (!ids.length) throw new Error('No one to assign.')

  const { data: created, error } = await supabase.from('training_assignments')
    .insert({ ...payload, created_by: user?.id, is_demo: isDemo })
    .select().single()
  if (error) throw new Error(error.message)

  const { error: mErr } = await supabase.from('training_assignment_members').insert(
    ids.map(uid => ({ assignment_id: created.id, user_id: uid, is_demo: isDemo }))
  )
  if (mErr) {
    await supabase.from('training_assignments').delete().eq('id', created.id)
    throw new Error(mErr.message)
  }

  await audit(user, 'training_scheduled', created.id, {
    title: payload.title, date: payload.scheduled_date, assigned: ids.length, renews: payload.related_cert_name || null,
  })

  const mail = await notifyAssignment(created.id, 'scheduled')
  return { created, people: ids.length, emailed: mail.sent || 0, emailError: mail.error || null }
}

// Checkbox ON
export async function checkRenewal(user, cert, assignments) {
  if (!cert.user_id) throw new Error('This certification has no employee linked.')
  const isDemo = user?.is_demo === true
  const existing = joinableSession(assignments, cert.cert_name)

  if (existing) {
    const already = (existing.training_assignment_members || []).some(m => m.user_id === cert.user_id)
    const { error } = already
      ? await supabase.from('training_assignment_members')
          .update({ status: 'pending', completed_at: null, completed_by: null })
          .eq('assignment_id', existing.id).eq('user_id', cert.user_id)
      : await supabase.from('training_assignment_members')
          .insert({ assignment_id: existing.id, user_id: cert.user_id, is_demo: isDemo })
    if (error) throw new Error(error.message)

    await audit(user, 'training_member_added', existing.id, { user_id: cert.user_id, renews: cert.cert_name })
    const mail = await notifyAssignment(existing.id, 'scheduled', [cert.user_id])
    return { assignment: existing, date: existing.scheduled_date, start_time: existing.start_time, joined: true, emailed: mail.sent || 0, emailError: mail.error || null }
  }

  const days = cert.expiry_date ? daysBetween(cert.expiry_date) : 0
  const r = await createAssignment(user, {
    title: `${cert.cert_name} renewal`,
    category: guessCategory(cert.cert_name),
    topic: null,
    description: 'Auto-scheduled renewal.',
    scheduled_date: autoRenewalDate(days),
    start_time: DEFAULT_TIME,
    end_time: null,
    location: null,
    instructor_id: null,
    related_cert_name: cert.cert_name,
  }, [cert.user_id])
  return { assignment: r.created, date: r.created.scheduled_date, start_time: r.created.start_time, joined: false, emailed: r.emailed, emailError: r.emailError }
}

// Checkbox OFF
export async function uncheckRenewal(user, cert, assignments) {
  const a = renewalFor(assignments, cert)
  if (!a) return { removed: false }

  const mail = await notifyAssignment(a.id, 'removed', [cert.user_id])
  const others = (a.training_assignment_members || []).filter(m => m.user_id !== cert.user_id)

  const { error } = await supabase.from('training_assignment_members')
    .delete().eq('assignment_id', a.id).eq('user_id', cert.user_id)
  if (error) throw new Error(error.message)

  if (others.length === 0) {
    await supabase.from('training_assignments').delete().eq('id', a.id)
  }
  await audit(user, 'training_member_removed', a.id, { user_id: cert.user_id, renews: cert.cert_name, session_removed: others.length === 0 })
  return { removed: true, emailed: mail.sent || 0, emailError: mail.error || null }
}

// Older helpers (used by Dashboard until it's updated)
export async function scheduleRenewal(user, group) {
  const date = autoRenewalDate(group.soonest)
  const res = await createAssignment(user, {
    title: `${group.cert_name} renewal`, category: guessCategory(group.cert_name), topic: null,
    description: 'Auto-scheduled renewal.', scheduled_date: date, start_time: DEFAULT_TIME, end_time: null,
    location: null, instructor_id: null, related_cert_name: group.cert_name,
  }, group.certs.map(c => c.user_id))
  return { ...res, date, cert: group.cert_name }
}
export async function undoAssignments(ids) {
  for (const id of ids) await notifyAssignment(id, 'cancelled')
  await supabase.from('training_assignment_members').delete().in('assignment_id', ids)
  const { error } = await supabase.from('training_assignments').delete().in('id', ids)
  if (error) throw new Error(error.message)
}