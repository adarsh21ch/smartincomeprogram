import { AdminLayout } from "@/components/layout/AdminLayout";
import { useProgramSettings } from "@/hooks/useProgramSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Loader2, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";

const AdminProgramPage = () => {
  const { settings, isLoading, updateSettings } = useProgramSettings();

  // Branding state
  const [programName, setProgramName] = useState("");
  const [programTagline, setProgramTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#D4AF37");

  // Content state
  const [heroLine1, setHeroLine1] = useState("");
  const [heroLine2, setHeroLine2] = useState("");
  const [heroSubtext, setHeroSubtext] = useState("");
  const [heroPill, setHeroPill] = useState("");
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [aboutTitle, setAboutTitle] = useState("");

  // Program flow state
  const [registerPageId, setRegisterPageId] = useState<string>("__none__");
  const [memberFunnelId, setMemberFunnelId] = useState<string>("__none__");

  // Load settings into state
  useEffect(() => {
    if (!settings) return;
    setProgramName(settings.program_name || "");
    setProgramTagline(settings.program_tagline || "");
    setPrimaryColor(settings.primary_color || "#D4AF37");
    setHeroLine1(settings.hero_headline_line1 || "");
    setHeroLine2(settings.hero_headline_line2 || "");
    setHeroSubtext(settings.hero_subtext || "");
    setHeroPill(settings.hero_pill_text || "");
    setShowIntroVideo(settings.show_intro_video_button ?? true);
    setIntroVideoUrl(settings.intro_video_url || "");
    setAboutTitle(settings.about_section_title || "");
    setRegisterPageId(settings.active_register_landing_page_id || "__none__");
    setMemberFunnelId(settings.active_member_funnel_id || "__none__");
  }, [settings]);

  // Fetch landing pages and funnels for dropdowns
  const { data: landingPages = [] } = useQuery({
    queryKey: ["admin-landing-pages-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("landing_pages")
        .select("id, title, slug, status")
        .order("title");
      return data || [];
    },
  });

  const { data: funnels = [] } = useQuery({
    queryKey: ["admin-funnels-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("funnels")
        .select("id, title, slug, is_published")
        .order("title");
      return data || [];
    },
  });

  const publishedPages = landingPages.filter((p) => p.status === "published");
  const publishedFunnels = funnels.filter((f) => f.is_published);

  const saveBranding = () => {
    updateSettings.mutate({
      program_name: programName,
      program_tagline: programTagline,
      primary_color: primaryColor,
    });
  };

  const saveContent = () => {
    updateSettings.mutate({
      hero_headline_line1: heroLine1,
      hero_headline_line2: heroLine2,
      hero_subtext: heroSubtext,
      hero_pill_text: heroPill,
      show_intro_video_button: showIntroVideo,
      intro_video_url: introVideoUrl || null,
      about_section_title: aboutTitle,
    });
  };

  const saveRegisterPage = () => {
    updateSettings.mutate({
      active_register_landing_page_id: registerPageId === "__none__" ? null : registerPageId,
    });
  };

  const saveMemberFunnel = () => {
    updateSettings.mutate({
      active_member_funnel_id: memberFunnelId === "__none__" ? null : memberFunnelId,
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      </AdminLayout>
    );
  }

  const selectedPage = landingPages.find((p) => p.id === registerPageId);
  const selectedFunnel = funnels.find((f) => f.id === memberFunnelId);

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="text-2xl font-heading font-bold">Program Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your program's branding, landing page content, and member experience.
          </p>
        </div>

        {/* Branding */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-heading font-semibold">Branding</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Program Name</Label>
              <Input value={programName} onChange={(e) => setProgramName(e.target.value)} className="mt-1 bg-muted border-border" />
            </div>
            <div>
              <Label className="text-xs">Program Tagline</Label>
              <Input value={programTagline} onChange={(e) => setProgramTagline(e.target.value)} className="mt-1 bg-muted border-border" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Primary Color</Label>
            <div className="flex items-center gap-3 mt-1">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded border border-border cursor-pointer" />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-32 bg-muted border-border font-mono text-xs" />
            </div>
          </div>
          <Button variant="hero" size="sm" onClick={saveBranding} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Branding
          </Button>
        </section>

        {/* Landing Page Content */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-heading font-semibold">Landing Page Content</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Hero Headline Line 1 (white)</Label>
              <Input value={heroLine1} onChange={(e) => setHeroLine1(e.target.value)} className="mt-1 bg-muted border-border" />
            </div>
            <div>
              <Label className="text-xs">Hero Headline Line 2 (gold/accent)</Label>
              <Input value={heroLine2} onChange={(e) => setHeroLine2(e.target.value)} className="mt-1 bg-muted border-border" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Hero Pill Text</Label>
            <Input value={heroPill} onChange={(e) => setHeroPill(e.target.value)} className="mt-1 bg-muted border-border" placeholder="e.g. PRIVATE MEMBERS COMMUNITY" />
          </div>
          <div>
            <Label className="text-xs">Hero Subtext</Label>
            <Textarea value={heroSubtext} onChange={(e) => setHeroSubtext(e.target.value)} className="mt-1 bg-muted border-border" rows={3} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={showIntroVideo} onCheckedChange={setShowIntroVideo} />
            <Label className="text-xs">Show "Watch Introduction" button</Label>
          </div>
          {showIntroVideo && (
            <div>
              <Label className="text-xs">Introduction Video URL</Label>
              <Input value={introVideoUrl} onChange={(e) => setIntroVideoUrl(e.target.value)} className="mt-1 bg-muted border-border" placeholder="https://youtube.com/..." />
            </div>
          )}
          <div>
            <Label className="text-xs">About Section Title</Label>
            <Input value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} className="mt-1 bg-muted border-border" />
          </div>
          <Button variant="hero" size="sm" onClick={saveContent} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Content
          </Button>
        </section>

        {/* Program Flow */}
        <section className="glass-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-heading font-semibold">Program Flow</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select which landing page visitors see when they click Register, and which funnel members see after joining.
            </p>
          </div>

          {/* Register Landing Page */}
          <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
            <div>
              <Label className="text-sm font-medium">Registration Landing Page</Label>
              <p className="text-xs text-muted-foreground mt-0.5">When a visitor clicks "Register for the Program", they'll be taken to this landing page.</p>
            </div>
            <Select value={registerPageId} onValueChange={setRegisterPageId}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Select a landing page..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None selected —</SelectItem>
                {publishedPages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title} ({p.slug})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {registerPageId === "__none__" ? (
              <div className="flex items-center gap-2 text-xs text-warning">
                <AlertTriangle size={14} />
                No registration page selected. The Register button will show a "coming soon" message.
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 size={14} />
                Active: {selectedPage?.title}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="hero" size="sm" onClick={saveRegisterPage} disabled={updateSettings.isPending}>
                Save
              </Button>
              {selectedPage && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`/l/${selectedPage.slug}`} target="_blank" rel="noopener">
                    <ExternalLink size={12} className="mr-1" /> Preview
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Member Funnel */}
          <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
            <div>
              <Label className="text-sm font-medium">Member Welcome Funnel</Label>
              <p className="text-xs text-muted-foreground mt-0.5">After a member registers, they'll see this funnel's content in their member dashboard.</p>
            </div>
            <Select value={memberFunnelId} onValueChange={setMemberFunnelId}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Select a funnel..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None selected —</SelectItem>
                {publishedFunnels.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {memberFunnelId === "__none__" ? (
              <div className="flex items-center gap-2 text-xs text-warning">
                <AlertTriangle size={14} />
                No funnel selected. Members will see an empty dashboard.
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 size={14} />
                Active: {selectedFunnel?.title}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="hero" size="sm" onClick={saveMemberFunnel} disabled={updateSettings.isPending}>
                Save
              </Button>
              {selectedFunnel && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`/f/${selectedFunnel.slug}`} target="_blank" rel="noopener">
                    <ExternalLink size={12} className="mr-1" /> Preview
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminProgramPage;
