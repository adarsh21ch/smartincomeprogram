import { useAuth } from "@/hooks/useAuth";
import { Play, Flame, TrendingUp, ChevronRight, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { StepData } from "@/components/member/StepCard";
import { motion } from "framer-motion";
import { brand } from "@/config/brand";

interface AboutTabProps {
  settings: any;
  content?: {
    funnel: { id: string; name: string; description?: string; speaker_name?: string; speaker_photo_url?: string; speaker_about?: string; video_topics_enabled?: boolean; video_topics?: Array<{ icon: string; text: string }> } | null;
    steps: StepData[];
    overall_completion_percent: number;
    streak: number;
    last_active: string | null;
  } | null;
  onContinue?: () => void;
}

export const AboutTab = ({ settings, content, onContinue }: AboutTabProps) => {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "Member";

  const steps = content?.steps || [];
  const completedSteps = steps.filter((s) => s.progress.is_completed).length;
  const totalSteps = steps.length;
  const completionPct = content?.overall_completion_percent || 0;
  const streak = content?.streak || 0;

  // Find next video to watch
  const nextStep = steps.find((s) => !s.is_locked && !s.progress.is_completed);

  // Animated progress ring
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPct / 100) * circumference;

  const formatDuration = (seconds: number | null) => {
    if (!seconds || seconds <= 0) return null;
    const mins = Math.round(seconds / 60);
    return mins > 0 ? `${mins} min` : "< 1 min";
  };

  // Collect video topics
  const videoTopics: Array<{ icon: string; text: string }> = [];
  if (content?.funnel?.video_topics_enabled && content.funnel.video_topics?.length) {
    videoTopics.push(...content.funnel.video_topics);
  }
  // Also collect per-step topics
  steps.forEach((s: any) => {
    if (s.video_topics_step_enabled && s.video_topics_step?.length) {
      s.video_topics_step.forEach((t: any) => {
        if (!videoTopics.find((vt) => vt.text === t.text)) videoTopics.push(t);
      });
    }
  });

  const lastActiveText = content?.last_active
    ? (() => {
        const d = new Date(content.last_active);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        return `${diffDays} days ago`;
      })()
    : null;

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border-l-[3px] border-l-primary border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5"
      >
        <h1 className="text-xl font-heading font-bold text-foreground">
          👋 Welcome, {firstName}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {settings?.welcome_tagline || "Your journey to building income starts here."}
        </p>
        {onContinue && (
          <button onClick={onContinue} className="mt-3 text-xs text-primary font-medium flex items-center gap-1 hover:underline">
            Go to Program <ChevronRight size={12} />
          </button>
        )}
      </motion.div>

      {/* Progress Ring + Stats */}
      {totalSteps > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Your Progress</p>
          <div className="flex items-center gap-6">
            {/* Ring */}
            <div className="relative shrink-0">
              <svg width="108" height="108" className="-rotate-90">
                <circle cx="54" cy="54" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
                <motion.circle
                  cx="54"
                  cy="54"
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{completionPct}%</span>
                <span className="text-[10px] text-muted-foreground">complete</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-primary" />
                <span className="text-sm text-foreground font-medium">{completedSteps} of {totalSteps} steps</span>
              </div>
              {lastActiveText && (
                <p className="text-xs text-muted-foreground">Last active: {lastActiveText}</p>
              )}
              {streak > 0 && (
                <div className="flex items-center gap-1.5">
                  <Flame size={14} className="text-orange-400" />
                  <span className="text-xs text-foreground font-medium">{streak} day streak</span>
                </div>
              )}
            </div>
          </div>

          {/* Continue button */}
          {nextStep && onContinue && (
            <button
              onClick={onContinue}
              className="mt-4 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
            >
              Continue Program <ChevronRight size={14} />
            </button>
          )}
        </motion.div>
      )}

      {/* What You'll Learn */}
      {videoTopics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-3"
        >
          <h2 className="text-sm font-heading font-semibold text-foreground">What You'll Learn</h2>
          <ul className="space-y-2">
            {videoTopics.slice(0, 8).map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                <span>{t.text}</span>
              </li>
            ))}
          </ul>
          {videoTopics.length > 8 && (
            <button onClick={onContinue} className="text-xs text-primary font-medium hover:underline">
              See all {videoTopics.length} topics →
            </button>
          )}
        </motion.div>
      )}

      {/* About the Program */}
      {content?.funnel?.description && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-3"
        >
          <h2 className="text-sm font-heading font-semibold text-foreground">{content.funnel.name}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">{content.funnel.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>📹 {totalSteps} videos</span>
            {content.funnel.speaker_name && <span>👤 {content.funnel.speaker_name}</span>}
          </div>
        </motion.div>
      )}

      {/* Mentor Card */}
      {content?.funnel?.speaker_name && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Your Mentor</p>
          <div className="flex items-center gap-4">
            {content.funnel.speaker_photo_url ? (
              <img
                src={content.funnel.speaker_photo_url}
                alt={content.funnel.speaker_name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-lg font-bold text-primary">
                {content.funnel.speaker_name[0]}
              </div>
            )}
            <div>
              <h3 className="font-heading font-semibold text-foreground">{content.funnel.speaker_name}</h3>
              <p className="text-xs text-primary">Program Creator</p>
              {content.funnel.speaker_about && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{content.funnel.speaker_about}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="pt-2 pb-4 text-center">
        <p className="text-[10px] text-muted-foreground/50">
          {brand.footer.copyright} · Powered by Nevorai
        </p>
      </div>
    </div>
  );
};
