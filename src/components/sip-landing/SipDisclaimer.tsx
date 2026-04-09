interface Props {
  getText: (section: string, key: string, fallback?: string) => string;
}

export const SipDisclaimer = ({ getText }: Props) => {
  const show = getText("disclaimer", "show", "true");
  const content = getText("disclaimer", "content", "");

  if (show !== "true" || !content) return null;

  return (
    <section className="py-12" style={{ background: "#050505" }}>
      <div className="container max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
          Disclaimer
        </p>
        <div className="sip-gold-divider mb-6" />
        {content.split("\n\n").map((p, i) => (
          <p key={i} className="text-[13px] leading-relaxed mb-3" style={{ color: "#555" }}>
            {p}
          </p>
        ))}
      </div>
    </section>
  );
};
