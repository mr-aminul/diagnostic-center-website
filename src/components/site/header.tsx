import { getTranslations } from "next-intl/server";
import { LogIn, Menu, Phone } from "lucide-react";
import { getResolvedSiteConfig } from "@/lib/data/site-settings";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { BrandMark } from "@/components/site/brand-mark";
import { cn } from "@/lib/utils";

function hotlineWithoutCountryCode(phone: string) {
  return phone.replace(/^\+880\s*/i, "0").replace(/^\+88\s*/i, "").trim();
}

const hotlineButtonClass =
  "border-primary bg-primary/5 text-primary transition-none hover:bg-primary hover:text-primary-foreground animate-hotline-pulse";

export async function Header() {
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const site = await getResolvedSiteConfig();
  const hotlineRaw = site.contact.phones[0] ?? "";
  const hotlineDisplay = hotlineWithoutCountryCode(hotlineRaw);
  const primaryPhone = hotlineRaw.replace(/\s/g, "");

  const navItems = [
    ...(site.features.doctorsPage ? [{ href: "/doctors" as const, label: t("doctors") }] : []),
    { href: "/services" as const, label: t("services") },
    { href: "/packages" as const, label: t("packages") },
    { href: "/price-list" as const, label: t("priceList") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          prefetch
          className="flex min-w-0 items-center gap-2 font-semibold"
        >
          <BrandMark />
          <span className="truncate text-base">{site.shortName}</span>
        </Link>

        <nav className="hidden items-center gap-4 xl:gap-6 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 xl:gap-3 lg:flex">
          <LanguageSwitcher />
          <a
            href={`tel:${primaryPhone}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 gap-2 rounded-full px-4 tabular-nums",
              hotlineButtonClass,
            )}
            aria-label={`${tCommon("callUs")}: ${hotlineDisplay}`}
          >
            <Phone className="h-4 w-4 shrink-0" aria-hidden />
            <span>{hotlineDisplay}</span>
          </a>
          <Link
            href="/patient-portal"
            prefetch
            className={buttonVariants({ className: "gap-2" })}
          >
            <LogIn className="h-4 w-4" aria-hidden />
            {t("patientPortal")}
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <a
            href={`tel:${primaryPhone}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "rounded-full",
              hotlineButtonClass,
            )}
            aria-label={`${tCommon("callUs")}: ${hotlineDisplay}`}
          >
            <Phone className="h-4 w-4" aria-hidden />
          </a>
          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" size="icon" aria-label="Open menu" />}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="px-4 pt-4">{site.shortName}</SheetTitle>
              <div className="mt-4 px-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("language")}
                </p>
                <LanguageSwitcher />
              </div>
              <nav className="mt-4 flex flex-col gap-1 px-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 space-y-2 px-4">
                <Link
                  href="/patient-portal"
                  prefetch
                  className={buttonVariants({ className: "w-full gap-2" })}
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                  {t("patientPortal")}
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
