import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHero } from "@/components/site/page-hero";
import { BookingForm } from "@/components/site/booking-form";
import { getPackages, getTests } from "@/lib/data/catalog";
import { getBranches } from "@/lib/data/branches";
import { getDoctors } from "@/lib/data/doctors";
import type { Locale } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo";

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

  const [tests, packages, branches, doctors] = await Promise.all([
    getTests(),
    getPackages(),
    getBranches(),
    getDoctors(),
  ]);

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
    <div>
      <PageHero
        title={t("title")}
        subtitle={t("subtitle")}
        backHref={backHref}
        backLabel={tCommon("back")}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
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
        />
      </div>
    </div>
  );
}
