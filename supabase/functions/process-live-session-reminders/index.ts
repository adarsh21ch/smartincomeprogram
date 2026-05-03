// Cron-driven: finds upcoming slots within the next reminder window
// and emails registrants who haven't received a reminder for that slot yet.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const now = Date.now()
    const lookAheadMs = 30 * 60 * 1000 // scan slots up to 30 min out

    const { data: sessions, error } = await supabase
      .from('live_sessions')
      .select('id, scheduled_times, reminder_minutes_before, send_reminder_email, is_published, status')
      .eq('send_reminder_email', true)
      .eq('is_published', true)
      .in('status', ['scheduled', 'live'])

    if (error) throw error

    let totalSent = 0
    let totalChecked = 0

    for (const session of (sessions || [])) {
      const window = (session.reminder_minutes_before ?? 15) * 60 * 1000
      const slots: string[] = Array.isArray(session.scheduled_times) ? session.scheduled_times : []

      // upcoming slots inside the reminder window
      const dueSlots = slots.filter((s) => {
        const t = new Date(s).getTime()
        return t > now && (t - now) <= Math.min(window + 60_000, lookAheadMs)
      })
      if (dueSlots.length === 0) continue

      for (const slot of dueSlots) {
        const { data: regs } = await supabase
          .from('live_session_registrations')
          .select('id, email, reminder_slot')
          .eq('session_id', session.id)
          .not('email', 'is', null)

        for (const reg of (regs || [])) {
          totalChecked++
          if (reg.reminder_slot === slot) continue // already sent for this slot

          try {
            const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
            const res = await fetch(`${SUPABASE_URL}/functions/v1/send-live-session-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                registration_id: reg.id,
                type: 'reminder',
                slot_iso: slot,
              }),
            })
            if (res.ok) totalSent++
          } catch (e) {
            console.error('reminder send failed', reg.id, e)
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, checked: totalChecked, sent: totalSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('process-live-session-reminders error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
