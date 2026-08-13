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
    const { email, full_name, company } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    )

    const { data: existingDemo } = await supabaseAdmin
      .from("demo_users")
      .select("demo_count, email")
      .eq("email", email.toLowerCase())
      .single()

    if (existingDemo && existingDemo.demo_count >= 2) {
      return new Response(JSON.stringify({
        error: "You have already used your 2 free demos. Please contact us to upgrade."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      })
    }

    const tempPassword = "Demo" + Math.random().toString(36).slice(2, 8).toUpperCase() + "!"

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: tempPassword,
      email_confirm: true
    })

    if (authError && !authError.message.includes("already registered")) {
      throw new Error(authError.message)
    }

    const userId = authData?.user?.id

    if (userId) {
      const demoCompany = company || "Demo Company"
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

      await supabaseAdmin.from("users").upsert({
        id: userId,
        full_name: full_name || "Demo Admin",
        email: email.toLowerCase(),
        role: "admin",
        department: "Management",
        is_active: true,
        onboarded: false,
        is_demo: true,
        demo_expires_at: expiresAt,
        demo_company: demoCompany
      })

      if (existingDemo) {
        await supabaseAdmin.from("demo_users")
          .update({ demo_count: existingDemo.demo_count + 1 })
          .eq("email", email.toLowerCase())
      } else {
        await supabaseAdmin.from("demo_users").insert({
          user_id: userId,
          email: email.toLowerCase(),
          company: demoCompany,
          demo_count: 1,
          expires_at: expiresAt
        })
      }

      const employees = [
        { full_name: "Marcus Johnson", email: "marcus." + userId.slice(0,6) + "@demo.com", role: "employee", department: "Operations" },
        { full_name: "Sarah Chen",     email: "sarah." + userId.slice(0,6) + "@demo.com",  role: "supervisor", department: "Safety" },
        { full_name: "Derek Williams", email: "derek." + userId.slice(0,6) + "@demo.com",  role: "auditor",   department: "Compliance" },
      ]

      const empIds = []
      for (const emp of employees) {
        const { data: empAuth } = await supabaseAdmin.auth.admin.createUser({
          email: emp.email, password: "Demo123456!", email_confirm: true
        })
        if (empAuth?.user?.id) {
          await supabaseAdmin.from("users").insert({
            id: empAuth.user.id, ...emp,
            is_active: true, onboarded: true, is_demo: true,
            demo_expires_at: expiresAt
          })
          empIds.push(empAuth.user.id)
        }
      }

      const certs = [
        { user_id: userId,     cert_name: "NERC CIP Operator",     issuing_body: "NERC",     status: "valid",    issued_date: "2024-01-15", expiry_date: "2026-01-15" },
        { user_id: empIds[0],  cert_name: "OSHA 30-Hour Safety",   issuing_body: "OSHA",     status: "expiring", issued_date: "2023-06-01", expiry_date: "2025-09-01" },
        { user_id: empIds[1],  cert_name: "First Aid & CPR",       issuing_body: "Red Cross", status: "valid",   issued_date: "2024-03-10", expiry_date: "2026-03-10" },
        { user_id: empIds[0],  cert_name: "Confined Space Entry",  issuing_body: "ANSI",     status: "expired",  issued_date: "2022-08-20", expiry_date: "2024-08-20" },
        { user_id: empIds[2],  cert_name: "ISO 27001 Lead Auditor",issuing_body: "BSI",      status: "valid",    issued_date: "2024-05-01", expiry_date: "2027-05-01" },
      ]
      if (empIds.length > 0) await supabaseAdmin.from("certifications").insert(certs)

      const tasks = [
        { assigned_to: empIds[0] || userId, assigned_by: userId, title: "Monthly safety inspection", type: "inspection", status: "overdue",     due_date: "2025-07-15" },
        { assigned_to: empIds[1] || userId, assigned_by: userId, title: "Q3 compliance checklist",   type: "checklist",  status: "in_progress", due_date: "2025-09-30" },
        { assigned_to: userId,              assigned_by: userId, title: "NERC CIP audit preparation", type: "report",    status: "scheduled",   due_date: "2025-10-01" },
        { assigned_to: empIds[2] || userId, assigned_by: userId, title: "Security access review",    type: "security",   status: "complete",    due_date: "2025-08-01" },
      ]
      await supabaseAdmin.from("tasks").insert(tasks)

      const alerts = [
        { user_id: userId, triggered_by: userId, type: "certification", tier: "critical", message: "Confined Space Entry certification expired. Immediate renewal required.", acknowledged: false },
        { user_id: userId, triggered_by: userId, type: "certification", tier: "warning",  message: "OSHA 30-Hour Safety certification expires in 18 days.", acknowledged: false },
        { user_id: userId, triggered_by: userId, type: "task",          tier: "critical", message: "Monthly safety inspection is 15 days overdue.", acknowledged: false },
        { user_id: userId, triggered_by: userId, type: "task",          tier: "info",     message: "NERC CIP audit preparation scheduled for October 1st.", acknowledged: true },
      ]
      await supabaseAdmin.from("alerts").insert(alerts)

      const docs = [
        { name: "FERC Compliance Policy 2025", description: "Annual FERC compliance policy", category: "Policy", access_level: "admin",   uploaded_by: userId, file_url: "https://example.com/demo1.pdf", file_name: "ferc-policy.pdf",   file_size: 245000 },
        { name: "Q2 2025 Safety Audit Report", description: "Completed Q2 safety audit",    category: "Audit",  access_level: "auditor", uploaded_by: userId, file_url: "https://example.com/demo2.pdf", file_name: "q2-audit.pdf",      file_size: 189000 },
      ]
      await supabaseAdmin.from("documents").insert(docs)
    }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ResponseOS <onboarding@resend.dev>",
        to: email,
        subject: "Your ResponseOS demo is ready!",
        html: "<div style=\"font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#080612;padding:32px;border-radius:12px\"><div style=\"text-align:center;margin-bottom:24px\"><span style=\"font-size:22px;font-weight:800;color:#fff\">Response<span style=\"color:#8B5CF6\">OS</span></span></div><div style=\"background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:24px;margin-bottom:20px\"><div style=\"font-size:20px;font-weight:800;color:#F0EEFF;margin-bottom:8px\">Welcome " + (full_name ? full_name.split(" ")[0] : "there") + "!</div><div style=\"font-size:14px;color:#C4B8E8;line-height:1.7\">Your 14-day free demo is ready. We have pre-loaded your account with realistic compliance data so you can explore every feature right away.</div></div><div style=\"background:rgba(20,10,45,0.8);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:20px;margin-bottom:20px\"><div style=\"font-size:12px;font-weight:700;color:#8B5CF6;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px\">Your login credentials</div><div style=\"font-size:14px;color:#F0EEFF;margin-bottom:6px\"><strong style=\"color:#9B8ABB\">Email:</strong> " + email + "</div><div style=\"font-size:14px;color:#F0EEFF;margin-bottom:6px\"><strong style=\"color:#9B8ABB\">Password:</strong> " + (userId ? "See below" : "Error") + "</div></div><div style=\"background:rgba(20,10,45,0.8);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:20px;margin-bottom:20px\"><div style=\"font-size:12px;font-weight:700;color:#8B5CF6;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px\">The ResponseOS Philosophy</div><div style=\"font-size:14px;color:#C4B8E8;line-height:1.8\">Compliance should not be reactive. Most teams scramble before audits, chase expired certifications, and manually track what should be automatic. ResponseOS was built to change that. We believe every team deserves an audit-ready posture every single day.</div></div><div style=\"text-align:center;margin-bottom:20px\"><a href=\"https://responseos.net/login\" style=\"display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700\">Start your demo</a></div><div style=\"border-top:1px solid rgba(139,92,246,0.15);padding-top:16px;text-align:center;font-size:13px;color:#7060AA\">Questions? Email us at <a href=\"mailto:jlane@responseos.net\" style=\"color:#8B5CF6\">jlane@responseos.net</a></div></div>"
      })
    })

    return new Response(JSON.stringify({ success: true, tempPassword }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  }
})
