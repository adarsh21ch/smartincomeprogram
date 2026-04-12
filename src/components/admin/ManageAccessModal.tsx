import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Plus, X, UserMinus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface ManageAccessModalProps {
  cardId: string;
  cardTitle: string;
  open: boolean;
  onClose: () => void;
}

export const ManageAccessModal = ({ cardId, cardTitle, open, onClose }: ManageAccessModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterQuery, setFilterQuery] = useState("");

  // Fetch members with access
  const { data: accessList = [], isLoading: accessLoading } = useQuery({
    queryKey: ["training-access-list", cardId],
    queryFn: async () => {
      const { data } = await supabase
        .from("training_card_access" as any)
        .select("*, profiles:user_id(id, full_name, email)")
        .eq("training_card_id", cardId)
        .eq("is_active", true)
        .order("granted_at", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: open,
  });

  // Search profiles
  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ["search-profiles-access", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10);
      return data || [];
    },
    enabled: searchQuery.length >= 2,
  });

  const accessUserIds = new Set(accessList.map((a: any) => a.user_id));

  const grantMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("training_card_access" as any).upsert({
        training_card_id: cardId,
        user_id: userId,
        granted_by: user!.id,
        is_active: true,
        revoked_at: null,
        revoked_by: null,
      } as any, { onConflict: "training_card_id,user_id" });
      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      const member = searchResults.find((p) => p.id === userId);
      toast.success(`✅ ${member?.full_name || "Member"} now has access to ${cardTitle}`);
      queryClient.invalidateQueries({ queryKey: ["training-access-list", cardId] });
    },
    onError: () => toast.error("Failed to grant access"),
  });

  const revokeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("training_card_access" as any)
        .update({ is_active: false, revoked_at: new Date().toISOString(), revoked_by: user!.id } as any)
        .eq("training_card_id", cardId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Access removed");
      queryClient.invalidateQueries({ queryKey: ["training-access-list", cardId] });
    },
    onError: () => toast.error("Failed to remove access"),
  });

  const filteredAccess = filterQuery
    ? accessList.filter((a: any) => {
        const name = a.profiles?.full_name?.toLowerCase() || "";
        const email = a.profiles?.email?.toLowerCase() || "";
        const q = filterQuery.toLowerCase();
        return name.includes(q) || email.includes(q);
      })
    : accessList;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Manage Access — {cardTitle}</DialogTitle>
        </DialogHeader>

        {/* Search to add */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Member</p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 bg-muted border-border h-9 text-sm"
            />
          </div>

          {searching && <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>}

          {searchQuery.length >= 2 && searchResults.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {searchResults
                .filter((p) => !accessUserIds.has(p.id))
                .map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{profile.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 shrink-0"
                      onClick={() => grantMutation.mutate(profile.id)}
                      disabled={grantMutation.isPending}
                    >
                      <Plus size={12} /> Give Access
                    </Button>
                  </div>
                ))}
              {searchResults.filter((p) => !accessUserIds.has(p.id)).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">All results already have access.</p>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border my-2" />

        {/* Current members */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Members with Access ({accessList.length})
            </p>
          </div>

          {accessList.length > 5 && (
            <Input
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter by name..."
              className="bg-muted border-border h-8 text-xs"
            />
          )}

          {accessLoading ? (
            <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
          ) : filteredAccess.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No members have access yet.</p>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {filteredAccess.map((access: any) => (
                <div key={access.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{access.profiles?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">{access.profiles?.email}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Added {access.granted_at ? new Date(access.granted_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive shrink-0 gap-1"
                    onClick={() => {
                      if (confirm(`Remove ${access.profiles?.full_name}'s access to this training?`)) {
                        revokeMutation.mutate(access.user_id);
                      }
                    }}
                    disabled={revokeMutation.isPending}
                  >
                    <UserMinus size={12} /> Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
