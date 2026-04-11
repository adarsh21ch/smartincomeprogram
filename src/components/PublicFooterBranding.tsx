/**
 * Shared branding footer for ALL public-facing pages.
 * Do NOT use inside admin or creator dashboards.
 */
const PublicFooterBranding = ({ variant = "dark" }: { variant?: "dark" | "light" }) => {
  const color = variant === "dark" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)";

  return (
    <div className="w-full text-center" style={{ padding: "20px 16px", fontSize: 12, color }}>
      ©️ 2025 Smart Income Program · Powered by{" "}
      <a
        href="https://nevorai.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color, textDecoration: "none" }}
        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
      >
        Nevorai
      </a>
    </div>
  );
};

export default PublicFooterBranding;
