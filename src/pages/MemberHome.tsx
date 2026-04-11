import { useState } from "react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { StepCard, StepData } from "@/components/member/StepCard";
import { VideoPlayer } from "@/components/member/VideoPlayer";
import { CompletionCard } from "@/components/member/CompletionCard";
import { AboutTab } from "@/components/member/AboutTab";
import { CoursesTab } from "@/components/member/CoursesTab";
import { ProfileTab } from "@/components/member/ProfileTab";
import { useNavigate } from "react-router-dom";

interface MemberHomeProps {
  tab: "about" | "program" | "courses" | "profile";
}

const MemberHome = ({ tab }: MemberHomeProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["program-settings-member"],
    queryFn: async () => {
      const { data } = await supabase
        .from("program_settings")
        .select("*")
        .limit(1)
        .single();
      return data;
    },
  });

  // Fetch program content for About and Program tabs
  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: ["member-content", "program", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-member-content", {
        body: { type: "program" },
      });
      if (error) throw error;
      return data as {
        funnel: { id: string; name: string; description?: string; speaker_name?: string; speaker_photo_url?: string } | null;
        steps: StepData[];
        overall_completion_percent: number;
        streak: number;
        last_active: string | null;
      };
    },
    enabled: !!user && tab !== "courses",
  });

  // Activity stats for profile
  const { data: activityStats } = useQuery({
    queryKey: ["member-activity-stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("member_activity_log" as any)
        .select("activity_date, videos_watched")
        .eq("member_id", user!.id);
      const days = (data as any[])?.length || 0;
      const videos = (data as any[])?.reduce((sum: number, d: any) => sum + (d.videos_watched || 0), 0) || 0;
      const completed = content?.steps?.filter((s) => s.progress.is_completed).length || 0;
      return { daysActive: days, videosWatched: videos, stepsCompleted: completed };
    },
    enabled: tab === "profile" && !!user,
  });

  const isLoading = settingsLoading || ((tab === "about" || tab === "program") && contentLoading);

  if (isLoading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      </MemberLayout>
    );
  }

  // About tab
  if (tab === "about") {
    return (
      <MemberLayout>
        <AboutTab
          settings={settings}
          content={content}
          onContinue={() => navigate("/home/program")}
        />
      </MemberLayout>
    );
  }

  // Courses tab
  if (tab === "courses") {
    return (
      <MemberLayout>
        <CoursesTab />
      </MemberLayout>
    );
  }

  // Profile tab
  if (tab === "profile") {
    return (
      <MemberLayout>
        <ProfileTab stats={activityStats} />
      </MemberLayout>
    );
  }

  // Program tab
  const funnel = content?.funnel;
  const steps = content?.steps || [];
  const completionPct = content?.overall_completion_percent || 0;
  const completedSteps = steps.filter((s) => s.progress.is_completed).length;
  const allComplete = steps.length > 0 && completedSteps === steps.length;

  const tabTitle = (settings as any)?.program_tab_title || "Your Program";
  const completionMessage = (settings as any)?.completion_message || "Congratulations! You have completed the program.";
  const certificateSignatory = (settings as any)?.certificate_signatory || "";

  if (!funnel) {
    return (
      <MemberLayout>
        <div className="space-y-4">
          <h1 className="text-xl font-heading font-bold">{tabTitle}</h1>
          <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-2">
            <p className="text-muted-foreground text-sm">
              Program content is being prepared. Check back soon!
            </p>
          </div>
        </div>
      </MemberLayout>
    );
  }

  const handleStepComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["member-content", "program", user?.id] });
  };

  return (
    <MemberLayout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-heading font-bold">{tabTitle}</h1>
          {funnel.description && (
            <p className="text-sm text-muted-foreground mt-1">{funnel.description}</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {completedSteps} of {steps.length} steps completed
            </span>
            <span className="font-medium">{completionPct}%</span>
          </div>
          <Progress value={completionPct} className="h-1.5" />
        </div>

        {/* Steps or Completion */}
        {allComplete ? (
          <CompletionCard
            funnelId={funnel.id}
            programName={funnel.name}
            completionMessage={completionMessage}
            signatory={certificateSignatory}
            totalSteps={steps.length}
          />
        ) : steps.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">No content yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id}>
                <StepCard
                  step={step}
                  index={index}
                  isExpanded={expandedStepId === step.id}
                  onToggle={() =>
                    setExpandedStepId(expandedStepId === step.id ? null : step.id)
                  }
                />
                {expandedStepId === step.id && !step.is_locked && (
                  <div className="mt-2">
                    <VideoPlayer
                      videoUrl={step.video_url}
                      stepTitle={step.title}
                      stepId={step.id}
                      funnelId={funnel.id}
                      initialPosition={step.progress.last_position_seconds}
                      durationSeconds={step.duration_seconds}
                      onComplete={handleStepComplete}
                      onClose={() => setExpandedStepId(null)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MemberLayout>
  );
};

export default MemberHome;
