import { useState, useEffect } from "react";
import { VolumeX } from "lucide-react";

interface UnmutePillProps {
  visible: boolean;
  onUnmute: () => void;
}

export const UnmutePill = ({ visible, onUnmute }: UnmutePillProps) => {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onUnmute();
        setShow(false);
      }}
      className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-xs font-medium transition-opacity animate-in fade-in duration-300"
      style={{ background: "rgba(0,0,0,0.7)" }}
    >
      <VolumeX size={14} />
      Tap to unmute
    </button>
  );
};
