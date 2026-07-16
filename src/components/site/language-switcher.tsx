"use client";

import { Fragment } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { startNavigationProgress } from "@/components/navigation-progress";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "bn", label: "বাং" },
  { code: "en", label: "EN" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className="inline-flex h-9 items-center gap-0.5 rounded-full border border-zinc-200 bg-zinc-100/80 px-1 text-xs"
      role="group"
      aria-label="Language"
    >
      {LOCALES.map(({ code, label }) => (
        <Fragment key={code}>
          <button
            type="button"
            aria-pressed={locale === code}
            className={cn(
              "rounded-full px-2.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              locale === code
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => {
              if (locale === code) return;
              startNavigationProgress();
              router.replace(pathname, { locale: code });
            }}
          >
            {label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
