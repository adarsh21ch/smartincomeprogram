// Sends a confirmation OR reminder email for a Scheduled Live Session.
// type: "confirmation" | "reminder"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function fmtIST(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }) + ' IST'
  } catch { return iso }
}

function buildHtml(opts: {
  type: 'confirmation' | 'reminder'
  sessionTitle: string
  slotIso: string
  joinUrl: string
  name: string
  bodyText?: string
  minutesBefore?: number
}) {
  const { type, sessionTitle, slotIso, joinUrl, name, bodyText, minutesBefore } = opts
  const heading = type === 'confirmation'
    ? "You're registered! 🎉"
    : `Starting in ${minutesBefore ?? 15} minutes ⏰`
  const intro = type === 'confirmation'
    ? `Hi ${name || 'there'}, your spot is confirmed for the live session.`
    : `Hi ${name || 'there'}, your live session is starting soon. Join now to grab your seat.`

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#0f172a;padding:32px 16px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:32px;border:1px solid #e2e8f0;">
    <div style="text-align:center;margin-bottom:20px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#0d9488,#2563eb);color:#fff;font-weight:700;font-size:14px;padding:6px 14px;border-radius:999px;letter-spacing:.4px;">SMART INCOME PROGRAM</div>
    </div>
    <h2 style="font-size:22px;margin:0 0 8px;color:#0f172a;">${heading}</h2>
    <p style="font-size:15px;color:#475569;margin:0 0 20px;line-height:1.6;">${intro}</p>

    <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin:18px 0;">
      <div style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Session</div>
      <div style="font-size:16px;font-weight:600;color:#0f172a;margin-bottom:12px;">${sessionTitle}</div>
      <div style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">When</div>
      <div style="font-size:15px;font-weight:600;color:#0d9488;">${fmtIST(slotIso)}</div>
    </div>

    ${bodyText ? `<div style="font-size:14px;color:#475569;line-height:1.7;white-space:pre-line;margin:16px 0;">${bodyText}</div>` : ''}

    <div style="text-align:center;margin:28px 0 12px;">
      <a href="${joinUrl}" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#2563eb);color:#fff;text-decoration:none;font-weight:600;padding:14px 32px;border-radius:10px;font-size:15px;">${type === 'reminder' ? 'Join Now' : 'View Session'}</a>
    </div>

    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #f1f5f9;text-align:center;font-size:12px;color:#94a3b8;">
      Smart Income Program · Live Sessions
    </div>
  </div>
</body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { registration_id, type, slot_iso } = await req.json() as {
      registration_id: string
      type: 'confirmation' | 'reminder'
      slot_iso?: string
    }

    if (!registration_id || !type) {
      return new Response(JSON.stringify({ error: 'Missing params' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: reg, error: regErr } = await supabase
      .from('live_session_registrations')
      .select('*')
      .eq('id', registration_id)
      .single()

    if (regErr || !reg || !reg.email) {
      return new Response(JSON.stringify({ sent: false, reason: 'No email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: session } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', reg.session_id)
      .single()

    if (!session) {
      return new Response(JSON.stringify({ sent: false, reason: 'Session not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (type === 'confirmation' && !session.send_confirmation_email) {
      return new Response(JSON.stringify({ sent: false, reason: 'Disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (type === 'reminder' && !session.send_reminder_email) {
      return new Response(JSON.stringify({ sent: false, reason: 'Disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // pick slot: explicit > next upcoming > first
    const slots: string[] = Array.isArray(session.scheduled_times) ? session.scheduled_times : []
    let slotToUse = slot_iso
    if (!slotToUse) {
      const now = Date.now()
      slotToUse = slots.find(s => new Date(s).getTime() > now) || slots[0] || session.scheduled_at
    }

    const origin = req.headers.get('origin') || 'https://smartincomeprogram.in'
    const joinUrl = `${origin}/s/${session.slug}`

    const subject = type === 'confirmation'
      ? (session.email_subject || `Registered: ${session.title}`)
      : `Starting in ${session.reminder_minutes_before ?? 15} min: ${session.title}`

    const html = buildHtml({
      type,
      sessionTitle: session.title,
      slotIso: slotToUse || new Date().toISOString(),
      joinUrl,
      name: reg.name || '',
      bodyText: type === 'confirmation' ? (session.email_body || undefined) : undefined,
      minutesBefore: session.reminder_minutes_before,
    })

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const gmailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-gmail-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: reg.email,
        subject,
        html,
        sender_name: 'Smart Income Program',
      }),
    })

    if (!gmailRes.ok) {
      const errBody = await gmailRes.text()
      throw new Error(`Gmail API error: ${errBody}`)
    }

    // mark sent
    const update: Record<string, unknown> = {}
    if (type === 'confirmation') update.confirmation_sent_at = new Date().toISOString()
    if (type === 'reminder') {
      update.reminder_sent_at = new Date().toISOString()
      if (slotToUse) update.reminder_slot = slotToUse
    }
    if (Object.keys(update).length) {
      await supabase.from('live_session_registrations').update(update).eq('id', registration_id)
    }

    return new Response(JSON.stringify({ sent: true, type, slot: slotToUse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('send-live-session-email error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
