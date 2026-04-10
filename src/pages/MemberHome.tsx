import { MemberLayout } from "@/components/layout/MemberLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Film, Lock, CheckCircle2, Play, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface MemberHomeProps {
  tab: "program" | "about" | "courses";
}

const MemberHome = ({ tab }: MemberHomeProps) => {
  const { user } = useAuth();

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

  const funnelId = tab === "program"
    ? settings?.active_member_funnel_id
    : (settings as any)?.active_courses_funnel_id;

  const { data: funnel, isLoading: funnelLoading } = useQuery({
    queryKey: ["member-funnel", funnelId],
    queryFn: async () => {
      if (!funnelId) return null;
      const { data } = await supabase
        .from("funnels")
        .select("id, title, description")
        .eq("id", funnelId)
        .single();
      return data;
    },
    enabled: !!funnelId,
  });

  const { data: steps = [] } = useQuery({
    queryKey: ["member-funnel-steps", funnelId],
    queryFn: async () => {
      if (!funnelId) return [];
      const { data } = await supabase
        .from("funnel_steps")
        .select("id, title, description, step_order, step_type, video_asset_id")
        .eq("funnel_id", funnelId)
        .eq("is_active", true)
        .order("step_order");
      return data || [];
    },
    enabled: !!funnelId,
  });

  const isLoading = settingsLoading || funnelLoading;

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
    const aboutTitle = (settings as any)?.about_title || "About the Program";
    const aboutContent = (settings as any)?.about_content || "";

    return (
      <MemberLayout>
        <div className="max-w-2xl space-y-4">
          <h1 className="text-2xl font-heading font-bold">{aboutTitle}</h1>
          {aboutContent ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {aboutContent.split("\n").map((line: string, i: number) => (
                <p key={i} className="text-muted-foreground">{line}</p>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground">About content coming soon.</p>
            </div>
          )}
        </div>
      </MemberLayout>
    );
  }

  // Program or Courses tab
  const tabLabel = tab === "program" ? "Your Program" : "Your Courses";

  if (!funnelId || !funnel) {
    return (
      <MemberLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-heading font-bold">{tabLabel}</h1>
          <div className="glass-card p-8 text-center space-y-2">
            <Film size={32} className="mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              {tab === "program"
                ? "Program content is being prepared. Check back soon!"
                : "Courses coming soon."}
            </p>
          </div>
        </div>
      </MemberLayout>
    );
  }

  const completedSteps = 0; // TODO: fetch from progress table
  const totalSteps = steps.length;
  const completionPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">{tabLabel}</h1>
          {funnel.description && (
            <p className="text-sm text-muted-foreground mt-1">{funnel.description}</p>
          )}
        </div>

        {/* Progress Summary */}
        <div className="glass-card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {completedSteps} of {totalSteps} steps completed
            </span>
            <span className="font-medium">{completionPct}%</span>
          </div>
          <Progress value={completionPct} className="h-2" />
        </div>

        {/* Steps List */}
        {steps.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground">No content yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isFirst = index === 0;
              const isLocked = !isFirst; // TODO: real unlock logic
              const isCompleted = false; // TODO: real progress

              return (
                <div
                  key={step.id}
                  className={`glass-card p-4 flex items-center gap-4 transition-opacity ${
                    isLocked ? "opacity-60" : ""
                  }`}
                >
                  {/* Step Number */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                      isCompleted
                        ? "bg-green-500/10 text-green-500"
                        : isLocked
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={20} /> : index + 1}
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{step.title}</h3>
                    {step.description && (
                      <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                    )}
                  </div>

                  {/* Status / Action */}
                  <div className="shrink-0">
                    {isCompleted ? (
                      <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                        <CheckCircle2 size={14} /> Done
                      </span>
                    ) : isLocked ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lock size={14} /> Locked
                      </span>
                    ) : (
                      <Button size="sm" variant="hero" className="gap-1.5">
                        <Play size={14} /> Watch
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MemberLayout>
  );
};

export default MemberHome;
