import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { SipTestimonial } from "@/hooks/useSipLandingData";

interface Props {
  getText: (section: string, key: string, fallback?: string) => string;
  testimonials: SipTestimonial[];
}

export const SipTestimonials = ({ getText, testimonials }: Props) => {
  const heading = getText("testimonials", "heading", "What Our Members Say");

  if (!testimonials.length) return null;

  return (
    <section className="py-20 md:py-28" style={{ background: "#050505" }}>
      <div className="container">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="sip-gold-badge mb-6 inline-block">Success Stories</span>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            {heading}
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              className="relative p-7"
              style={{
                background: "#111111",
                border: "1px solid rgba(197,147,14,0.1)",
                borderRadius: "16px",
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              {/* Decorative quote */}
              <span
                className="absolute top-4 left-6 text-6xl leading-none select-none"
                style={{ color: "rgba(197,147,14,0.15)", fontFamily: "'Playfair Display', serif" }}
              >
                "
              </span>

              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} fill="#E8B830" stroke="#E8B830" />
                ))}
              </div>

              <p className="text-sm leading-relaxed mb-5 pt-2" style={{ color: "#ccc" }}>
                "{t.quote}"
              </p>

              <div className="sip-gold-divider mb-4" />

              <div className="flex items-center gap-3">
                {t.photo_url ? (
                  <img src={t.photo_url} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: "#181818", color: "#E8B830" }}
                  >
                    {t.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs" style={{ color: "#666" }}>
                    {[t.location, t.role].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
