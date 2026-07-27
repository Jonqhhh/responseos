import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

function daysFromNow(date) {
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

async function createAlert(userId, type, tier, message) {
  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase
    .from('alerts')
    .select('id')
    .eq('user_id', userId)
    .eq('message', message)
    .gte('created_at', today)
    .maybeSingle()
  if (existing) return
  await supabase.from('alerts').insert({ user_id: userId, type, tier, message, acknowledged: false })
}

async function logToAudit(action, message) {
  await supabase.from('audit_logs').insert({ action, table_name: 'system', after_state: { message } })
}

async function checkCertifications() {
  const { data: certs } = await supabase
    .from('certifications')
    .select('*, users(id, full_name, email)')
    .neq('status', 'expired')
  if (!certs) return
  for (const cert of certs) {
    const days = daysFromNow(cert.expiry_date)
    const user = cert.users
    if (!user) continue
    if (days <= 0) {
      await createAlert(user.id, 'certification', 'critical', `${user.full_name}'s ${cert.cert_name} has expired.`)
      await supabase.from('certifications').update({ status: 'expired' }).eq('id', cert.id)
    } else if (days <= 7) {
      await createAlert(user.id, 'certification', 'critical', `${user.full_name}'s ${cert.cert_name} expires in ${days} day(s). Renew immediately.`)
      await supabase.from('certifications').update({ status: 'expiring' }).eq('id', cert.id)
    } else if (days <= 30) {
      await createAlert(user.id, 'certification', 'warning', `${user.full_name}'s ${cert.cert_name} expires in ${days} days.`)
      await supabase.from('certifications').update({ status: 'expiring' }).eq('id', cert.id)
    }
  }
}

async function checkTasks() {
  const today = new Date().toISOString().split('T')[0]
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, users!tasks_assigned_to_fkey(id, full_name, email)')
    .lt('due_date', today)
    .neq('status', 'complete')
  if (!tasks) return
  for (const task of tasks) {
    const user = task.users
    if (!user) continue
    const daysOverdue = Math.abs(daysFromNow(task.due_date))
    const tier = daysOverdue >= 3 ? 'critical' : 'warning'
    await createAlert(user.id, 'task', tier, `Task "${task.title}" assigned to ${user.full_name} is overdue by ${daysOverdue} day(s).`)
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