"use client";

import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/settings-store";

export function ThemeToggle() {
  const { theme, toggleTheme, t } = useSettingsStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-8 gap-1.5 text-white/70 hover:text-white hover:bg-white/10"
      aria-label={t("theme.toggle")}
    >
      {theme === "light" ? (
        <Moon className="h-3.5 w-3.5" />
      ) : (
        <Sun className="h-3.5 w-3.5" />
      )}
      <span className="text-xs">{theme === "light" ? t("theme.dark") : t("theme.light")}</span>
    </Button>
  );
}
