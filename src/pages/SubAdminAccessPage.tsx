import { useState } from "react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ManageAccessModal } from "@/components/admin/ManageAccessModal";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CourseCard {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  badge_text: string;
}

const SubAdminAccessPage = () => {
  const { user } = useAuth();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCardTitle, setSelectedCardTitle] = useState("");

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["course-cards-subadmin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("course_cards" as any)
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      return (data as any as CourseCard[]) || [];
    },
  });

  // Fetch access counts
  const { data: accessCounts = {} } = useQuery({
    queryKey: ["training-access-counts-subadmin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("training_card_access" as any)
        .select("training_card_id")
        .eq("is_active", true);
      const counts: Record<string, number> = {};
      (data as any[] || []).forEach((row: any) => {
        counts[row.training_card_id] = (counts[row.training_card_id] || 0) + 1;
      });
      return counts;
    },
  });

  if (isLoading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="space-y-5 max-w-lg mx-auto w-full">
        <div>
          <h1 className="text-xl font-heading font-bold">Manage Training Access</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Grant or revoke member access to training programs.
          </p>
        </div>

        <div className="space-y-3">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => { setSelectedCardId(card.id); setSelectedCardTitle(card.title); }}
              className="w-full rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{card.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{card.title}</p>
                  <p className="text-xs text-muted-foreground">{card.badge_text} · {accessCounts[card.id] || 0} members</p>
                </div>
                <span className="text-xs text-primary font-medium">Manage →</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedCardId && (
        <ManageAccessModal
          cardId={selectedCardId}
          cardTitle={selectedCardTitle}
          open={!!selectedCardId}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </MemberLayout>
  );
};

export default SubAdminAccessPage;
