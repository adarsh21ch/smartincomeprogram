import { motion } from "framer-motion";
import type { SipJourneyStep } from "@/hooks/useSipLandingData";

interface Props {
  getText: (section: string, key: string, fallback?: string) => string;
  steps: SipJourneyStep[];
}

export const SipJourney = ({ getText, steps }: Props) => {
  const heading = getText("journey", "heading", "Your Path to Success, Step by Step");

  if (!steps.length) return null;

  return (
    <section className="sip-section-alt py-20 md:py-28">
      <div className="container">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="sip-gold-badge mb-6 inline-block">The Journey</span>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            {heading}
          </h2>
        </motion.div>

        {/* Desktop horizontal */}
        <div className="hidden md:flex items-start justify-center gap-0 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              className="flex-1 flex flex-col items-center text-center px-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="relative mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{
                    background: "linear-gradient(135deg, #E8B830, #C99A18)",
                    color: "#000",
                    fontFamily: "'Playfair Display', serif",
                    boxShadow: "0 0 20px rgba(197,147,14,0.3)",
                  }}
                >
                  {step.step_number}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="absolute top-1/2 left-full w-full"
                    style={{
                      height: "1px",
                      borderTop: "2px dashed rgba(197,147,14,0.3)",
                      transform: "translateY(-50%)",
                    }}
                  />
                )}
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">{step.title}</h4>
              <p className="text-xs leading-relaxed" style={{ color: "#888" }}>{step.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Mobile vertical */}
        <div className="md:hidden max-w-sm mx-auto space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              className="flex gap-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #E8B830, #C99A18)",
                    color: "#000",
                    fontFamily: "'Playfair Display', serif",
                    boxShadow: "0 0 16px rgba(197,147,14,0.25)",
                  }}
                >
                  {step.step_number}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 my-2" style={{ borderLeft: "2px dashed rgba(197,147,14,0.25)" }} />
                )}
              </div>
              <div className="pb-8">
                <h4 className="text-sm font-semibold text-white mb-1">{step.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: "#888" }}>{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
