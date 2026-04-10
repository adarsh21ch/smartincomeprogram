import { motion } from "framer-motion";
import { Instagram, Youtube } from "lucide-react";
import type { SipSpeaker } from "@/hooks/useSipLandingData";

interface Props {
  getText: (section: string, key: string, fallback?: string) => string;
  speakers: SipSpeaker[];
}

export const SipSpeakers = ({ getText, speakers }: Props) => {
  const heading = getText("speakers", "heading", "Learn From Those Who Have Done It");

  if (!speakers.length) return null;

  return (
    <section className="py-20 md:py-28" style={{ background: "#050505" }}>
      <div className="container">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="sip-gold-badge mb-6 inline-block">Meet the Leaders</span>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            {heading}
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {speakers.map((speaker, i) => (
            <motion.div
              key={speaker.id}
              className="sip-card p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              {speaker.photo_url ? (
                <img
                  src={speaker.photo_url}
                  alt={speaker.name}
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                  style={{ border: "2px solid rgba(197,147,14,0.4)" }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
                  style={{ background: "#181818", border: "2px solid rgba(197,147,14,0.4)", color: "#E8B830" }}
                >
                  {speaker.name.charAt(0)}
                </div>
              )}

              <h3
                className="text-xl font-bold text-white mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {speaker.name}
              </h3>
              <p className="text-sm mb-4" style={{ color: "#E8B830" }}>{speaker.title}</p>

              <div className="sip-gold-divider mb-4" />

              {speaker.bio && (
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#888" }}>{speaker.bio}</p>
              )}

              {speaker.achievements && speaker.achievements.length > 0 && (
                <div className="text-left space-y-2 mb-4">
                  {speaker.achievements.map((a, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ background: "#E8B830" }}
                      />
                      <span className="text-xs" style={{ color: "#888" }}>{a}</span>
                    </div>
                  ))}
                </div>
              )}

              {(speaker.instagram_url || speaker.youtube_url) && (
                <div className="flex justify-center gap-3 mt-auto">
                  {speaker.instagram_url && (
                    <a href={speaker.instagram_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-gold transition-colors">
                      <Instagram size={18} />
                    </a>
                  )}
                  {speaker.youtube_url && (
                    <a href={speaker.youtube_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-gold transition-colors">
                      <Youtube size={18} />
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
