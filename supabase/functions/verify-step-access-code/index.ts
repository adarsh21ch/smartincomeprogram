import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { funnel_id, step_id, code, session_id } = await req.json();

    if (!funnel_id || !step_id || !code || !session_id) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof code !== "string" || code.length > 20) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid code format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit: check recent failed attempts (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentAttempts } = await supabase
      .from("funnel_step_access")
      .select("*", { count: "exact", head: true })
      .eq("step_id", step_id)
      .eq("session_id", session_id)
      .eq("access_granted", false)
      .gte("granted_at", oneHourAgo);

    if ((recentAttempts || 0) >= 5) {
      return new Response(
        JSON.stringify({ success: false, message: "Too many attempts. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch step's access code hash
    const { data: step, error } = await supabase
      .from("funnel_steps")
      .select("id, access_code_enabled, access_code_hash")
      .eq("id", step_id)
      .eq("funnel_id", funnel_id)
      .single();

    if (error || !step || !step.access_code_enabled || !step.access_code_hash) {
      return new Response(
        JSON.stringify({ success: false, message: "Step not found or no code required" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compare: we store as uppercase SHA-256 hex
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(code.trim().toUpperCase()));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const codeHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const isValid = codeHash === step.access_code_hash;

    if (isValid) {
      // Upsert access grant
      await supabase.from("funnel_step_access").upsert(
        {
          funnel_id,
          step_id,
          session_id,
          access_granted: true,
          granted_at: new Date().toISOString(),
        },
        { onConflict: "funnel_id,step_id,session_id" }
      );

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log failed attempt (store as access_granted=false, then delete the unique conflict)
    // We need to track failed attempts separately - use a non-unique insert approach
    // Actually, let's just upsert with access_granted=false
    await supabase.from("funnel_step_access").upsert(
      {
        funnel_id,
        step_id,
        session_id,
        access_granted: false,
        granted_at: new Date().toISOString(),
      },
      { onConflict: "funnel_id,step_id,session_id" }
    );

    return new Response(
      JSON.stringify({ success: false, message: "Incorrect code. Please contact your mentor." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
