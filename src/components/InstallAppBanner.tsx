import { useState, useEffect } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export const InstallAppBanner = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = sessionStorage.getItem("install-banner-dismissed");
    if (isStandalone || dismissed) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Show after 3s for iOS (no beforeinstallprompt)
    if (ios) {
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  };

  const dismiss = () => {
    setShow(false);
    setShowIOSGuide(false);
    sessionStorage.setItem("install-banner-dismissed", "1");
  };

  if (!show) return null;

  // iOS inline guide
  if (showIOSGuide) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 animate-slide-up" style={{ background: "#111" }}>
        <button onClick={dismiss} className="absolute top-3 right-3 text-white/50 hover:text-white"><X size={18} /></button>
        <p className="text-sm font-semibold text-white mb-3">Install on iPhone</p>
        <div className="space-y-2 text-xs text-white/70">
          <p>1. Tap <Share size={12} className="inline text-primary" /> <strong className="text-white">Share</strong> at the bottom of Safari</p>
          <p>2. Scroll & tap <Plus size={12} className="inline text-primary" /> <strong className="text-white">Add to Home Screen</strong></p>
          <p>3. Tap <strong className="text-white">Add</strong> — done!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] animate-slide-up">
      <div
        className="mx-3 mb-3 rounded-xl p-3.5 flex items-center gap-3 shadow-xl"
        style={{ background: "linear-gradient(135deg, #1a1400, #111)", border: "1px solid rgba(232,184,48,0.25)" }}
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
          <img src="/icons/icon-192x192.png" alt="" className="w-full h-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">Smart Income Funnel</p>
          <p className="text-[11px] text-white/50">Install app for the best experience</p>
        </div>
        {isIOS ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="px-4 py-2 rounded-lg text-xs font-semibold shrink-0"
            style={{ background: "linear-gradient(135deg, #E8B830, #C99A18)", color: "#000" }}
          >
            Install
          </button>
        ) : deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="px-4 py-2 rounded-lg text-xs font-semibold shrink-0"
            style={{ background: "linear-gradient(135deg, #E8B830, #C99A18)", color: "#000" }}
          >
            Install
          </button>
        ) : (
          <Link
            to="/install"
            className="px-4 py-2 rounded-lg text-xs font-semibold shrink-0"
            style={{ background: "linear-gradient(135deg, #E8B830, #C99A18)", color: "#000" }}
          >
            How to Install
          </Link>
        )}
        <button onClick={dismiss} className="text-white/40 hover:text-white shrink-0"><X size={16} /></button>
      </div>
    </div>
  );
};
