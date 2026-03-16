"use client";

import { AlertCircle } from "lucide-react";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useSettingsStore } from "@/store/settings-store";
import { DreamcastSwirl } from "@/components/common/dreamcast-swirl";
import { DreamcastConsole } from "@/components/drive/dreamcast-console";

export function DriveSelector() {
  const { isSupported } = useFileSystem();
  const { t } = useSettingsStore();

  return (
    <div className="relative flex flex-col items-center justify-center gap-6 py-12 overflow-auto scrollbar-none">
      <div className="absolute top-8 right-8 pointer-events-none opacity-[0.06]">
        <DreamcastSwirl size={160} color="#1a4a5a" animate />
      </div>
      <div className="absolute bottom-8 left-8 pointer-events-none opacity-[0.04]">
        <DreamcastSwirl size={100} color="#1a4a5a" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <h2 className="text-xl font-bold tracking-wide text-gd-text font-mono">
          {t("drive.title")}
        </h2>
        <p className="max-w-sm text-sm text-gd-dim leading-relaxed font-mono">
          {t("drive.description")}
        </p>
      </div>

      <div className="relative z-10">
        <DreamcastConsole />
      </div>

      {!isSupported && (
        <div className="flex items-center gap-2 rounded border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 text-sm text-yellow-400 font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{t("drive.unsupported")}</span>
        </div>
      )}
    </div>
  );
}
