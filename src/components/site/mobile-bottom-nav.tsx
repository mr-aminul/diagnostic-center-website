"use client";

import {
  Activity,
  FileDown,
  MessageCircle,
  Search,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  key: "findDoctor" | "testPrices" | "downloadReport" | "packages" | "supportChat";
  href?: "/doctors" | "/price-list" | "/patient-portal" | "/packages";
  Icon: LucideIcon;
  external?: boolean;
  show: boolean;
};

export function MobileBottomNav({
  whatsapp,
  doctorsPage,
}: {
  whatsapp: string;
  doctorsPage: boolean;
}) {
  const t = useTranslations("bottomNav");
  const pathname = usePathname();
  const whatsappDigits = whatsapp.replace(/[^\d]/g, "");

  const allItems: NavItem[] = [
    {
      key: "findDoctor",
      href: "/doctors",
      Icon: UserRound,
      show: doctorsPage,
    },
    {
      key: "testPrices",
      href: "/price-list",
      Icon: Search,
      show: true,
    },
    {
      key: "downloadReport",
      href: "/patient-portal",
      Icon: FileDown,
      show: true,
    },
    {
      key: "packages",
      href: "/packages",
      Icon: Activity,
      show: true,
    },
    {
      key: "supportChat",
      Icon: MessageCircle,
      external: true,
      show: true,
    },
  ];
  const items = allItems.filter((item) => item.show);

  function isActive(href: string | undefined) {
    if (!href) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-primary bg-primary pb-[env(safe-area-inset-bottom)] text-primary-foreground shadow-[0_-6px_24px_rgba(0,0,0,0.16)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-2 pb-1.5">
        {items.map((item) => {
          const active = isActive(item.href);
          const className = cn(
            "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] leading-tight font-semibold transition-colors duration-200",
            active
              ? "bg-primary-foreground text-primary shadow-sm"
              : "text-primary-foreground/80 active:bg-primary-foreground/15 active:text-primary-foreground",
          );

          const content = (
            <>
              <item.Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200",
                  active && "scale-105",
                )}
                strokeWidth={active ? 2.25 : 1.75}
                aria-hidden
              />
              <span className="max-w-full text-center whitespace-normal break-words hyphens-auto">
                {t(item.key)}
              </span>
            </>
          );

          if (item.external) {
            return (
              <li key={item.key} className="flex min-w-0 flex-1">
                <a
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {content}
                </a>
              </li>
            );
          }

          return (
            <li key={item.key} className="flex min-w-0 flex-1">
              <Link
                href={item.href!}
                prefetch
                className={className}
                aria-current={active ? "page" : undefined}
              >
                {content}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
