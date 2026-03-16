"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { useSettingsStore } from "@/store/settings-store";

export function DriveTutorial() {
  const { t } = useSettingsStore();
  const [visible, setVisible] = useState(false);
  const [bubblePos, setBubblePos] = useState<{ top: number; left: number; arrowLeft: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seen = localStorage.getItem("gd-drive-tutorial-seen");
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for restart event
  useEffect(() => {
    const handleRestart = () => {
      setVisible(true);
    };
    window.addEventListener("gd-tutorial-restart", handleRestart);
    return () => window.removeEventListener("gd-tutorial-restart", handleRestart);
  }, []);

  const updatePosition = useCallback(() => {
    const el = document.getElementById("btn-console");
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const bubbleWidth = 320;
    let left = rect.left + rect.width / 2 - bubbleWidth / 2;
    let arrowLeft = bubbleWidth / 2;

    if (left < 12) {
      arrowLeft = arrowLeft + left - 12;
      left = 12;
    }
    if (left + bubbleWidth > window.innerWidth - 12) {
      const overflow = left + bubbleWidth - (window.innerWidth - 12);
      arrowLeft = arrowLeft + overflow;
      left = window.innerWidth - 12 - bubbleWidth;
    }

    setBubblePos({
      top: rect.bottom + 16,
      left,
      arrowLeft: Math.max(20, Math.min(arrowLeft, bubbleWidth - 20)),
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [visible, updatePosition]);

  // Highlight target
  useEffect(() => {
    if (!visible) return;
    const el = document.getElementById("btn-console");
    if (!el) return;

    el.style.position = "relative";
    el.style.zIndex = "1001";
    el.style.filter = "brightness(1.3)";

    return () => {
      el.style.position = "";
      el.style.zIndex = "";
      el.style.filter = "";
    };
  }, [visible]);

  const close = () => {
    setVisible(false);
    localStorage.setItem("gd-drive-tutorial-seen", "true");
  };

  if (!visible || !bubblePos) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-[1000]"
        onClick={close}
      />

      {/* Bubble */}
      <div
        ref={bubbleRef}
        className="fixed z-[1002] w-80 animate-in fade-in slide-in-from-top-2 duration-200"
        style={{ top: bubblePos.top, left: bubblePos.left }}
      >
        {/* Arrow */}
        <div
          className="absolute -top-2 w-4 h-4 bg-gd-highlight rotate-45 border-l border-t border-gd-border"
          style={{ left: bubblePos.arrowLeft - 8 }}
        />

        <div className="relative bg-gd-highlight border border-gd-border rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <h3 className="text-sm font-bold text-gd-text font-mono">
              {t("tutorial.console.title")}
            </h3>
            <button
              onClick={close}
              className="text-gd-dim hover:text-gd-text transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description */}
          <div className="px-4 pb-3">
            <p className="text-xs text-gd-dim font-mono leading-relaxed">
              {t("tutorial.console.desc")}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-4 py-2.5 bg-gd-bg/50 border-t border-gd-border">
            <button
              onClick={close}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors"
            >
              {t("tutorial.finish")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
