import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GripVertical, Save } from "lucide-react";

type SipConfig = { id: string; section: string; key: string; value_text: string; value_image_url: string; value_boolean: boolean; value_number: number; };
type SipSpeaker = { id: string; name: string; title: string; bio: string; photo_url: string; achievements: string[]; instagram_url: string; youtube_url: string; display_order: number; is_active: boolean; };
type SipTestimonial = { id: string; name: string; location: string; role: string; quote: string; photo_url: string; rating: number; display_order: number; is_active: boolean; };
type SipJourneyStep = { id: string; step_number: number; title: string; description: string; display_order: number; is_active: boolean; };
type SipFaqItem = { id: string; question: string; answer: string; display_order: number; is_active: boolean; };

const TABS = ["Hero", "About", "Speakers", "Journey", "Community", "Testimonials", "FAQ", "CTA", "Disclaimer", "Footer"] as const;
type Tab = typeof TABS[number];

const AdminLandingPageManager = () => {
  const [tab, setTab] = useState<Tab>("Hero");
  const qc = useQueryClient();

  const { data: config = [] } = useQuery({
    queryKey: ["admin-sip-config"],
    queryFn: async () => {
      const { data } = await supabase.from("sip_landing_page_config").select("*");
      return (data || []) as SipConfig[];
    },
  });

  const { data: speakers = [] } = useQuery({
    queryKey: ["admin-sip-speakers"],
    queryFn: async () => {
      const { data } = await supabase.from("sip_speakers").select("*").order("display_order");
      return (data || []) as SipSpeaker[];
    },
  });

  const { data: testimonials = [] } = useQuery({
    queryKey: ["admin-sip-testimonials"],
    queryFn: async () => {
      const { data } = await supabase.from("sip_testimonials").select("*").order("display_order");
      return (data || []) as SipTestimonial[];
    },
  });

  const { data: journeySteps = [] } = useQuery({
    queryKey: ["admin-sip-journey"],
    queryFn: async () => {
      const { data } = await supabase.from("sip_journey_steps").select("*").order("display_order");
      return (data || []) as SipJourneyStep[];
    },
  });

  const { data: faqItems = [] } = useQuery({
    queryKey: ["admin-sip-faq"],
    queryFn: async () => {
      const { data } = await supabase.from("sip_faq_items").select("*").order("display_order");
      return (data || []) as SipFaqItem[];
    },
  });

  const getText = (section: string, key: string): string => {
    return config.find((c) => c.section === section && c.key === key)?.value_text || "";
  };

  const saveConfig = async (section: string, key: string, value: string) => {
    const { error } = await supabase
      .from("sip_landing_page_config")
      .upsert({ section, key, value_text: value, updated_at: new Date().toISOString() }, { onConflict: "section,key" });
    if (error) throw error;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold">Landing Page Manager</h1>
          <Button size="sm" variant="outline" asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">Open Preview ↗</a>
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="glass-card p-6">
          {tab === "Hero" && <HeroEditor getText={getText} saveConfig={saveConfig} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-sip-config"] })} />}
          {tab === "About" && <AboutEditor getText={getText} saveConfig={saveConfig} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-sip-config"] })} />}
          {tab === "Speakers" && <SpeakersEditor speakers={speakers} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-sip-speakers"] })} getText={getText} saveConfig={saveConfig} onConfigSaved={() => qc.invalidateQueries({ queryKey: ["admin-sip-config"] })} />}
          {tab === "Journey" && <JourneyEditor steps={journeySteps} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-sip-journey"] })} getText={getText} saveConfig={saveConfig} onConfigSaved={() => qc.invalidateQueries({ queryKey: ["admin-sip-config"] })} />}
          {tab === "Community" && <CommunityEditor getText={getText} saveConfig={saveConfig} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-sip-config"] })} />}
          {tab === "Testimonials" && <TestimonialsEditor testimonials={testimonials} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-sip-testimonials"] })} getText={getText} saveConfig={saveConfig} onConfigSaved={() => qc.invalidateQueries({ queryKey: ["admin-sip-config"] })} />}
          {tab === "FAQ" && <FaqEditor faqItems={faqItems} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-sip-faq"] })} getText={getText} saveConfig={saveConfig} onConfigSaved={() => qc.invalidateQueries({ queryKey: ["admin-sip-config"] })} />}
          {tab === "CTA" && <CtaEditor getText={getText} saveConfig={saveConfig} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-sip-config"] })} />}
          {tab === "Disclaimer" && <DisclaimerEditor getText={getText} saveConfig={saveConfig} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-sip-config"] })} />}
          {tab === "Footer" && <FooterEditor getText={getText} saveConfig={saveConfig} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-sip-config"] })} />}
        </div>
      </div>
    </AdminLayout>
  );
};

// ============== Section Editors ==============

function ConfigField({ label, section, keyName, getText, saveConfig, onSaved, multiline = false }: { label: string; section: string; keyName: string; getText: (s: string, k: string) => string; saveConfig: (s: string, k: string, v: string) => Promise<void>; onSaved: () => void; multiline?: boolean }) {
  const [val, setVal] = useState(getText(section, keyName));
  useEffect(() => { setVal(getText(section, keyName)); }, [getText(section, keyName)]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try { await saveConfig(section, keyName, val); onSaved(); toast.success("Saved"); } catch { toast.error("Save failed"); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        {multiline ? (
          <Textarea value={val} onChange={(e) => setVal(e.target.value)} className="bg-muted min-h-[80px]" />
        ) : (
          <Input value={val} onChange={(e) => setVal(e.target.value)} className="bg-muted" />
        )}
        <Button size="sm" variant="outline" onClick={save} disabled={saving}><Save size={14} /></Button>
      </div>
    </div>
  );
}

function HeroEditor({ getText, saveConfig, onSaved }: { getText: (s: string, k: string) => string; saveConfig: (s: string, k: string, v: string) => Promise<void>; onSaved: () => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Hero Section</h3>
      <ConfigField label="Badge Text" section="hero" keyName="badge_text" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="Headline Line 1" section="hero" keyName="headline_line1" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="Headline Line 2" section="hero" keyName="headline_line2" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="Subtitle" section="hero" keyName="subtitle" getText={getText} saveConfig={saveConfig} onSaved={onSaved} multiline />
      <ConfigField label="Primary Button Text" section="hero" keyName="primary_button_text" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="Secondary Button Text" section="hero" keyName="secondary_button_text" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="Secondary Button URL" section="hero" keyName="secondary_button_url" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="Trust Indicator 1" section="hero" keyName="trust_1" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="Trust Indicator 2" section="hero" keyName="trust_2" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="Trust Indicator 3" section="hero" keyName="trust_3" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
    </div>
  );
}

function AboutEditor({ getText, saveConfig, onSaved }: { getText: (s: string, k: string) => string; saveConfig: (s: string, k: string, v: string) => Promise<void>; onSaved: () => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">About Section</h3>
      <ConfigField label="Heading" section="about" keyName="heading" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="Body (separate paragraphs with blank lines)" section="about" keyName="body" getText={getText} saveConfig={saveConfig} onSaved={onSaved} multiline />
      <ConfigField label="Image URL" section="about" keyName="image_url" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      {[1,2,3,4].map(n => (
        <div key={n} className="p-4 rounded-lg bg-muted/50 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Feature {n}</p>
          <ConfigField label="Icon (emoji)" section="about" keyName={`feature_${n}_icon`} getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
          <ConfigField label="Title" section="about" keyName={`feature_${n}_title`} getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
          <ConfigField label="Description" section="about" keyName={`feature_${n}_desc`} getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
        </div>
      ))}
    </div>
  );
}

function CommunityEditor({ getText, saveConfig, onSaved }: { getText: (s: string, k: string) => string; saveConfig: (s: string, k: string, v: string) => Promise<void>; onSaved: () => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Community Section</h3>
      <ConfigField label="Heading" section="community" keyName="heading" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="Body Text" section="community" keyName="body" getText={getText} saveConfig={saveConfig} onSaved={onSaved} multiline />
      {[1,2,3].map(n => (
        <div key={n} className="p-4 rounded-lg bg-muted/50 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Feature {n}</p>
          <ConfigField label="Icon" section="community" keyName={`feature_${n}_icon`} getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
          <ConfigField label="Title" section="community" keyName={`feature_${n}_title`} getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
          <ConfigField label="Description" section="community" keyName={`feature_${n}_desc`} getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
        </div>
      ))}
      <ConfigField label="CTA Button Text" section="community" keyName="cta_text" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="CTA Button URL" section="community" keyName="cta_url" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
    </div>
  );
}

function CtaEditor({ getText, saveConfig, onSaved }: { getText: (s: string, k: string) => string; saveConfig: (s: string, k: string, v: string) => Promise<void>; onSaved: () => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">CTA Section</h3>
      <ConfigField label="Heading" section="cta" keyName="heading" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="Subtitle" section="cta" keyName="subtitle" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="Button Text" section="cta" keyName="button_text" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="Button URL" section="cta" keyName="button_url" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
    </div>
  );
}

function DisclaimerEditor({ getText, saveConfig, onSaved }: { getText: (s: string, k: string) => string; saveConfig: (s: string, k: string, v: string) => Promise<void>; onSaved: () => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Disclaimer</h3>
      <ConfigField label="Show Disclaimer (true/false)" section="disclaimer" keyName="show" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
      <ConfigField label="Content (separate paragraphs with blank lines)" section="disclaimer" keyName="content" getText={getText} saveConfig={saveConfig} onSaved={onSaved} multiline />
    </div>
  );
}

function FooterEditor({ getText, saveConfig, onSaved }: { getText: (s: string, k: string) => string; saveConfig: (s: string, k: string, v: string) => Promise<void>; onSaved: () => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Footer</h3>
      <ConfigField label="Tagline" section="footer" keyName="tagline" getText={getText} saveConfig={saveConfig} onSaved={onSaved} />
    </div>
  );
}

// ============== CRUD Editors ==============

function SpeakersEditor({ speakers, onSaved, getText, saveConfig, onConfigSaved }: { speakers: SipSpeaker[]; onSaved: () => void; getText: (s: string, k: string) => string; saveConfig: (s: string, k: string, v: string) => Promise<void>; onConfigSaved: () => void }) {
  const addSpeaker = async () => {
    const { error } = await supabase.from("sip_speakers").insert({ name: "New Speaker", title: "Title", display_order: speakers.length });
    if (error) { toast.error(error.message); return; }
    toast.success("Speaker added"); onSaved();
  };
  const deleteSpeaker = async (id: string) => {
    await supabase.from("sip_speakers").delete().eq("id", id);
    toast.success("Deleted"); onSaved();
  };
  const updateSpeaker = async (id: string, field: string, value: any) => {
    await supabase.from("sip_speakers").update({ [field]: value } as any).eq("id", id);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Speakers</h3>
        <Button size="sm" onClick={addSpeaker}><Plus size={14} className="mr-1" /> Add Speaker</Button>
      </div>
      <ConfigField label="Section Heading" section="speakers" keyName="heading" getText={getText} saveConfig={saveConfig} onSaved={onConfigSaved} />
      {speakers.map((s) => (
        <div key={s.id} className="p-4 rounded-lg bg-muted/30 space-y-3 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{s.name}</span>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteSpeaker(s.id)}><Trash2 size={14} /></Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Name</Label><Input defaultValue={s.name} className="bg-muted" onBlur={(e) => updateSpeaker(s.id, "name", e.target.value)} /></div>
            <div><Label className="text-xs">Title</Label><Input defaultValue={s.title} className="bg-muted" onBlur={(e) => updateSpeaker(s.id, "title", e.target.value)} /></div>
          </div>
          <div><Label className="text-xs">Bio</Label><Textarea defaultValue={s.bio} className="bg-muted" onBlur={(e) => updateSpeaker(s.id, "bio", e.target.value)} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Photo URL</Label><Input defaultValue={s.photo_url} className="bg-muted" onBlur={(e) => updateSpeaker(s.id, "photo_url", e.target.value)} /></div>
            <div><Label className="text-xs">Instagram URL</Label><Input defaultValue={s.instagram_url} className="bg-muted" onBlur={(e) => updateSpeaker(s.id, "instagram_url", e.target.value)} /></div>
          </div>
          <div><Label className="text-xs">Achievements (comma-separated)</Label><Input defaultValue={(s.achievements || []).join(", ")} className="bg-muted" onBlur={(e) => updateSpeaker(s.id, "achievements", e.target.value.split(",").map(a => a.trim()).filter(Boolean))} /></div>
          <div className="flex items-center gap-2">
            <Switch checked={s.is_active} onCheckedChange={(v) => updateSpeaker(s.id, "is_active", v)} />
            <Label className="text-xs">Active</Label>
          </div>
        </div>
      ))}
    </div>
  );
}

function TestimonialsEditor({ testimonials, onSaved, getText, saveConfig, onConfigSaved }: { testimonials: SipTestimonial[]; onSaved: () => void; getText: (s: string, k: string) => string; saveConfig: (s: string, k: string, v: string) => Promise<void>; onConfigSaved: () => void }) {
  const addTestimonial = async () => {
    await supabase.from("sip_testimonials").insert({ name: "New Member", quote: "Great program!", display_order: testimonials.length });
    toast.success("Testimonial added"); onSaved();
  };
  const deleteTestimonial = async (id: string) => {
    await supabase.from("sip_testimonials").delete().eq("id", id);
    toast.success("Deleted"); onSaved();
  };
  const update = async (id: string, field: string, value: any) => {
    await supabase.from("sip_testimonials").update({ [field]: value }).eq("id", id);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Testimonials</h3>
        <Button size="sm" onClick={addTestimonial}><Plus size={14} className="mr-1" /> Add</Button>
      </div>
      <ConfigField label="Section Heading" section="testimonials" keyName="heading" getText={getText} saveConfig={saveConfig} onSaved={onConfigSaved} />
      {testimonials.map((t) => (
        <div key={t.id} className="p-4 rounded-lg bg-muted/30 space-y-3 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t.name}</span>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteTestimonial(t.id)}><Trash2 size={14} /></Button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div><Label className="text-xs">Name</Label><Input defaultValue={t.name} className="bg-muted" onBlur={(e) => update(t.id, "name", e.target.value)} /></div>
            <div><Label className="text-xs">Location</Label><Input defaultValue={t.location} className="bg-muted" onBlur={(e) => update(t.id, "location", e.target.value)} /></div>
            <div><Label className="text-xs">Role</Label><Input defaultValue={t.role} className="bg-muted" onBlur={(e) => update(t.id, "role", e.target.value)} /></div>
          </div>
          <div><Label className="text-xs">Quote</Label><Textarea defaultValue={t.quote} className="bg-muted" onBlur={(e) => update(t.id, "quote", e.target.value)} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Photo URL</Label><Input defaultValue={t.photo_url} className="bg-muted" onBlur={(e) => update(t.id, "photo_url", e.target.value)} /></div>
            <div><Label className="text-xs">Rating (1-5)</Label><Input type="number" min={1} max={5} defaultValue={t.rating} className="bg-muted" onBlur={(e) => update(t.id, "rating", parseInt(e.target.value))} /></div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={t.is_active} onCheckedChange={(v) => update(t.id, "is_active", v)} />
            <Label className="text-xs">Active</Label>
          </div>
        </div>
      ))}
    </div>
  );
}

function JourneyEditor({ steps, onSaved, getText, saveConfig, onConfigSaved }: { steps: SipJourneyStep[]; onSaved: () => void; getText: (s: string, k: string) => string; saveConfig: (s: string, k: string, v: string) => Promise<void>; onConfigSaved: () => void }) {
  const addStep = async () => {
    await supabase.from("sip_journey_steps").insert({ step_number: steps.length + 1, title: "New Step", description: "", display_order: steps.length });
    toast.success("Step added"); onSaved();
  };
  const deleteStep = async (id: string) => {
    await supabase.from("sip_journey_steps").delete().eq("id", id);
    toast.success("Deleted"); onSaved();
  };
  const update = async (id: string, field: string, value: any) => {
    await supabase.from("sip_journey_steps").update({ [field]: value }).eq("id", id);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Journey Steps</h3>
        <Button size="sm" onClick={addStep}><Plus size={14} className="mr-1" /> Add Step</Button>
      </div>
      <ConfigField label="Section Heading" section="journey" keyName="heading" getText={getText} saveConfig={saveConfig} onSaved={onConfigSaved} />
      {steps.map((s) => (
        <div key={s.id} className="p-4 rounded-lg bg-muted/30 space-y-3 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Step {s.step_number}: {s.title}</span>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteStep(s.id)}><Trash2 size={14} /></Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Step Number</Label><Input type="number" defaultValue={s.step_number} className="bg-muted" onBlur={(e) => update(s.id, "step_number", parseInt(e.target.value))} /></div>
            <div><Label className="text-xs">Title</Label><Input defaultValue={s.title} className="bg-muted" onBlur={(e) => update(s.id, "title", e.target.value)} /></div>
          </div>
          <div><Label className="text-xs">Description</Label><Textarea defaultValue={s.description} className="bg-muted" onBlur={(e) => update(s.id, "description", e.target.value)} /></div>
          <div className="flex items-center gap-2">
            <Switch checked={s.is_active} onCheckedChange={(v) => update(s.id, "is_active", v)} />
            <Label className="text-xs">Active</Label>
          </div>
        </div>
      ))}
    </div>
  );
}

function FaqEditor({ faqItems, onSaved, getText, saveConfig, onConfigSaved }: { faqItems: SipFaqItem[]; onSaved: () => void; getText: (s: string, k: string) => string; saveConfig: (s: string, k: string, v: string) => Promise<void>; onConfigSaved: () => void }) {
  const addFaq = async () => {
    await supabase.from("sip_faq_items").insert({ question: "New Question?", answer: "Answer here.", display_order: faqItems.length });
    toast.success("FAQ added"); onSaved();
  };
  const deleteFaq = async (id: string) => {
    await supabase.from("sip_faq_items").delete().eq("id", id);
    toast.success("Deleted"); onSaved();
  };
  const update = async (id: string, field: string, value: any) => {
    await supabase.from("sip_faq_items").update({ [field]: value }).eq("id", id);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">FAQ Items</h3>
        <Button size="sm" onClick={addFaq}><Plus size={14} className="mr-1" /> Add FAQ</Button>
      </div>
      <ConfigField label="Section Heading" section="faq" keyName="heading" getText={getText} saveConfig={saveConfig} onSaved={onConfigSaved} />
      {faqItems.map((f) => (
        <div key={f.id} className="p-4 rounded-lg bg-muted/30 space-y-3 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate max-w-[300px]">{f.question}</span>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteFaq(f.id)}><Trash2 size={14} /></Button>
          </div>
          <div><Label className="text-xs">Question</Label><Input defaultValue={f.question} className="bg-muted" onBlur={(e) => update(f.id, "question", e.target.value)} /></div>
          <div><Label className="text-xs">Answer</Label><Textarea defaultValue={f.answer} className="bg-muted" onBlur={(e) => update(f.id, "answer", e.target.value)} /></div>
          <div className="flex items-center gap-2">
            <Switch checked={f.is_active} onCheckedChange={(v) => update(f.id, "is_active", v)} />
            <Label className="text-xs">Active</Label>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminLandingPageManager;
