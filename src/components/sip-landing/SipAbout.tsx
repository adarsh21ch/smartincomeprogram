import { motion } from "framer-motion";

interface Props {
  getText: (section: string, key: string, fallback?: string) => string;
}

export const SipAbout = ({ getText }: Props) => {
  const heading = getText("about", "heading", "What is Smart Income Program?");
  const body = getText("about", "body", "");
  const imageUrl = getText("about", "image_url", "");

  const features = [1, 2, 3, 4].map((n) => ({
    icon: getText("about", `feature_${n}_icon`, ""),
    title: getText("about", `feature_${n}_title`, ""),
    desc: getText("about", `feature_${n}_desc`, ""),
  }));

  return (
    <section className="sip-section-alt py-20 md:py-28">
      <div className="container">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="sip-gold-badge mb-6 inline-block">About the Program</span>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            {heading}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {body.split("\n\n").map((p, i) => (
              <p key={i} className="text-sm md:text-base leading-relaxed mb-4" style={{ color: "#bbb" }}>
                {p}
              </p>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Smart Income Program"
                className="rounded-2xl mb-8 w-full object-cover"
                style={{ border: "1px solid rgba(197,147,14,0.15)" }}
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              {features.filter(f => f.title).map((f, i) => (
                <div
                  key={i}
                  className="sip-card p-5"
                  style={{ borderRadius: "16px" }}
                >
                  <span className="text-2xl mb-2 block">{f.icon}</span>
                  <h4 className="text-sm font-semibold text-white mb-1">{f.title}</h4>
                  <p className="text-xs" style={{ color: "#888" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
