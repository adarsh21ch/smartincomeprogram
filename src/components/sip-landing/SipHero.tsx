import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useProgramSettings } from "@/hooks/useProgramSettings";

interface Props {
  getText: (section: string, key: string, fallback?: string) => string;
}

export const SipHero = ({ getText }: Props) => {
  const { settings } = useProgramSettings();
  const badge = getText("hero", "badge_text", "Private Members Community");
  const line1 = getText("hero", "headline_line1", "Build Your Income.");
  const line2 = getText("hero", "headline_line2", "Build Your Future.");
  const subtitle = getText("hero", "subtitle", "A structured learning and growth platform for driven individuals.");
  const trust1 = getText("hero", "trust_1", "🔒 Private Community");
  const trust2 = getText("hero", "trust_2", "📚 Structured Learning");
  const trust3 = getText("hero", "trust_3", "🏆 Proven System");

  const registerPageId = settings?.active_register_landing_page_id;

  const handleRegister = () => {
    if (registerPageId) {
      // Will be resolved via slug lookup
    }
  };

  return (
    <section className="sip-hero-bg min-h-screen flex items-center justify-center pt-16">
      <div className="container text-center max-w-3xl py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="sip-gold-badge mb-8 inline-block">{badge}</span>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {line1}
            <br />
            <span style={{ color: "#D4A017" }}>{line2}</span>
          </h1>

          <p
            className="text-base md:text-lg leading-relaxed mb-10 max-w-xl mx-auto"
            style={{ color: "#F5F0E8", opacity: 0.8 }}
          >
            {subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <RegisterButton settings={settings} />
            <Link to="/auth">
              <button
                className="px-8 py-3.5 rounded-lg text-base font-medium transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(212,160,23,0.4)", color: "#F0C040" }}
              >
                Login / Sign Up
              </button>
            </Link>
          </div>

          <div className="sip-gold-divider max-w-xs mx-auto mb-8" />

          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {[trust1, trust2, trust3].map((t, i) => (
              <span key={i} className="text-sm" style={{ color: "#888" }}>
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const RegisterButton = ({ settings }: { settings: any }) => {
  const { data: page } = useRegisterPage(settings?.active_register_landing_page_id);
  
  const url = page?.slug ? `/l/${page.slug}` : "/auth?tab=signup";

  return (
    <Link to={url}>
      <button
        className="px-8 py-3.5 rounded-lg text-base font-semibold transition-all hover:brightness-110"
        style={{ background: "linear-gradient(135deg, #D4A017, #A07810)", color: "#000" }}
      >
        Register for Program →
      </button>
    </Link>
  );
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const useRegisterPage = (pageId: string | null | undefined) => {
  return useQuery({
    queryKey: ["register-page-slug", pageId],
    queryFn: async () => {
      if (!pageId) return null;
      const { data } = await supabase
        .from("landing_pages")
        .select("slug")
        .eq("id", pageId)
        .single();
      return data;
    },
    enabled: !!pageId,
  });
};
