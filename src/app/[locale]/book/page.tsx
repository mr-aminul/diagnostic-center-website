import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { BookingForm } from "@/components/site/booking-form";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getPackages, getTests } from "@/lib/data/catalog";
import { getBranches } from "@/lib/data/branches";
import { getDoctors } from "@/lib/data/doctors";
import { getResolvedSiteConfig } from "@/lib/data/site-settings";
import type { Locale } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ titleKey: "booking.title", descriptionKey: "booking.subtitle" });
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{
    package?: string;
    collection?: string;
    test?: string;
    doctor?: string;
  }>;
}) {
  const t = await getTranslations("booking");
  const locale = (await getLocale()) as Locale;
  const params = await searchParams;

  const [tests, packages, branches, doctors, site] = await Promise.all([
    getTests(),
    getPackages(),
    getBranches(),
    getDoctors(),
    getResolvedSiteConfig(),
  ]);
  const demoPayment = site.features.onlinePayment && site.payment.provider === "demo";

  const plainTests = tests.map((test) => ({
    type: "test" as const,
    id: test.id,
    name: test.name,
    nameBn: test.nameBn,
    price: Number(test.price),
    preparation: test.preparation,
    preparationBn: test.preparationBn,
  }));

  const plainPackages = packages.map((pkg) => ({
    type: "package" as const,
    id: pkg.id,
    name: pkg.name,
    nameBn: pkg.nameBn,
    price: Number(pkg.price),
  }));

  const plainBranches = branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    nameBn: branch.nameBn,
  }));

  const doctor = params.doctor
    ? doctors.find((item) => item.id === params.doctor)
    : undefined;

  const tCommon = await getTranslations("common");
  const backHref = doctor
    ? `/doctors/${doctor.id}`
    : params.package
      ? "/packages"
      : params.test
        ? "/services"
        : params.collection === "home"
          ? "/home-collection"
          : "/";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
      <Link
        href={backHref}
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
        <BookingForm
          tests={plainTests}
          packages={plainPackages}
          branches={plainBranches}
          locale={locale}
          defaultCollectionType={params.collection === "home" ? "HOME" : "IN_CENTER"}
          defaultPackageId={params.package}
          defaultTestId={params.test}
          defaultDoctorId={doctor?.id}
          defaultDoctorName={
            doctor
              ? locale === "bn" && doctor.nameBn
                ? doctor.nameBn
                : doctor.name
              : undefined
          }
          shortName={site.shortName}
          whatsapp={site.contact.whatsapp}
          onlinePayment={site.features.onlinePayment}
          demoPayment={demoPayment}
        />
      </div>
    </div>
  );
}
