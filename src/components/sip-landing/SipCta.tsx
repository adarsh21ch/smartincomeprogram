import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProgramSettings } from "@/hooks/useProgramSettings";

interface Props {
  getText: (section: string, key: string, fallback?: string) => string;
}

export const SipCta = ({ getText }: Props) => {
  const { settings } = useProgramSettings();
  const heading = getText("cta", "heading", "Ready to Build Your Income?");
  const subtitle = getText("cta", "subtitle", "Join the Smart Income Program and start your journey today.");

  const pageId = settings?.active_register_landing_page_id;
  const { data: page } = useQuery({
    queryKey: ["register-page-slug-cta", pageId],
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

  const registerUrl = page?.slug ? `/l/${page.slug}` : "/auth?tab=signup";

  return (
    <section className="relative py-20 md:py-28 sip-gold-glow" style={{ background: "#050505" }}>
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(197,147,14,0.3), transparent)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(197,147,14,0.3), transparent)" }}
      />
      <div className="container text-center max-w-2xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {heading}
          </h2>
          <p className="text-base mb-10" style={{ color: "#F5F0E8", opacity: 0.7 }}>
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={registerUrl}>
              <button
                className="px-10 py-4 rounded-lg text-base font-semibold transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #C5930E, #8B6914)", color: "#000" }}
              >
                Register for Program →
              </button>
            </Link>
            <Link to="/auth">
              <button
                className="px-10 py-4 rounded-lg text-base font-medium transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(197,147,14,0.4)", color: "#D4A520" }}
              >
                Login / Sign Up
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
