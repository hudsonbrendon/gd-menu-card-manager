"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettingsStore } from "@/store/settings-store";
import { LOCALE_NAMES, type Locale } from "@/lib/i18n/translations";

const LOCALE_FLAGS: Record<Locale, string> = {
  en: "\u{1F1EC}\u{1F1E7}",
  zh: "\u{1F1E8}\u{1F1F3}",
  hi: "\u{1F1EE}\u{1F1F3}",
  es: "\u{1F1EA}\u{1F1F8}",
  fr: "\u{1F1EB}\u{1F1F7}",
  ar: "\u{1F1F8}\u{1F1E6}",
  bn: "\u{1F1E7}\u{1F1E9}",
  pt: "\u{1F1E7}\u{1F1F7}",
  ru: "\u{1F1F7}\u{1F1FA}",
  ja: "\u{1F1EF}\u{1F1F5}",
};

export function LanguageSelector() {
  const { locale, setLocale } = useSettingsStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-white/70 hover:text-white hover:bg-white/10" />
      }>
        <span className="text-sm">{LOCALE_FLAGS[locale]}</span>
        <span className="text-xs">{LOCALE_NAMES[locale]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {(Object.entries(LOCALE_NAMES) as [Locale, string][]).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLocale(code)}
            className={locale === code ? "bg-dc-orange/10 text-dc-orange" : ""}
          >
            <span className="mr-2">{LOCALE_FLAGS[code]}</span>
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
