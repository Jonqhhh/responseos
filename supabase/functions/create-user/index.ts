import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    const { full_name, email, password, role, department } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    )

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) throw new Error(authError.message)

    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      full_name,
      email,
      role,
      department,
      is_active: true,
      onboarded: false
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
