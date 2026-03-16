"use client";

import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useGameStore } from "@/store/game-store";
import { useSettingsStore } from "@/store/settings-store";
import { DreamcastSwirl } from "@/components/common/dreamcast-swirl";
import { DreamcastSpiral } from "@/components/common/dreamcast-spiral";

export function ProgressDialog() {
  const { isLoading, loadingMessage, loadingProgress, saveSuccess, setSaveSuccess } = useGameStore();
  const { t } = useSettingsStore();

  const handleClose = () => {
    setSaveSuccess(false);
  };

  // Success screen
  if (saveSuccess) {
    return (
      <Dialog open onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md border-green-500/30">
          <div className="flex flex-col items-center gap-5 py-4">
            {/* Animated success checkmark */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center animate-in zoom-in-50 duration-500">
                <Check className="h-10 w-10 text-green-500 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200" strokeWidth={3} />
              </div>
              {/* Glow pulse */}
              <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" style={{ animationDuration: "1.5s", animationIterationCount: "2" }} />
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gd-text font-mono animate-in fade-in slide-in-from-bottom-2 duration-300 delay-300">
              {t("progress.success.title")}
            </h3>

            {/* Dreamcast + SD card illustration */}
            <div className="flex items-center gap-3 animate-in fade-in duration-500 delay-500">
              <div className="flex flex-col items-center gap-1">
                <div className="w-[40px] h-[30px] rounded-[2px] bg-gradient-to-b from-[#2a5a9e] to-[#1e4480] border border-[#1a3a6a] relative">
                  <div className="absolute top-[2px] left-[3px] text-[4px] font-bold text-white/90">SD</div>
                  <div className="absolute bottom-0 left-[3px] right-[3px] h-[5px] flex gap-[0.5px]">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="flex-1 bg-[#c4a435] rounded-t-[0.5px]" />
                    ))}
                  </div>
                </div>
              </div>
              <svg className="h-5 w-5 text-gd-dim animate-in fade-in duration-300 delay-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <DreamcastSpiral size={44} color="#e86117" />
            </div>

            {/* Description */}
            <p className="text-sm text-gd-dim text-center leading-relaxed font-mono px-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-500">
              {t("progress.success.desc")}
            </p>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="mt-1 px-6 py-2 text-sm font-mono font-bold text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors animate-in fade-in zoom-in-95 duration-300 delay-700"
            >
              {t("progress.success.close")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Loading screen
  return (
    <Dialog open={isLoading}>
      <DialogContent className="sm:max-w-md border-dc-orange/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DreamcastSwirl size={20} color="#e86117" animate />
            {t("progress.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
          <Progress value={loadingProgress} className="[&>div]:bg-gradient-to-r [&>div]:from-dc-orange [&>div]:to-dc-red" />
          <p className="text-xs text-dc-orange/70 text-right font-mono">
            {Math.round(loadingProgress)}%
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
