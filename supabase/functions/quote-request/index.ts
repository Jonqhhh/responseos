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
    const { name, email, company, industry, size, plan, message } = await req.json()

    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1C1C1E; padding: 24px; border-radius: 10px 10px 0 0;">
          <h1 style="color: #6B4EFF; margin: 0; font-size: 24px;">ResponseOS</h1>
          <p style="color: #A1A1AA; margin: 4px 0 0; font-size: 13px;">New Quote Request</p>
        </div>
        <div style="background: #fff; border: 1px solid #E4E6EF; border-top: none; padding: 28px; border-radius: 0 0 10px 10px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F8; color: #6B7280; font-size: 13px; width: 140px;">Name</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F8; font-weight: 600; font-size: 13px;">${name}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F8; color: #6B7280; font-size: 13px;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F8; font-size: 13px;"><a href="mailto:${email}" style="color: #6B4EFF;">${email}</a></td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F8; color: #6B7280; font-size: 13px;">Company</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F8; font-weight: 600; font-size: 13px;">${company}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F8; color: #6B7280; font-size: 13px;">Industry</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F8; font-size: 13px;">${industry || '—'}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F8; color: #6B7280; font-size: 13px;">Team size</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F8; font-size: 13px;">${size || '—'}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F8; color: #6B7280; font-size: 13px;">Interested plan</td><td style="padding: 10px 0; border-bottom: 1px solid #F3F4F8; font-weight: 600; color: #6B4EFF; font-size: 13px;">${plan || '—'}</td></tr>
            <tr><td style="padding: 10px 0; color: #6B7280; font-size: 13px; vertical-align: top;">Message</td><td style="padding: 10px 0; font-size: 13px; line-height: 1.6;">${message || '—'}</td></tr>
          </table>
          <div style="margin-top: 24px; padding: 16px; background: #EEF0FF; border-radius: 8px; border-left: 4px solid #6B4EFF;">
            <p style="margin: 0; font-size: 13px; color: #6B4EFF; font-weight: 600;">Reply directly to this email to respond to ${name}.</p>
          </div>
        </div>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'ResponseOS <onboarding@resend.dev>',
        to: ['jonahtandf@gmail.com'],
        reply_to: email,
        subject: `New quote request from ${name} at ${company}`,
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