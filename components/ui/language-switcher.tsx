"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations("language");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLocale = (code: Locale) => {
    document.cookie = `NEXT_LOCALE=${code};path=/;max-age=31536000;SameSite=Lax`;
    setOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background-alt transition-colors border border-border/40 hover:border-border"
        title={t("selectLanguage")}
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{localeFlags[locale]}</span>
        <span className="text-xs font-semibold uppercase">{locale}</span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 z-50 glass-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[160px] animate-fadeIn">
          {locales.map((code) => (
            <button
              key={code}
              onClick={() => switchLocale(code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                ${code === locale
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground hover:bg-background-alt"
                }`}
            >
              <span className="text-base">{localeFlags[code]}</span>
              <span>{localeNames[code]}</span>
              {code === locale && <span className="ml-auto text-[10px] text-primary">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
