import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM    = 'ResponseOS <noreply@responseos.net>'
const APP_URL = 'https://responseos.net'
const SUPER_EMAILS = ['jlane@responseos.net', 'hseals@responseos.net']

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const validEmail = (e?: string | null) => !!e && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && !/@example\.(com|org|net)$/i.test(e)

function fmtDate(d: string, long = true) {
  return new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', long
    ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
    : { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}
function fmtTime(t?: string | null) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function shell(heading: string, intro: string, rows: [string, string][], extra = '', cta = true) {
  const rowHtml = rows.filter(([, v]) => v).map(([k, v]) => `
    <tr>
      <td style="padding:8px 0;color:#6B7280;font-size:13px;width:130px;vertical-align:top">${esc(k)}</td>
      <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600">${v}</td>
    </tr>`).join('')
  return `<!doctype html><html><body style="margin:0;background:#F5F3FF;font-family:Inter,Segoe UI,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E5E7EB">
      <tr><td style="background:#13082A;padding:18px 24px;color:#fff;font-size:18px;font-weight:800;letter-spacing:-.01em">ResponseOS</td></tr>
      <tr><td style="height:3px;background:#7C3AED;line-height:3px;font-size:0">&nbsp;</td></tr>
      <tr><td style="padding:26px 24px 8px">
        <div style="font-size:20px;font-weight:800;color:#111827;margin-bottom:8px">${esc(heading)}</div>
        <div style="font-size:14px;color:#4B5563;line-height:1.6">${intro}</div>
      </td></tr>
      <tr><td style="padding:8px 24px"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #F3F4F6">${rowHtml}</table></td></tr>
      ${extra ? `<tr><td style="padding:8px 24px">${extra}</td></tr>` : ''}
      ${cta ? `<tr><td style="padding:16px 24px 26px">
        <a href="${APP_URL}/tasks" style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 20px;border-radius:9px">View in ResponseOS</a>
      </td></tr>` : ''}
      <tr><td style="padding:14px 24px;background:#F9FAFB;color:#9CA3AF;font-size:12px">Sent automatically by ResponseOS · responseos.net</td></tr>
    </table>
  </td></tr></table></body></html>`
}

async function send(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const db = createClient(SUPABASE_URL, SERVICE_KEY)

    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    const { data: { user: caller } } = await db.auth.getUser(token)
    if (!caller) return json({ error: 'Not signed in' }, 401)
    const { data: me } = await db.from('users').select('id, full_name, email, role, is_demo').eq('id', caller.id).single()
    const isMgr = ['admin', 'supervisor'].includes(String(me?.role || '').toLowerCase())
      || SUPER_EMAILS.includes(String(caller.email || '').toLowerCase())
    if (!isMgr) return json({ error: 'Not allowed' }, 403)

    // action: 'scheduled' | 'cancelled' | 'removed'   user_ids: optional subset of members to email
    const { assignment_id, action = 'scheduled', user_ids } = await req.json()
    if (!assignment_id) return json({ error: 'assignment_id required' }, 400)

    const { data: a } = await db.from('training_assignments')
      .select('*, training_assignment_members(user_id, status)')
      .eq('id', assignment_id).single()
    if (!a) return json({ error: 'Assignment not found' }, 404)
    if ((a.is_demo === true) !== (me?.is_demo === true)) return json({ error: 'Not allowed' }, 403)

    const memberIds: string[] = (a.training_assignment_members || []).map((m: any) => m.user_id)
    const targetIds = Array.isArray(user_ids) && user_ids.length
      ? memberIds.filter(id => user_ids.includes(id))
      : memberIds
    const subset = targetIds.length !== memberIds.length

    const { data: people } = memberIds.length
      ? await db.from('users').select('id, full_name, email').in('id', memberIds)
      : { data: [] as any[] }
    const targets = (people || []).filter((p: any) => targetIds.includes(p.id))
    const targetNames = targets.map((p: any) => p.full_name || p.email).join(', ')

    const when = `${fmtDate(a.scheduled_date)}${a.start_time ? ` at ${fmtTime(a.start_time)}` : ''}`
    const short = fmtDate(a.scheduled_date, false)
    const detailRows: [string, string][] = [
      ['Session', esc(a.title)],
      ['When', esc(when)],
      ['Location', esc(a.location || 'To be announced')],
      ['Renews', esc(a.related_cert_name || '')],
    ]

    const sentTo: string[] = []
    const errors: string[] = []

    // 1) Employees (real accounts only)
    if (!a.is_demo) {
      for (const p of targets) {
        if (!validEmail(p.email)) continue
        const first = esc(String(p.full_name || '').split(' ')[0] || 'there')
        let subject = '', html = ''
        if (action === 'cancelled') {
          subject = `Cancelled: ${a.title} (${short})`
          html = shell('Training cancelled', `Hi ${first}, the session below has been <strong>cancelled</strong>. No action is needed.`, detailRows, '', false)
        } else if (action === 'removed') {
          subject = `Update: you're no longer scheduled for ${a.title}`
          html = shell("You're no longer scheduled", `Hi ${first}, you've been removed from the session below. No action is needed.`, detailRows, '', false)
        } else {
          subject = `Training scheduled: ${a.title} — ${short}`
          html = shell("You're scheduled for training", `Hi ${first}, you've been assigned to the session below${a.related_cert_name ? ` to renew your <strong>${esc(a.related_cert_name)}</strong> certification` : ''}. Please plan to attend.`, detailRows)
        }
        try { await send(p.email, subject, html); sentTo.push(p.email) } catch (e) { errors.push(String(e)) }
      }
      if (action === 'scheduled' && sentTo.length && targetIds.length) {
        await db.from('training_assignment_members')
          .update({ notified_at: new Date().toISOString() })
          .eq('assignment_id', a.id)
          .in('user_id', targetIds)
      }
    }

    // 2) Admin copy to whoever made the change
    if (validEmail(me?.email)) {
      const list = (people || []).map((p: any) => `<li style="margin:2px 0">${esc(p.full_name || p.email)}</li>`).join('')
      const extra = list && action !== 'cancelled'
        ? `<div style="font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;margin:6px 0">Assigned (${(people || []).length})</div><ul style="margin:0;padding-left:18px;color:#111827;font-size:14px">${list}</ul>`
        : ''
      const demoNote = a.is_demo ? ' (Demo account — employees were not emailed.)' : ''
      let heading = '', intro = '', subject = ''
      if (action === 'cancelled') {
        heading = 'Session cancelled'; intro = `You cancelled this session. Assigned employees were notified.${demoNote}`
        subject = `Cancelled: ${a.title} (${short})`
      } else if (action === 'removed') {
        heading = 'Employee removed'; intro = `<strong>${esc(targetNames)}</strong> was removed from this session and notified.${demoNote}`
        subject = `Removed ${targetNames} · ${a.title}`
      } else if (subset) {
        heading = 'Employee added'; intro = `<strong>${esc(targetNames)}</strong> was added to this session and emailed.${demoNote}`
        subject = `Added ${targetNames} · ${a.title} (${short})`
      } else {
        heading = 'Session scheduled'; intro = `Your session is on the calendar. Each assigned employee was emailed.${demoNote}`
        subject = `Scheduled: ${a.title} · ${(people || []).length} assigned`
      }
      try { await send(me!.email, subject, shell(heading, intro, detailRows, extra)); sentTo.push(me!.email) } catch (e) { errors.push(String(e)) }
    }

    return json({ sent: sentTo.length, errors })
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500)
  }
})