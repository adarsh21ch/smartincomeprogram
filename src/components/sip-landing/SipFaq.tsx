import { motion } from "framer-motion";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { SipFaqItem } from "@/hooks/useSipLandingData";

interface Props {
  getText: (section: string, key: string, fallback?: string) => string;
  faqItems: SipFaqItem[];
}

export const SipFaq = ({ getText, faqItems }: Props) => {
  const heading = getText("faq", "heading", "Frequently Asked Questions");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (!faqItems.length) return null;

  return (
    <section className="sip-section-alt py-20 md:py-28">
      <div className="container max-w-2xl">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="sip-gold-badge mb-6 inline-block">Common Questions</span>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            {heading}
          </h2>
        </motion.div>

        <div className="space-y-2">
          {faqItems.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <motion.div
                key={item.id}
                className="overflow-hidden transition-all"
                style={{
                  border: `1px solid ${isOpen ? "rgba(197,147,14,0.3)" : "rgba(197,147,14,0.1)"}`,
                  borderRadius: "12px",
                }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                >
                  <span className="text-sm font-medium text-white pr-4">{item.question}</span>
                  <Plus
                    size={20}
                    className="shrink-0 transition-transform duration-200"
                    style={{
                      color: "#C5930E",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{ maxHeight: isOpen ? "300px" : "0px" }}
                >
                  <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "#888" }}>
                    {item.answer}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
