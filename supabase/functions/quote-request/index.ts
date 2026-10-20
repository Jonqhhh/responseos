import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      }
    })
  }

  try {
    const body = await req.json()
    const { name, email, company, industry, size, plan, message, type,
            full_name, team_size, compliance_needs, availability, timezone } = body

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    )

    // If this is a demo request — save to demo_requests table
    const isDemoRequest = type === 'DEMO REQUEST'
    if (isDemoRequest) {
      await supabaseAdmin.from('demo_requests').insert({
        full_name: full_name || name,
        email,
        company,
        industry,
        team_size,
        compliance_needs,
        availability,
        timezone,
        status: 'pending'
      })
    }

    // Build email HTML
    const isDemo = isDemoRequest
    const displayName = full_name || name
    const html = isDemo ? `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #13082A; padding: 24px; border-radius: 10px 10px 0 0;">
          <h1 style="color: #A78BFA; margin: 0; font-size: 24px;">ResponseOS</h1>
          <p style="color: #6B7280; margin: 4px 0 0; font-size: 13px;">New Demo Request</p>
        </div>
        <div style="background: #fff; border: 1px solid #E5E7EB; border-top: none; padding: 28px; border-radius: 0 0 10px 10px;">
          <div style="background: #F5F3FF; border-left: 4px solid #7C3AED; border-radius: 6px; padding: 14px 16px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #5B21B6;">New demo request — review and approve in the admin panel</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280; font-size: 13px; width: 160px;">Name</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-weight: 600; font-size: 13px;">${displayName}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280; font-size: 13px;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px;"><a href="mailto:${email}" style="color: #7C3AED;">${email}</a></td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280; font-size: 13px;">Company</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-weight: 600; font-size: 13px;">${company || '—'}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280; font-size: 13px;">Industry</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px;">${industry || '—'}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280; font-size: 13px;">Team size</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px;">${team_size || '—'}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280; font-size: 13px;">Compliance needs</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px;">${compliance_needs || '—'}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280; font-size: 13px;">Availability</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px;">${availability || '—'}</td></tr>
            <tr><td style="padding: 10px 0; color: #6B7280; font-size: 13px;">Timezone</td><td style="padding: 10px 0; font-size: 13px;">${timezone || '—'}</td></tr>
          </table>
          <div style="margin-top: 24px; text-align: center;">
            <a href="https://responseos.net/admin" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #7C3AED, #5B21B6); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Review in Admin Panel →</a>
          </div>
        </div>
      </div>
    ` : `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #13082A; padding: 24px; border-radius: 10px 10px 0 0;">
          <h1 style="color: #A78BFA; margin: 0; font-size: 24px;">ResponseOS</h1>
          <p style="color: #6B7280; margin: 4px 0 0; font-size: 13px;">New Quote Request</p>
        </div>
        <div style="background: #fff; border: 1px solid #E5E7EB; border-top: none; padding: 28px; border-radius: 0 0 10px 10px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280; font-size: 13px; width: 140px;">Name</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-weight: 600; font-size: 13px;">${displayName}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280; font-size: 13px;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px;"><a href="mailto:${email}" style="color: #7C3AED;">${email}</a></td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280; font-size: 13px;">Company</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-weight: 600; font-size: 13px;">${company || '—'}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280; font-size: 13px;">Industry</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px;">${industry || '—'}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280; font-size: 13px;">Team size</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px;">${size || '—'}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280; font-size: 13px;">Interested plan</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-weight: 600; color: #7C3AED; font-size: 13px;">${plan || '—'}</td></tr>
            <tr><td style="padding: 10px 0; color: #6B7280; font-size: 13px; vertical-align: top;">Message</td><td style="padding: 10px 0; font-size: 13px; line-height: 1.6;">${message || '—'}</td></tr>
          </table>
          <div style="margin-top: 24px; padding: 16px; background: #F5F3FF; border-radius: 8px; border-left: 4px solid #7C3AED;">
            <p style="margin: 0; font-size: 13px; color: #7C3AED; font-weight: 600;">Reply directly to this email to respond to ${displayName}.</p>
          </div>
        </div>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'ResponseOS <onboarding@resend.dev>',
        to: ['jonahtandf@gmail.com', 'hseals@responseos.net'],
        reply_to: email,
        subject: isDemoRequest ? `🎯 Demo request from ${displayName} at ${company}` : `New quote request from ${displayName} at ${company}`,
        html
      })
    })

    if (!res.ok) throw new Error('Failed to send email')

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})