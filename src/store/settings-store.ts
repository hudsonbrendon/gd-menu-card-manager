import { create } from "zustand";
import { type Locale, translations } from "@/lib/i18n/translations";

type Theme = "light" | "dark";

interface SettingsState {
  locale: Locale;
  theme: Theme;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  initFromStorage: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  locale: "en",
  theme: "light",

  setLocale: (locale) => {
    set({ locale });
    if (typeof window !== "undefined") {
      localStorage.setItem("gd-locale", locale);
    }
  },

  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== "undefined") {
      localStorage.setItem("gd-theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  },

  toggleTheme: () => {
    const newTheme = get().theme === "light" ? "dark" : "light";
    get().setTheme(newTheme);
  },

  t: (key, params) => {
    const { locale } = get();
    const dict = translations[locale] || translations.en;
    let text = dict[key] || translations.en[key] || key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }

    return text;
  },

  initFromStorage: () => {
    if (typeof window === "undefined") return;

    const savedLocale = localStorage.getItem("gd-locale") as Locale | null;
    const savedTheme = localStorage.getItem("gd-theme") as Theme | null;

    // Detect browser language if no saved locale
    let locale: Locale = "en";
    if (savedLocale && translations[savedLocale]) {
      locale = savedLocale;
    } else {
      const browserLang = navigator.language.split("-")[0] as Locale;
      if (translations[browserLang]) {
        locale = browserLang;
      }
    }

    // Detect system preference if no saved theme
    let theme: Theme = "light";
    if (savedTheme) {
      theme = savedTheme;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }

    set({ locale, theme });
    document.documentElement.classList.toggle("dark", theme === "dark");
  },
}));
