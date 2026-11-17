import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const FROM      = 'ResponseOS <noreply@responseos.net>'
const NOTIFY_TO = ['jonahtandf@gmail.com', 'hseals@responseos.net']
const APP_URL   = 'https://responseos.net'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const clean = (s: unknown, max = 500) => String(s ?? '').trim().slice(0, max)
const validEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)

function shell(heading: string, intro: string, rows: [string, string][] = [], cta?: { href: string; label: string }) {
  const rowHtml = rows.filter(([, v]) => v).map(([k, v]) => `
    <tr>
      <td style="padding:8px 0;color:#6B7280;font-size:13px;width:150px;vertical-align:top">${esc(k)}</td>
      <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600">${esc(v)}</td>
    </tr>`).join('')
  return `<!doctype html><html><body style="margin:0;background:#F5F3FF;font-family:Inter,Segoe UI,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E5E7EB">
      <tr><td style="background:#13082A;padding:18px 24px;color:#fff;font-size:18px;font-weight:800">ResponseOS</td></tr>
      <tr><td style="height:3px;background:#7C3AED;line-height:3px;font-size:0">&nbsp;</td></tr>
      <tr><td style="padding:26px 24px 8px">
        <div style="font-size:20px;font-weight:800;color:#111827;margin-bottom:8px">${esc(heading)}</div>
        <div style="font-size:14px;color:#4B5563;line-height:1.6">${intro}</div>
      </td></tr>
      ${rowHtml ? `<tr><td style="padding:8px 24px"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #F3F4F6">${rowHtml}</table></td></tr>` : ''}
      ${cta ? `<tr><td style="padding:16px 24px 26px"><a href="${cta.href}" style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 20px;border-radius:9px">${esc(cta.label)}</a></td></tr>` : '<tr><td style="padding:8px"></td></tr>'}
      <tr><td style="padding:14px 24px;background:#F9FAFB;color:#9CA3AF;font-size:12px">ResponseOS · Houston, TX · responseos.net</td></tr>
    </table>
  </td></tr></table></body></html>`
}

async function send(to: string[], subject: string, html: string, replyTo?: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
}

// Turn any extra form fields into readable rows for the admin email
const SKIP = new Set(['type', 'message'])
function extraRows(body: Record<string, unknown>, known: string[]): [string, string][] {
  return Object.entries(body)
    .filter(([k, v]) => !SKIP.has(k) && !known.includes(k) && v !== null && v !== '' && typeof v !== 'object')
    .map(([k, v]) => [k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), clean(v)])
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const db = createClient(SUPABASE_URL, SERVICE_KEY)
    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    const type = clean(body.type, 40).toUpperCase() || 'QUOTE REQUEST'

    const full_name = clean(body.full_name, 120)
    const email     = clean(body.email, 200).toLowerCase()
    const company   = clean(body.company, 200)
    if (!validEmail(email)) return json({ error: 'A valid email is required.' }, 400)

    // ---------- Denial email (triggered from Admin Panel) ----------
    if (type === 'DENIAL') {
      const { data: denied } = await db.from('demo_requests')
        .select('id').eq('email', email).eq('status', 'denied').limit(1)
      if (!denied?.length) return json({ error: 'No denied request for this email.' }, 403)

      const first = esc(full_name.split(' ')[0] || 'there')
      await send([email], 'Your ResponseOS demo request',
        shell('Thanks for your interest',
          `Hi ${first}, thank you for requesting a ResponseOS demo${company ? ` for <strong>${esc(company)}</strong>` : ''}. We're not able to schedule a demo right now, but we'd be glad to stay in touch as we expand. If your needs change, just reply to this email.`))
      return json({ ok: true })
    }

    // ---------- Shared fields ----------
    const industry         = clean(body.industry, 120)
    const team_size        = clean(body.team_size, 60)
    const compliance_needs = clean(body.compliance_needs, 500)
    const availability     = clean(body.availability, 500)
    const timezone         = clean(body.timezone, 60)
    if (!full_name || !company) return json({ error: 'Name and company are required.' }, 400)

    const known = ['full_name', 'email', 'company', 'industry', 'team_size', 'compliance_needs', 'availability', 'timezone']
    const baseRows: [string, string][] = [
      ['Name', full_name], ['Email', email], ['Company', company],
      ['Industry', industry], ['Team size', team_size],
      ['Compliance needs', compliance_needs], ['Availability', availability], ['Timezone', timezone],
      ...extraRows(body, known),
    ]

    // ---------- Demo request ----------
    if (type === 'DEMO REQUEST') {
      const { error } = await db.from('demo_requests').insert({
        full_name, email, company, industry, team_size, compliance_needs, availability, timezone, status: 'pending',
      })
      if (error) return json({ error: error.message }, 500)

      const errors: string[] = []
      try {
        await send(NOTIFY_TO, `New demo request: ${full_name} · ${company}`,
          shell('New demo request', 'Review and approve or deny it in the Admin Panel.', baseRows, { href: `${APP_URL}/admin`, label: 'Open Admin Panel' }),
          email)
      } catch (e) { errors.push(String(e)) }
      try {
        await send([email], "We got your ResponseOS demo request",
          shell('Request received', `Hi ${esc(full_name.split(' ')[0])}, thanks for your interest in ResponseOS. We'll review your request and reach out within 24 hours to schedule your demo.`))
      } catch (e) { errors.push(String(e)) }

      return json({ ok: true, errors })
    }

    // ---------- Quote request (or anything else) ----------
    const message = clean(body.message, 4000)
    const rows: [string, string][] = [...baseRows, ...(message ? [['Message', message] as [string, string]] : [])]
    const errors: string[] = []
    try {
      await send(NOTIFY_TO, `New ${type.toLowerCase()}: ${full_name} · ${company}`,
        shell(`New ${type.toLowerCase()}`, 'Reply to this email to respond directly to the requester.', rows),
        email)
    } catch (e) { errors.push(String(e)) }
    try {
      await send([email], 'We got your ResponseOS request',
        shell('Request received', `Hi ${esc(full_name.split(' ')[0])}, thanks for reaching out. We'll put together a custom plan for <strong>${esc(company)}</strong> and get back to you within 24 hours.`))
    } catch (e) { errors.push(String(e)) }

    return json({ ok: true, errors })
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500)
  }
})