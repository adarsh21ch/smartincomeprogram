import { useAuth } from "@/hooks/useAuth";
import { Play, Flame, Calendar, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { StepData } from "@/components/member/StepCard";
import { motion } from "framer-motion";

interface AboutTabProps {
  settings: any;
  content?: {
    funnel: { id: string; name: string; description?: string; speaker_name?: string; speaker_photo_url?: string } | null;
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

  // Level badge
  const levelBadge =
    completionPct === 100
      ? "🏆 Program Complete"
      : completionPct >= 60
      ? "🚀 Making Progress"
      : completionPct >= 20
      ? "📈 Getting Started"
      : "🌱 Just Joined";

  // Animated progress ring
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPct / 100) * circumference;

  const formatDuration = (seconds: number | null) => {
    if (!seconds || seconds <= 0) return null;
    const mins = Math.round(seconds / 60);
    return mins > 0 ? `${mins} min` : "< 1 min";
  };

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 p-5"
      >
        <h1 className="text-xl font-heading font-bold text-foreground">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {settings?.welcome_tagline || "Your success journey continues today."}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {levelBadge}
          </span>
        </div>
      </motion.div>

      {/* Progress Ring + Stats */}
      {totalSteps > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
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
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <TrendingUp size={16} className="mx-auto text-primary mb-1" />
                <p className="text-lg font-bold text-foreground">{completedSteps}/{totalSteps}</p>
                <p className="text-[10px] text-muted-foreground">Steps Done</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <Flame size={16} className="mx-auto text-orange-400 mb-1" />
                <p className="text-lg font-bold text-foreground">{streak}</p>
                <p className="text-[10px] text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Program Overview */}
      {content?.funnel && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-3"
        >
          <h2 className="text-sm font-heading font-semibold text-foreground">{content.funnel.name}</h2>
          {content.funnel.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{content.funnel.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>📹 {totalSteps} videos</span>
            {content.funnel.speaker_name && <span>👤 {content.funnel.speaker_name}</span>}
          </div>
        </motion.div>
      )}

      {/* Continue Watching */}
      {nextStep && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-card p-5"
        >
          <p className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-2">Continue Watching</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Play size={24} className="text-primary ml-0.5" fill="currentColor" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{nextStep.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {nextStep.progress.watch_percent > 0
                  ? `${nextStep.progress.watch_percent}% watched`
                  : formatDuration(nextStep.duration_seconds) || "Ready to watch"}
              </p>
              {nextStep.progress.watch_percent > 0 && (
                <Progress value={nextStep.progress.watch_percent} className="h-1 mt-1.5" />
              )}
            </div>
            <button
              onClick={onContinue}
              className="shrink-0 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              {nextStep.progress.watch_percent > 0 ? "Resume" : "Start"} →
            </button>
          </div>
        </motion.div>
      )}

      {/* Mentor Card */}
      {content?.funnel?.speaker_name && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
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
              <p className="text-xs text-muted-foreground">Program Creator</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
