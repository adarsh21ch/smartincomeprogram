import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getConditionMetTimestamp = (progress: any) =>
  progress?.condition_met_at || progress?.completed_at || null;

const getStepUnlockState = (
  step: any,
  stepIndex: number,
  prevProgress: any,
  currentProgress: any,
) => {
  if (stepIndex === 0) {
    return {
      unlocked: true,
      lockReason: null,
      unlockAt: null,
      shouldPersistPermanentUnlock: false,
      conditionMetAt: null,
    };
  }

  if (currentProgress?.permanently_unlocked === true) {
    return {
      unlocked: true,
      lockReason: null,
      unlockAt: null,
      shouldPersistPermanentUnlock: false,
      conditionMetAt: currentProgress.condition_met_at || null,
    };
  }

  if (!prevProgress) {
    return {
      unlocked: false,
      lockReason: "condition_not_met",
      unlockAt: null,
      shouldPersistPermanentUnlock: false,
      conditionMetAt: null,
    };
  }

  const condition = step.unlock_condition || "full_watch";
  const watchPercent = prevProgress?.watched_percentage || 0;
  const timeSpentSeconds = prevProgress?.time_spent_seconds || 0;

  let conditionMet = false;
  if (condition === "percentage") {
    conditionMet = watchPercent >= (step.unlock_percentage || 80);
  } else if (condition === "time_spent") {
    conditionMet = timeSpentSeconds >= ((step.unlock_percentage || 10) * 60);
  } else {
    conditionMet = watchPercent >= 95 || prevProgress?.status === "completed" || !!prevProgress?.completed_at;
  }

  if (!conditionMet) {
    return {
      unlocked: false,
      lockReason: "condition_not_met",
      unlockAt: null,
      shouldPersistPermanentUnlock: false,
      conditionMetAt: null,
    };
  }

  const conditionMetAt = getConditionMetTimestamp(prevProgress);

  if (step.time_delay_enabled && (step.time_delay_minutes || 0) > 0) {
    if (!conditionMetAt) {
      return {
        unlocked: false,
        lockReason: "delay_waiting",
        unlockAt: null,
        shouldPersistPermanentUnlock: false,
        conditionMetAt: null,
      };
    }

    const unlockAtMs = new Date(conditionMetAt).getTime() + (step.time_delay_minutes || 0) * 60 * 1000;
    const unlockAt = new Date(unlockAtMs).toISOString();

    if (Date.now() < unlockAtMs) {
      return {
        unlocked: false,
        lockReason: "delay_countdown",
        unlockAt,
        shouldPersistPermanentUnlock: false,
        conditionMetAt,
      };
    }

    return {
      unlocked: true,
      lockReason: null,
      unlockAt,
      shouldPersistPermanentUnlock: true,
      conditionMetAt,
    };
  }

  return {
    unlocked: true,
    lockReason: null,
    unlockAt: null,
    shouldPersistPermanentUnlock: true,
    conditionMetAt,
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type } = await req.json();
    if (!type || !["program", "courses"].includes(type)) {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settings } = await supabase
      .from("program_settings")
      .select("active_member_funnel_id, active_courses_funnel_id")
      .limit(1)
      .single();

    const emptyResponse = { funnel: null, steps: [], overall_completion_percent: 0, streak: 0, last_active: null };

    if (!settings) {
      return new Response(JSON.stringify(emptyResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const funnelId = type === "program"
      ? settings.active_member_funnel_id
      : settings.active_courses_funnel_id;

    if (!funnelId) {
      return new Response(JSON.stringify(emptyResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch funnel with ALL relevant fields
    const { data: funnel } = await supabase
      .from("funnels")
      .select("id, title, description, speaker_name, speaker_photo_url, speaker_about, speaker_mode, speaker_scope, video_topics_enabled, video_topics, video_topics_scope, show_contact_buttons, contact_whatsapp, contact_phone, contact_instagram, owner_id")
      .eq("id", funnelId)
      .single();

    if (!funnel) {
      return new Response(JSON.stringify(emptyResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch creator profile
    let creatorProfile: any = null;
    if (funnel.owner_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, kyc_status")
        .eq("id", funnel.owner_id)
        .single();
      creatorProfile = profile;
    }

    // Fetch steps with ALL fields
    const { data: steps } = await supabase
      .from("funnel_steps")
      .select("id, title, description, step_order, step_type, video_asset_id, cta_text, cta_url, booking_url, unlock_rule_type, unlock_rule_value, unlock_condition, unlock_percentage, time_delay_enabled, time_delay_minutes, speaker_mode_step, speaker_name_custom, speaker_title, speaker_bio, speaker_photo_url_custom, video_topics_step_enabled, video_topics_step, timer_cta_enabled, timer_cta_text, timer_cta_url, timer_cta_style")
      .eq("funnel_id", funnelId)
      .eq("is_active", true)
      .order("step_order");

    // Fetch video assets
    const videoAssetIds = (steps || []).map((s: any) => s.video_asset_id).filter(Boolean);
    let videoAssets: Record<string, any> = {};
    if (videoAssetIds.length > 0) {
      const { data: assets } = await supabase
        .from("video_assets")
        .select("id, r2_key, public_url, thumbnail_url, duration_seconds")
        .in("id", videoAssetIds);
      if (assets) {
        for (const a of assets) videoAssets[a.id] = a;
      }
    }

    const r2PublicUrl = Deno.env.get("R2_PUBLIC_URL") || "";

    // Fetch progress including permanently_unlocked
    const { data: progressData } = await supabase
      .from("funnel_step_progress")
      .select("funnel_step_id, status, watched_percentage, completed_at, last_position_seconds, condition_met_at, max_watched_seconds, time_spent_seconds, permanently_unlocked")
      .eq("funnel_id", funnelId)
      .eq("session_id", user.id);

    const progressMap: Record<string, any> = {};
    if (progressData) {
      for (const p of progressData) progressMap[p.funnel_step_id] = p;
    }

    // Calculate streak
    let streak = 0;
    const { data: activityData } = await supabase
      .from("member_activity_log")
      .select("activity_date")
      .eq("member_id", user.id)
      .order("activity_date", { ascending: false })
      .limit(60);

    let lastActive: string | null = null;
    if (activityData && activityData.length > 0) {
      lastActive = activityData[0].activity_date;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dates = new Set(activityData.map((a: any) => a.activity_date));
      const checkDate = new Date(today);
      const todayStr = checkDate.toISOString().split("T")[0];
      const yesterdayDate = new Date(checkDate);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

      if (dates.has(todayStr)) {
        streak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dates.has(yesterdayStr)) {
        streak = 1;
        checkDate.setDate(checkDate.getDate() - 2);
      }

      if (streak > 0) {
        while (true) {
          const dateStr = checkDate.toISOString().split("T")[0];
          if (dates.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else break;
        }
      }
    }

    const pendingPermanentUnlocks: any[] = [];
    const unlockWriteTimestamp = new Date().toISOString();

    // Build response steps with full data
    const totalSteps = (steps || []).length;
    let completedCount = 0;

    const responseSteps = (steps || []).map((step: any, index: number) => {
      const progress = progressMap[step.id] || null;
      const prevProgress = index > 0 ? progressMap[(steps as any[])[index - 1]?.id] || null : null;
      const unlockState = getStepUnlockState(step, index, prevProgress, progress);

      let effectiveProgress = progress;

      if (unlockState.shouldPersistPermanentUnlock && !progress?.permanently_unlocked) {
        effectiveProgress = {
          ...progress,
          permanently_unlocked: true,
          status: progress?.status === "completed" ? "completed" : (progress?.status || "unlocked"),
          condition_met_at: progress?.condition_met_at || unlockState.conditionMetAt || null,
          unlocked_at: progress?.unlocked_at || unlockWriteTimestamp,
        };

        progressMap[step.id] = effectiveProgress;

        pendingPermanentUnlocks.push({
          funnel_id: funnelId,
          funnel_step_id: step.id,
          session_id: user.id,
          status: effectiveProgress.status,
          permanently_unlocked: true,
          condition_met_at: unlockState.conditionMetAt || null,
          unlocked_at: unlockWriteTimestamp,
          updated_at: unlockWriteTimestamp,
        });
      }

      const isCompleted = effectiveProgress?.status === "completed" || !!effectiveProgress?.completed_at;
      if (isCompleted) completedCount++;

      const asset = step.video_asset_id ? videoAssets[step.video_asset_id] : null;
      const videoUrl = asset?.public_url || (asset?.r2_key && r2PublicUrl ? `${r2PublicUrl}/${asset.r2_key}` : null);

      return {
        id: step.id,
        title: step.title,
        description: step.description || null,
        order: step.step_order,
        step_type: step.step_type,
        video_url: videoUrl,
        thumbnail_url: asset?.thumbnail_url || null,
        duration_seconds: asset?.duration_seconds || null,
        is_locked: !unlockState.unlocked,
        lock_reason: unlockState.lockReason,
        unlock_at: unlockState.unlockAt,
        // Rich fields
        cta_text: step.cta_text,
        cta_url: step.cta_url,
        booking_url: step.booking_url,
        unlock_condition: step.unlock_condition,
        unlock_percentage: step.unlock_percentage,
        time_delay_enabled: step.time_delay_enabled,
        time_delay_minutes: step.time_delay_minutes,
        speaker_mode_step: step.speaker_mode_step,
        speaker_name_custom: step.speaker_name_custom,
        speaker_title: step.speaker_title,
        speaker_bio: step.speaker_bio,
        speaker_photo_url_custom: step.speaker_photo_url_custom,
        video_topics_step_enabled: step.video_topics_step_enabled,
        video_topics_step: step.video_topics_step,
        timer_cta_enabled: step.timer_cta_enabled,
        timer_cta_text: step.timer_cta_text,
        timer_cta_url: step.timer_cta_url,
        timer_cta_style: step.timer_cta_style,
        progress: {
          watch_percent: effectiveProgress?.watched_percentage || 0,
          is_completed: isCompleted,
          last_position_seconds: effectiveProgress?.last_position_seconds || 0,
          condition_met_at: effectiveProgress?.condition_met_at || null,
          max_watched_seconds: effectiveProgress?.max_watched_seconds || 0,
          time_spent_seconds: effectiveProgress?.time_spent_seconds || 0,
          permanently_unlocked: effectiveProgress?.permanently_unlocked || false,
        },
      };
    });

    if (pendingPermanentUnlocks.length > 0) {
      await supabase
        .from("funnel_step_progress")
        .upsert(pendingPermanentUnlocks, { onConflict: "funnel_id,funnel_step_id,session_id", ignoreDuplicates: false });
    }

    const overallPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

    return new Response(
      JSON.stringify({
        funnel: {
          id: funnel.id,
          name: funnel.title,
          description: funnel.description,
          speaker_name: funnel.speaker_name,
          speaker_photo_url: funnel.speaker_photo_url,
          speaker_about: funnel.speaker_about,
          speaker_mode: funnel.speaker_mode,
          speaker_scope: funnel.speaker_scope,
          video_topics_enabled: funnel.video_topics_enabled,
          video_topics: funnel.video_topics,
          video_topics_scope: funnel.video_topics_scope,
          show_contact_buttons: funnel.show_contact_buttons,
          contact_whatsapp: funnel.contact_whatsapp,
          contact_phone: funnel.contact_phone,
        },
        creatorProfile: creatorProfile ? {
          full_name: creatorProfile.full_name,
          avatar_url: creatorProfile.avatar_url,
          bio: creatorProfile.bio,
          kyc_status: creatorProfile.kyc_status,
        } : null,
        steps: responseSteps,
        overall_completion_percent: overallPercent,
        streak,
        last_active: lastActive,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
