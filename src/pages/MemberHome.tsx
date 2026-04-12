import { useState } from "react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AboutTab } from "@/components/member/AboutTab";
import { CoursesTab } from "@/components/member/CoursesTab";
import { ProfileTab } from "@/components/member/ProfileTab";
import { ProgramTab, RichStepData } from "@/components/member/ProgramTab";
import { CompletionCard } from "@/components/member/CompletionCard";
import { useNavigate } from "react-router-dom";

interface MemberHomeProps {
  tab: "about" | "program" | "courses" | "profile";
}

const MemberHome = ({ tab }: MemberHomeProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: ["member-content", "program", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-member-content", {
        body: { type: "program" },
      });
      if (error) {
        // If 401/session expired, sign out and redirect
        if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
          await supabase.auth.signOut();
          throw new Error("SESSION_EXPIRED");
        }
        throw error;
      }
      return data as {
        funnel: any;
        creatorProfile?: any;
        steps: RichStepData[];
        overall_completion_percent: number;
        streak: number;
        last_active: string | null;
      };
    },
    enabled: !!user && tab !== "courses",
  });

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

  const contentError = (tab === "about" || tab === "program") ? content === undefined && !contentLoading : false;
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

  if (tab === "about") {
    return (
      <MemberLayout>
        <AboutTab settings={settings} content={content} onContinue={() => navigate("/home/program")} />
      </MemberLayout>
    );
  }

  if (tab === "courses") {
    return (
      <MemberLayout>
        <CoursesTab />
      </MemberLayout>
    );
  }

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

  const tabTitle = (settings as any)?.program_tab_title || "Your Program";

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
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-heading font-bold">{tabTitle}</h1>
          {funnel.description && (
            <p className="text-sm text-muted-foreground mt-1">{funnel.description}</p>
          )}
        </div>

        <ProgramTab
          funnel={funnel}
          steps={steps}
          completionPct={completionPct}
          creatorProfile={content?.creatorProfile}
          onStepComplete={handleStepComplete}
        />
      </div>
    </MemberLayout>
  );
};

export default MemberHome;
