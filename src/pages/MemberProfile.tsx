import { useState, useEffect } from "react";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Lock } from "lucide-react";
import { format } from "date-fns";

const MemberProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "" });

  // Password change
  const [pwForm, setPwForm] = useState({ newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    setLoading(false);
    if (error) { toast.error("Failed to save"); return; }
    await refreshProfile();
    toast.success("Profile updated!");
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPassword });
    setPwLoading(false);
    if (error) { toast.error(error.message); return; }
    setPwForm({ newPassword: "", confirmPassword: "" });
    toast.success("Password updated!");
  };

  const memberSince = user?.created_at ? format(new Date(user.created_at), "d MMM yyyy") : "—";

  return (
    <MemberLayout>
      <div className="max-w-lg space-y-6">
        <h1 className="text-2xl font-heading font-bold">My Profile</h1>

        {/* Profile Info */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={28} className="text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-semibold">{profile?.full_name || "Member"}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <p className="text-xs text-muted-foreground">Member since {memberSince}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm">Full Name</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="mt-1 bg-muted border-border"
              />
            </div>
            <div>
              <Label className="text-sm">Email</Label>
              <Input value={profile?.email || ""} disabled className="mt-1 bg-muted border-border opacity-60" />
              <p className="text-[10px] text-muted-foreground mt-0.5">Email cannot be changed</p>
            </div>
            <div>
              <Label className="text-sm">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 bg-muted border-border"
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <Button variant="hero" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Change Password */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-muted-foreground" />
            <h3 className="font-heading font-semibold">Change Password</h3>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm">New Password</Label>
              <Input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                className="mt-1 bg-muted border-border"
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <Label className="text-sm">Confirm New Password</Label>
              <Input
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                className="mt-1 bg-muted border-border"
                placeholder="Repeat password"
              />
            </div>
          </div>

          <Button variant="outline" onClick={handlePasswordChange} disabled={pwLoading}>
            {pwLoading ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>
    </MemberLayout>
  );
};

export default MemberProfile;
