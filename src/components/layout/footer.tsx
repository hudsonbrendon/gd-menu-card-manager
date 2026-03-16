"use client";

import { useGameStore } from "@/store/game-store";
import { useSettingsStore } from "@/store/settings-store";

export function Footer() {
  const { items, isWritable, rootHandle } = useGameStore();
  const { t } = useSettingsStore();

  const totalSize = items.reduce((sum, item) => sum + item.totalSize, 0);
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <footer className="flex items-center justify-between px-4 py-2 border-t border-gd-border bg-gd-bg text-xs font-mono">
      <div className="flex items-center gap-4">
        {items.length > 0 && (
          <>
            <span className="text-gd-dim">{items.length} {t("footer.games", { count: items.length }).replace(/\d+\s*/, "")}</span>
            <span className="text-gd-dim">{formatBytes(totalSize)}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {rootHandle && (
          <span className={`flex items-center gap-1.5 ${isWritable ? "text-green-400" : "text-yellow-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isWritable ? "bg-green-400" : "bg-yellow-400"}`} />
            {isWritable ? "R/W" : "R/O"}
          </span>
        )}
        <span className="text-gd-dim">v1.0</span>
      </div>
    </footer>
  );
}
