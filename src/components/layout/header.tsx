"use client";

import { HelpCircle } from "lucide-react";
import { LanguageSelector } from "@/components/common/language-selector";
import { useSettingsStore } from "@/store/settings-store";

export function Header() {
  const { t } = useSettingsStore();

  const resetTutorial = () => {
    localStorage.removeItem("gd-tutorial-seen");
    localStorage.removeItem("gd-drive-tutorial-seen");
    window.dispatchEvent(new CustomEvent("gd-tutorial-restart"));
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-gd-border bg-gd-bg">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-gd-text tracking-wide" style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive" }}>
          GDmenu
        </h1>
        <span className="text-[10px] text-gd-dim tracking-widest uppercase">Card Manager</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={resetTutorial}
          title={t("tutorial.restart")}
          className="flex items-center gap-1.5 h-8 px-2 text-xs font-mono text-gd-dim hover:text-gd-text transition-colors"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("tutorial.restart")}</span>
        </button>
        <LanguageSelector />
      </div>
    </header>
  );
}
