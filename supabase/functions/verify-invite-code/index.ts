import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const rawCode = (body.code || "").trim().toUpperCase();

    if (!rawCode) {
      return new Response(JSON.stringify({ valid: false, reason: "invalid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If action is "use", mark the code as used
    if (body.action === "use") {
      const { data: codeRow } = await supabase
        .from("invite_codes")
        .select("id")
        .eq("code", rawCode)
        .eq("is_active", true)
        .single();

      if (codeRow) {
        await supabase.rpc("increment_invite_code_uses", { _code: rawCode }).catch(() => {
          // Fallback: direct update
          supabase.from("invite_codes").update({ current_uses: supabase.rpc ? undefined : 0 }).eq("code", rawCode);
        });

        // Just do a direct SQL-style update
        await supabase
          .from("invite_codes")
          .update({ current_uses: (codeRow as any).current_uses + 1 })
          .eq("code", rawCode);

        await supabase.from("invite_code_uses").insert({
          invite_code_id: codeRow.id,
          code: rawCode,
          user_email: body.user_email || null,
          user_id: body.user_id || null,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the code
    const { data: codeRow, error } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", rawCode)
      .eq("is_active", true)
      .single();

    if (error || !codeRow) {
      return new Response(JSON.stringify({ valid: false, reason: "invalid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, reason: "expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check usage limit
    if (codeRow.current_uses >= codeRow.max_uses) {
      return new Response(JSON.stringify({ valid: false, reason: "limit_reached" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ valid: true, invite_code_id: codeRow.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("verify-invite-code error:", err);
    return new Response(JSON.stringify({ valid: false, reason: "invalid" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
