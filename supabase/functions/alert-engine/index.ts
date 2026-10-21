import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

function daysFromNow(date: string): number {
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

async function createAlert(userId: string, type: string, tier: string, message: string, isDemo = false) {
  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase
    .from('alerts')
    .select('id')
    .eq('user_id', userId)
    .eq('message', message)
    .gte('created_at', today)
    .maybeSingle()
  if (existing) return
  await supabase.from('alerts').insert({ user_id: userId, type, tier, message, acknowledged: false, is_demo: isDemo })
}

async function logToAudit(action: string, message: string) {
  await supabase.from('audit_logs').insert({ action, table_name: 'system', after_state: { message } })
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'ResponseOS <onboarding@resend.dev>',
      to,
      subject,
      html
    })
  })
}

function certEmailHtml(name: string, certName: string, days: number, expiry: string, urgent: boolean): string {
  const color = urgent ? '#DC2626' : '#D97706'
  const bg    = urgent ? '#FEF2F2' : '#FFFBEB'
  const label = days <= 0 ? 'EXPIRED' : `${days} DAY${days !== 1 ? 'S' : ''} LEFT`
  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#13082A;padding:24px;border-radius:10px 10px 0 0;">
        <img src="https://responseos.net/logo.png" style="height:36px;filter:brightness(0) invert(1)" />
      </div>
      <div style="background:#fff;border:1px solid #E5E7EB;border-top:none;padding:28px;border-radius:0 0 10px 10px;">
        <div style="background:${bg};border-left:4px solid ${color};border-radius:6px;padding:14px 16px;margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;color:${color};letter-spacing:.06em;margin-bottom:4px;">${label}</div>
          <div style="font-size:16px;font-weight:800;color:#111827;">${certName}</div>
        </div>
        <p style="color:#374151;font-size:14px;line-height:1.7;">Hi ${name},</p>
        <p style="color:#374151;font-size:14px;line-height:1.7;">
          ${days <= 0
            ? `Your <strong>${certName}</strong> certification has <strong style="color:${color}">expired</strong>. Please renew it immediately to maintain compliance.`
            : `Your <strong>${certName}</strong> certification expires on <strong>${expiry}</strong> — that's <strong style="color:${color}">${days} day${days !== 1 ? 's' : ''}</strong> from now. Please take action to renew before it lapses.`
          }
        </p>
        <div style="margin:24px 0;padding:14px 16px;background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;font-size:13px;color:#6B7280;">
          <strong style="color:#111827;">Expiry date:</strong> ${expiry}
        </div>
        <a href="https://responseos.net/certs" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">View Certifications →</a>
        <p style="color:#9CA3AF;font-size:12px;margin-top:24px;">© 2026 ResponseOS · Houston, TX · responseos.net</p>
      </div>
    </div>
  `
}

function adminOverdueHtml(overdueCerts: Array<{name: string, cert: string, days: number, expiry: string}>): string {
  const rows = overdueCerts.map(c => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #F3F4F6;font-weight:600;color:#111827;font-size:13px;">${c.name}</td>
      <td style="padding:10px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151;">${c.cert}</td>
      <td style="padding:10px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151;">${c.expiry}</td>
      <td style="padding:10px;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:700;color:#DC2626;">${c.days <= 0 ? `${Math.abs(c.days)}d overdue` : `${c.days}d left`}</td>
    </tr>
  `).join('')

  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#13082A;padding:24px;border-radius:10px 10px 0 0;">
        <img src="https://responseos.net/logo.png" style="height:36px;filter:brightness(0) invert(1)" />
        <p style="color:rgba(255,255,255,0.5);margin:6px 0 0;font-size:13px;">Certification Alert Summary</p>
      </div>
      <div style="background:#fff;border:1px solid #E5E7EB;border-top:none;padding:28px;border-radius:0 0 10px 10px;">
        <div style="background:#FEF2F2;border-left:4px solid #DC2626;border-radius:6px;padding:14px 16px;margin-bottom:20px;">
          <div style="font-size:14px;font-weight:700;color:#991B1B;">Action required — ${overdueCerts.length} certification${overdueCerts.length !== 1 ? 's' : ''} need attention</div>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#F9FAFB;">
              <th style="padding:10px;text-align:left;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;">Employee</th>
              <th style="padding:10px;text-align:left;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;">Certification</th>
              <th style="padding:10px;text-align:left;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;">Expiry</th>
              <th style="padding:10px;text-align:left;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:24px;">
          <a href="https://responseos.net/certs" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Review in ResponseOS →</a>
        </div>
        <p style="color:#9CA3AF;font-size:12px;margin-top:24px;">© 2026 ResponseOS · Houston, TX · responseos.net</p>
      </div>
    </div>
  `
}

async function checkCertifications() {
  const { data: certs } = await supabase
    .from('certifications')
    .select('*, users(id, full_name, email, is_demo)')
  if (!certs) return

  const adminAlerts: Array<{name: string, cert: string, days: number, expiry: string}> = []
  const emailsSent = new Set<string>()

  for (const cert of certs) {
    const days = daysFromNow(cert.expiry_date)
    const user = cert.users
    if (!user) continue
    const isDemo = user.is_demo === true

    // Update status
    if (days <= 0) {
      await supabase.from('certifications').update({ status: 'expired' }).eq('id', cert.id)
    } else if (days <= 30) {
      await supabase.from('certifications').update({ status: 'expiring' }).eq('id', cert.id)
    } else {
      await supabase.from('certifications').update({ status: 'valid' }).eq('id', cert.id)
    }

    // Create in-app alerts
    if (days <= 0) {
      await createAlert(user.id, 'certification', 'critical', `Your ${cert.cert_name} has expired. Renew immediately.`, isDemo)
      adminAlerts.push({ name: user.full_name, cert: cert.cert_name, days, expiry: cert.expiry_date })
    } else if (days <= 7) {
      await createAlert(user.id, 'certification', 'critical', `Your ${cert.cert_name} expires in ${days} day(s). Renew immediately.`, isDemo)
      adminAlerts.push({ name: user.full_name, cert: cert.cert_name, days, expiry: cert.expiry_date })
    } else if (days <= 30) {
      await createAlert(user.id, 'certification', 'warning', `Your ${cert.cert_name} expires in ${days} days.`, isDemo)
    }

    // Send employee expiry emails (30 days and 7 days only, once per day)
    if (!isDemo && user.email && (days === 30 || days === 7 || days === 0)) {
      const emailKey = `${user.email}-${cert.id}-${days}`
      if (!emailsSent.has(emailKey)) {
        emailsSent.add(emailKey)
        const urgent = days <= 7
        await sendEmail(
          user.email,
          days <= 0
            ? `⚠️ Your ${cert.cert_name} has expired — action required`
            : `${urgent ? '🚨' : '⏰'} Your ${cert.cert_name} expires in ${days} days`,
          certEmailHtml(user.full_name?.split(' ')[0] || 'there', cert.cert_name, days, cert.expiry_date, urgent)
        )
      }
    }
  }

  // Send admin summary email if there are critical certs
  if (adminAlerts.length > 0) {
    const admins = await supabase
      .from('users')
      .select('email')
      .in('role', ['admin'])
      .eq('is_demo', false)
      .eq('is_active', true)

    for (const admin of admins.data || []) {
      await sendEmail(
        admin.email,
        `⚠️ ResponseOS — ${adminAlerts.length} certification${adminAlerts.length !== 1 ? 's' : ''} need attention`,
        adminOverdueHtml(adminAlerts)
      )
    }
  }
}

async function checkTasks() {
  const today = new Date().toISOString().split('T')[0]
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, users!tasks_assigned_to_fkey(id, full_name, email, is_demo)')
    .lt('due_date', today)
    .neq('status', 'complete')
  if (!tasks) return
  for (const task of tasks) {
    const user = task.users
    if (!user) continue
    const daysOverdue = Math.abs(daysFromNow(task.due_date))
    const tier = daysOverdue >= 3 ? 'critical' : 'warning'
    await createAlert(user.id, 'task', tier, `Task "${task.title}" is overdue by ${daysOverdue} day(s).`, user.is_demo)
    await supabase.from('tasks').update({ status: 'overdue' }).eq('id', task.id)
  }
}

async function escalateAlerts() {
  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const { data: stale } = await supabase
    .from('alerts')
    .select('*')
    .eq('acknowledged', false)
    .lt('created_at', cutoff48h)
  if (!stale) return
  for (const alert of stale) {
    await logToAudit('alert_escalated', `ESCALATED: "${alert.message}"`)
  }
}

Deno.serve(async () => {
  try {
    await checkCertifications()
    await checkTasks()
    await escalateAlerts()
    await logToAudit('alert_engine_run', 'Alert engine completed successfully')
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})