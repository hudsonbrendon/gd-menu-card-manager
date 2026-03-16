"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useSettingsStore } from "@/store/settings-store";

interface TutorialStep {
  targetId: string;
  titleKey: string;
  descriptionKey: string;
}

const STEPS: TutorialStep[] = [
  { targetId: "btn-open", titleKey: "tutorial.open.title", descriptionKey: "tutorial.open.desc" },
  { targetId: "btn-add", titleKey: "tutorial.add.title", descriptionKey: "tutorial.add.desc" },
  { targetId: "btn-sort", titleKey: "tutorial.sort.title", descriptionKey: "tutorial.sort.desc" },
  { targetId: "btn-search", titleKey: "tutorial.search.title", descriptionKey: "tutorial.search.desc" },
  { targetId: "btn-save", titleKey: "tutorial.save.title", descriptionKey: "tutorial.save.desc" },
  { targetId: "game-list", titleKey: "tutorial.gamelist.title", descriptionKey: "tutorial.gamelist.desc" },
  { targetId: "game-info", titleKey: "tutorial.gameinfo.title", descriptionKey: "tutorial.gameinfo.desc" },
];

export function ToolbarTutorial() {
  const { t } = useSettingsStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [bubblePos, setBubblePos] = useState<{ top: number; left: number; arrowLeft: number; hideArrow?: boolean } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seen = localStorage.getItem("gd-tutorial-seen");
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for restart event from header button
  useEffect(() => {
    const handleRestart = () => {
      setCurrentStep(0);
      setVisible(true);
    };
    window.addEventListener("gd-tutorial-restart", handleRestart);
    return () => window.removeEventListener("gd-tutorial-restart", handleRestart);
  }, []);

  const updatePosition = useCallback(() => {
    const step = STEPS[currentStep];
    const el = document.getElementById(step.targetId);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const bubbleWidth = 320;
    let left = rect.left + rect.width / 2 - bubbleWidth / 2;
    let arrowLeft = bubbleWidth / 2;

    // Clamp to viewport
    if (left < 12) {
      arrowLeft = arrowLeft + left - 12;
      left = 12;
    }
    if (left + bubbleWidth > window.innerWidth - 12) {
      const overflow = left + bubbleWidth - (window.innerWidth - 12);
      arrowLeft = arrowLeft + overflow;
      left = window.innerWidth - 12 - bubbleWidth;
    }

    // For large elements, position bubble inside the element area
    const isLargeElement = rect.height > 200;
    const top = isLargeElement ? rect.top + 40 : rect.bottom + 12;

    setBubblePos({
      top,
      left,
      arrowLeft: Math.max(20, Math.min(arrowLeft, bubbleWidth - 20)),
      hideArrow: isLargeElement,
    });
  }, [currentStep]);

  useEffect(() => {
    if (!visible) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [visible, currentStep, updatePosition]);

  // Highlight current target
  useEffect(() => {
    if (!visible) return;
    const step = STEPS[currentStep];
    const el = document.getElementById(step.targetId);
    if (!el) return;

    el.style.position = "relative";
    el.style.zIndex = "1001";
    el.style.filter = "brightness(1.3)";

    return () => {
      el.style.position = "";
      el.style.zIndex = "";
      el.style.filter = "";
    };
  }, [visible, currentStep]);

  const close = () => {
    setVisible(false);
    localStorage.setItem("gd-tutorial-seen", "true");
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      close();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!visible || !bubblePos) return null;

  const step = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

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
        {!bubblePos.hideArrow && (
          <div
            className="absolute -top-2 w-4 h-4 bg-gd-highlight rotate-45 border-l border-t border-gd-border"
            style={{ left: bubblePos.arrowLeft - 8 }}
          />
        )}

        <div className="relative bg-gd-highlight border border-gd-border rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <h3 className="text-sm font-bold text-gd-text font-mono">
              {t(step.titleKey)}
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
              {t(step.descriptionKey)}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gd-bg/50 border-t border-gd-border">
            <span className="text-[10px] text-gd-dim font-mono">
              {currentStep + 1} / {STEPS.length}
            </span>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-gd-text hover:bg-gd-border/50 rounded transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                  {t("tutorial.prev")}
                </button>
              )}
              <button
                onClick={next}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors"
              >
                {isLast ? t("tutorial.finish") : t("tutorial.next")}
                {!isLast && <ChevronRight className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
