import { Link } from "react-router-dom";
import { Logo } from "@/components/landing/Logo";

interface Props {
  getText: (section: string, key: string, fallback?: string) => string;
}

export const SipFooter = ({ getText }: Props) => {
  const tagline = getText("footer", "tagline", "Build your income. Build your future.");

  return (
    <footer className="py-10" style={{ background: "#050505", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="container text-center">
        <div className="flex justify-center mb-3">
          <Logo size="sm" />
        </div>
        <p className="text-xs mb-6" style={{ color: "#666" }}>{tagline}</p>

        <div className="sip-gold-divider max-w-xs mx-auto mb-6" />

        <p className="text-xs mb-3" style={{ color: "#444" }}>
          © {new Date().getFullYear()} Smart Income Program · Powered by Nevorai
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/privacy" className="text-xs hover:underline" style={{ color: "#555" }}>Privacy Policy</Link>
          <Link to="/terms" className="text-xs hover:underline" style={{ color: "#555" }}>Terms of Use</Link>
          <Link to="/contact" className="text-xs hover:underline" style={{ color: "#555" }}>Contact</Link>
        </div>
      </div>
    </footer>
  );
};
