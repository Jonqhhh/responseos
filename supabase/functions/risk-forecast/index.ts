import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

function daysFromNow(date) {
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

async function getPlatformSnapshot() {
  const { data: certs } = await supabase
    .from('certifications')
    .select('cert_name, status, expiry_date, users(full_name)')
  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, status, due_date, type, users!tasks_assigned_to_fkey(full_name)')
  const { data: alerts } = await supabase
    .from('alerts')
    .select('tier, message, created_at')
    .eq('acknowledged', false)
    .limit(20)

  const total = tasks?.length || 0
  const complete = tasks?.filter(t => t.status === 'complete').length || 0
  const overdue = tasks?.filter(t => t.status === 'overdue').length || 0
  const expired = certs?.filter(c => c.status === 'expired').length || 0
  const expiring = certs?.filter(c => c.status === 'expiring').length || 0
  const score = Math.max(0, 100 - (expired * 15) - (overdue * 10) - (expiring * 5))

  return {
    report_date: new Date().toISOString().split('T')[0],
    compliance_score: score,
    certifications: {
      total: certs?.length || 0,
      expired,
      expiring,
      valid: certs?.filter(c => c.status === 'valid').length || 0,
      details: certs?.map(c => ({
        name: c.cert_name,
        employee: c.users?.full_name,
        status: c.status,
        days_until_expiry: daysFromNow(c.expiry_date)
      }))
    },
    tasks: {
      total,
      complete,
      overdue,
      details: tasks?.map(t => ({
        title: t.title,
        assigned_to: t.users?.full_name,
        status: t.status,
        due_date: t.due_date
      }))
    },
    unacknowledged_alerts: {
      total: alerts?.length || 0,
      critical: alerts?.filter(a => a.tier === 'critical').length || 0,
      details: alerts
    }
  }
}

async function analyzeWithClaude(snapshot) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `You are ResponseOS's compliance risk analyst for VALE Co. 
Every Monday you review the platform snapshot and produce a weekly risk report for leadership.
Return ONLY a JSON object with no markdown or preamble:
{
  "executive_summary": "2-3 sentence plain English summary",
  "compliance_score": number,
  "risks": [
    { "title": "string", "severity": "Critical|Warning|Info", "description": "string", "action": "string" }
  ],
  "positive_highlight": "string",
  "score_trend": "string"
}
Be specific — use real names and data. Top 3 risks only.`,
      messages: [{
        role: 'user',
        content: `Platform snapshot: ${JSON.stringify(snapshot, null, 2)}`
      }]
    })
  })
  const data = await response.json()
  const raw = data.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim()
  return JSON.parse(raw)
}

function buildEmail(report, date) {
  const colors = { Critical: '#EF4444', Warning: '#F59E0B', Info: '#2563EB' }
  const bgs = { Critical: '#fff0f0', Warning: '#fff8ee', Info: '#eef4ff' }

  const risks = report.risks.map(r => `
    <div style="border-left:3px solid ${colors[r.severity]};background:${bgs[r.severity]};padding:12px 16px;margin-bottom:12px;border-radius:4px">
      <div style="font-weight:600;color:${colors[r.severity]};font-size:11px;text-transform:uppercase;margin-bottom:4px">${r.severity}</div>
      <div style="font-weight:600;font-size:15px;color:#1a1a1a;margin-bottom:4px">${r.title}</div>
      <div style="font-size:14px;color:#444;margin-bottom:8px">${r.description}</div>
      <div style="font-size:13px;color:#555"><strong>Action:</strong> ${r.action}</div>
    </div>`).join('')

  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#f8f8f6;padding:32px 24px">
      <div style="background:#0F1B2D;border-radius:8px;padding:20px 24px;margin-bottom:24px">
        <span style="font-size:20px;font-weight:700;color:#fff">Response<span style="color:#2563EB">OS</span></span>
        <span style="float:right;font-size:13px;color:#8FA0B8">${date}</span>
      </div>
      <div style="background:#fff;border-radius:8px;padding:20px 24px;margin-bottom:16px;text-align:center;border:1px solid #e8e8e4">
        <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Weekly Compliance Score</div>
        <div style="font-size:48px;font-weight:700;color:${report.compliance_score >= 80 ? '#10B981' : '#F59E0B'}">${report.compliance_score}%</div>
        <div style="font-size:13px;color:#666;margin-top:4px">${report.score_trend}</div>
      </div>
      <div style="background:#fff;border-radius:8px;padding:20px 24px;margin-bottom:16px;border:1px solid #e8e8e4">
        <div style="font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Executive Summary</div>
        <div style="font-size:15px;color:#222;line-height:1.7">${report.executive_summary}</div>
      </div>
      <div style="background:#fff;border-radius:8px;padding:20px 24px;margin-bottom:16px;border:1px solid #e8e8e4">
        <div style="font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">Top Risks This Week</div>
        ${risks}
      </div>
      <div style="background:#f0faf5;border:1px solid #b6e8ce;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <div style="font-size:11px;font-weight:600;color:#10B981;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">✓ Positive This Week</div>
        <div style="font-size:14px;color:#1a3a28">${report.positive_highlight}</div>
      </div>
      <div style="text-align:center;font-size:12px;color:#aaa">
        ResponseOS Compliance Platform · Auto-generated weekly report<br>
        <a href="https://responseos.netlify.app" style="color:#2563EB">View full dashboard →</a>
      </div>
    </div>`
}

Deno.serve(async () => {
  try {
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const snapshot = await getPlatformSnapshot()
    const report = await analyzeWithClaude(snapshot)
    const html = buildEmail(report, date)

    const { data: admins } = await supabase.from('users').select('email, full_name').eq('role', 'admin')

    if (admins) {
      for (const admin of admins) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'compliance@responseos.com',
            to: admin.email,
            subject: `ResponseOS — Weekly Compliance Report · ${date}`,
            html
          })
        })
      }
    }

    await supabase.from('audit_logs').insert({
      action: 'weekly_risk_report_generated',
      table_name: 'system',
      after_state: report
    })

    return new Response(JSON.stringify({ success: true, report }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})