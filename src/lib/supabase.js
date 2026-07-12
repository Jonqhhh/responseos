import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function getCertifications() {
  const { data: certs, error: e1 } = await supabase
    .from('certifications')
    .select('*')
    .order('expiry_date', { ascending: true })
  if (e1) throw e1

  const { data: users, error: e2 } = await supabase
    .from('users')
    .select('id, full_name, email, role')
  if (e2) throw e2

  return certs.map(c => ({
    ...c,
    users: users.find(u => u.id === c.user_id) || null
  }))
}

export async function getTasks() {
  const { data: tasks, error: e1 } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true })
  if (e1) throw e1

  const { data: users, error: e2 } = await supabase
    .from('users')
    .select('id, full_name, email')
  if (e2) throw e2

  return tasks.map(t => ({
    ...t,
    users: users.find(u => u.id === t.assigned_to) || null
  }))
}

export async function getAlerts() {
  const { data: alerts, error: e1 } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
  if (e1) throw e1

  const { data: users, error: e2 } = await supabase
    .from('users')
    .select('id, full_name')
  if (e2) throw e2

  return alerts.map(a => ({
    ...a,
    users: users.find(u => u.id === a.user_id) || null
  }))
}

export async function getAuditLogs() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function acknowledgeAlert(id) {
  const { error } = await supabase
    .from('alerts')
    .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}