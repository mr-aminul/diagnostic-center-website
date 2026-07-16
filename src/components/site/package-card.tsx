import Image from "next/image";
import { CheckCircle2, Package } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/config/site";
import { formatCurrency, toNumber, type Numeric } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PackageCardTest = {
  id: string;
  name: string;
  nameBn: string | null;
};

export type PackageCardData = {
  id: string;
  name: string;
  nameBn: string | null;
  description: string | null;
  descriptionBn: string | null;
  price: Numeric;
  originalPrice?: Numeric | null;
  imageUrl: string | null;
  tests: { test: PackageCardTest }[];
};

export async function PackageCard({
  pkg,
  locale,
  maxIncludes,
  className,
}: {
  pkg: PackageCardData;
  locale: Locale;
  /** When set, only show this many included tests plus a “+N more” line. */
  maxIncludes?: number;
  className?: string;
}) {
  const t = await getTranslations();
  const name = locale === "bn" && pkg.nameBn ? pkg.nameBn : pkg.name;
  const description =
    locale === "bn" && pkg.descriptionBn ? pkg.descriptionBn : pkg.description;

  const allTests = pkg.tests.map(({ test }) => test);
  const shown =
    typeof maxIncludes === "number" ? allTests.slice(0, maxIncludes) : allTests;
  const remaining = Math.max(allTests.length - shown.length, 0);
  const showChecks = typeof maxIncludes !== "number";

  const price = toNumber(pkg.price);
  const originalPrice =
    pkg.originalPrice == null ? null : toNumber(pkg.originalPrice);
  const savings =
    originalPrice != null && originalPrice > price ? originalPrice - price : 0;
  const hasDiscount = savings > 0;

  return (
    <article
      id={pkg.id}
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {pkg.imageUrl ? (
          <Image
            src={pkg.imageUrl}
            alt={name}
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/25 via-secondary to-accent/30"
            aria-hidden
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_55%)]" />
            <span className="absolute inset-0 flex items-center justify-center text-primary/35">
              <Package className="h-16 w-16" strokeWidth={1.25} />
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold leading-snug tracking-tight">{name}</h3>

        {description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}

        {shown.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("packages.includes")}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {shown.map((test) => {
                const testName =
                  locale === "bn" && test.nameBn ? test.nameBn : test.name;
                return (
                  <li key={test.id} className="flex items-start gap-2">
                    {showChecks ? (
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        aria-hidden
                      />
                    ) : (
                      <span className="shrink-0" aria-hidden>
                        ·
                      </span>
                    )}
                    <span className={cn(!showChecks && "truncate")}>{testName}</span>
                  </li>
                );
              })}
              {remaining > 0 && (
                <li className="text-primary">{t("home.moreTests", { count: remaining })}</li>
              )}
            </ul>
          </div>
        )}

        <div className="mt-auto pt-4">
          {hasDiscount && originalPrice != null ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/70">
                  {formatCurrency(originalPrice, locale)}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(price, locale)}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-primary">
                {t("packages.saveAmount", {
                  amount: formatCurrency(savings, locale),
                })}
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(price, locale)}
            </p>
          )}
        </div>
        <Link
          href={{ pathname: "/book", query: { package: pkg.id } }}
          className={buttonVariants({ className: "mt-4" })}
        >
          {t("packages.bookPackage")}
        </Link>
      </div>
    </article>
  );
}
