import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, content-type",
      }
    })
  }

  try {
    const body = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    )

    // Bulk import mode
    if (body.users && Array.isArray(body.users)) {
      const results = []
      for (const user of body.users) {
        const { full_name, email, role, department, is_demo, demo_expires_at } = user
        const tempPassword = "Welcome" + Math.random().toString(36).slice(2, 8).toUpperCase() + "!"
        try {
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email, password: tempPassword, email_confirm: true
          })
          if (authError) { results.push({ email, success: false, error: authError.message }); continue }

          await supabaseAdmin.from("users").insert({
            id: authData.user.id,
            full_name, email, role: role || "employee",
            department: department || null,
            is_active: true, onboarded: false,
            is_demo: is_demo || false,
            demo_expires_at: demo_expires_at || null
          })

          // Send welcome email
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "ResponseOS <onboarding@resend.dev>",
              to: email,
              subject: "You've been added to ResponseOS",
              html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px">
                <img src="https://responseos.net/logo.png" style="height:40px;margin-bottom:24px" />
                <h2 style="color:#111827">Welcome to ResponseOS, ${full_name?.split(" ")[0]}!</h2>
                <p style="color:#6B7280">Your account has been created. Here are your login credentials:</p>
                <div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:8px;padding:16px;margin:20px 0">
                  <p style="margin:0 0 8px"><strong>Email:</strong> ${email}</p>
                  <p style="margin:0"><strong>Temporary password:</strong> <span style="font-family:monospace;color:#7C3AED">${tempPassword}</span></p>
                </div>
                <p style="color:#6B7280">Please sign in and change your password from your profile.</p>
                <a href="https://responseos.net/login" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;margin-top:8px">Sign in to ResponseOS</a>
                <p style="color:#9CA3AF;font-size:12px;margin-top:24px">© 2026 ResponseOS · Houston, TX</p>
              </div>`
            })
          })

          results.push({ email, success: true })
        } catch (err) {
          results.push({ email, success: false, error: err.message })
        }
      }
      return new Response(JSON.stringify({ results }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      })
    }

    // Single user mode (existing behavior)
    const { full_name, email, password, role, department } = body
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true
    })
    if (authError) throw new Error(authError.message)

    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      full_name, email, role, department,
      is_active: true, onboarded: false
    })
    if (profileError) throw new Error(profileError.message)

    return new Response(JSON.stringify({ success: true, userId: authData.user.id }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  }
})