import sipLogo from "@/assets/sip-logo.png";

export const Logo = ({ size = "default" }: { size?: "sm" | "default" | "lg" }) => {
  const sizes = {
    sm: { img: "w-7 h-7", name: "text-[13px]", accent: "text-[13px]" },
    default: { img: "w-8 h-8", name: "text-[15px]", accent: "text-[15px]" },
    lg: { img: "w-10 h-10", name: "text-[18px]", accent: "text-[18px]" },
  };

  return (
    <div className="flex items-center gap-2">
      <img
        src={sipLogo}
        alt="Smart Income Program"
        className={`${sizes[size].img} rounded-lg object-contain shrink-0`}
      />
      <div className="flex items-baseline gap-[3px]">
        <span
          className={sizes[size].name}
          style={{
            fontFamily: "'Plus Jakarta Sans', 'Sora', system-ui, sans-serif",
            fontWeight: 700,
            color: "hsl(var(--foreground))",
            letterSpacing: "-0.025em",
            lineHeight: 1,
          }}
        >
          Smart Income
        </span>
        <span
          className={sizes[size].accent}
          style={{
            fontFamily: "'Plus Jakarta Sans', 'Sora', system-ui, sans-serif",
            fontWeight: 700,
            color: "#C5930E",
            letterSpacing: "-0.025em",
            lineHeight: 1,
          }}
        >
          Program
        </span>
      </div>
    </div>
  );
};
