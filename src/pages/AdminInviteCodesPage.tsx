import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Search, Plus, Trash2, XCircle, CheckCircle2, Users, Copy, Eye } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

const AdminInviteCodesPage = () => {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewUsersCode, setViewUsersCode] = useState<any>(null);
  const queryClient = useQueryClient();

  // Form state
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("999999");
  const [newExpiry, setNewExpiry] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: codes = [] } = useQuery({
    queryKey: ["admin-invite-codes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invite_codes")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: codeUses = [] } = useQuery({
    queryKey: ["admin-invite-code-uses", viewUsersCode?.id],
    queryFn: async () => {
      if (!viewUsersCode) return [];
      const { data } = await supabase
        .from("invite_code_uses")
        .select("*")
        .eq("invite_code_id", viewUsersCode.id)
        .order("used_at", { ascending: false });
      return data || [];
    },
    enabled: !!viewUsersCode,
  });

  const filtered = codes.filter((c: any) => {
    if (!search) return true;
    return c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.label || "").toLowerCase().includes(search.toLowerCase());
  });

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "SIP";
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setNewCode(code);
  };

  const handleCreate = async () => {
    const code = newCode.trim().toUpperCase();
    if (!code) { toast.error("Please enter a code"); return; }
    setCreating(true);
    try {
      const { error } = await supabase.from("invite_codes").insert({
        code,
        label: newLabel.trim(),
        max_uses: parseInt(newMaxUses) || 999999,
        expires_at: newExpiry ? new Date(newExpiry).toISOString() : null,
        is_active: true,
        current_uses: 0,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Invite code created!");
      setCreateOpen(false);
      setNewCode("");
      setNewLabel("");
      setNewMaxUses("999999");
      setNewExpiry("");
      queryClient.invalidateQueries({ queryKey: ["admin-invite-codes"] });
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    await supabase.from("invite_codes").update({ is_active: false }).eq("id", id);
    toast.success("Code deactivated");
    queryClient.invalidateQueries({ queryKey: ["admin-invite-codes"] });
  };

  const handleDelete = async (id: string) => {
    await supabase.from("invite_codes").delete().eq("id", id);
    toast.success("Code deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-invite-codes"] });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold">Invite Codes</h1>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Create Invite Code
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Codes</p>
            <p className="text-2xl font-heading font-bold">{codes.length}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Active</p>
            <p className="text-2xl font-heading font-bold text-primary">{codes.filter((c: any) => c.is_active).length}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Uses</p>
            <p className="text-2xl font-heading font-bold">{codes.reduce((a: number, c: any) => a + (c.current_uses || 0), 0)}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Expired/Maxed</p>
            <p className="text-2xl font-heading font-bold text-muted-foreground">
              {codes.filter((c: any) => !c.is_active || (c.current_uses >= c.max_uses)).length}
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search codes..." className="pl-9 bg-muted border-border" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 text-xs text-muted-foreground font-medium">Code</th>
                  <th className="p-4 text-xs text-muted-foreground font-medium">Label</th>
                  <th className="p-4 text-xs text-muted-foreground font-medium">Uses</th>
                  <th className="p-4 text-xs text-muted-foreground font-medium">Expires</th>
                  <th className="p-4 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="p-4 text-xs text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => {
                  const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
                  const isMaxed = c.current_uses >= c.max_uses;
                  const isActive = c.is_active && !isExpired && !isMaxed;
                  return (
                    <tr key={c.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-foreground">{c.code}</code>
                          <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground">
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{c.label || "—"}</td>
                      <td className="p-4">
                        {c.current_uses}/{c.max_uses >= 999999 ? "∞" : c.max_uses}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {c.expires_at ? format(new Date(c.expires_at), "dd MMM yyyy") : "Never"}
                      </td>
                      <td className="p-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={10} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            <XCircle size={10} /> {isExpired ? "Expired" : isMaxed ? "Maxed" : "Inactive"}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setViewUsersCode(c)}>
                            <Eye size={12} /> Users
                          </Button>
                          {c.is_active && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-600" onClick={() => handleDeactivate(c.id)}>
                              Deactivate
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleDelete(c.id)}>
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">No invite codes found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Invite Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Code *</Label>
              <div className="flex gap-2">
                <Input placeholder="e.g. SIP2025" className="uppercase" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} />
                <Button variant="outline" size="sm" onClick={generateRandomCode}>Random</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Label (internal note)</Label>
              <Input placeholder="e.g. Main registration code" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Max Uses</Label>
              <Input type="number" placeholder="999999 for unlimited" value={newMaxUses} onChange={(e) => setNewMaxUses(e.target.value)} />
              <p className="text-xs text-muted-foreground">Set 999999 for effectively unlimited</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Expiry Date (optional)</Label>
              <Input type="date" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create Code"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Users Modal */}
      <Dialog open={!!viewUsersCode} onOpenChange={() => setViewUsersCode(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Users who used "{viewUsersCode?.code}" ({codeUses.length} users)</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {codeUses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users have used this code yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-3 text-left text-xs text-muted-foreground">Email</th>
                    <th className="p-3 text-left text-xs text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {codeUses.map((u: any) => (
                    <tr key={u.id} className="border-b border-border">
                      <td className="p-3">{u.user_email || "—"}</td>
                      <td className="p-3 text-muted-foreground">
                        {u.used_at ? format(new Date(u.used_at), "dd MMM yyyy") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminInviteCodesPage;
