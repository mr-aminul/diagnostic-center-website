import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { TrackForm } from "@/components/site/track-form";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/config/site";
import { getResolvedSiteConfig } from "@/lib/data/site-settings";
import { buildPageMetadata } from "@/lib/seo";
import { getInitialTrackPortalState } from "@/app/[locale]/patient-portal/actions";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ titleKey: "track.title", descriptionKey: "track.subtitle" });
}

export default async function PatientPortalPage() {
  const t = await getTranslations("track");
  const tCommon = await getTranslations("common");
  const locale = (await getLocale()) as Locale;
  const [initialPortal, site] = await Promise.all([
    getInitialTrackPortalState(locale),
    getResolvedSiteConfig(),
  ]);
  const demoPayment = site.features.onlinePayment && site.payment.provider === "demo";

  return (
    <div className="mx-auto max-w-4xl px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-8 -ml-2 gap-2 text-muted-foreground",
        )}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {tCommon("back")}
      </Link>

      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="mt-10">
        <TrackForm locale={locale} initialPortal={initialPortal} demoPayment={demoPayment} />
      </div>
    </div>
  );
}
