import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, CalendarClock, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getDoctorById } from "@/lib/data/doctors";
import type { Locale } from "@/config/site";
import { cn } from "@/lib/utils";

function doctorInitial(name: string) {
  return name.replace(/^Dr\.?\s*|^ডা\.?\s*/i, "").charAt(0).toUpperCase();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doctor = await getDoctorById(id);
  if (!doctor) return {};

  return {
    title: doctor.name,
    description: doctor.specialty,
  };
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("doctors");
  const doctor = await getDoctorById(id);

  if (!doctor) notFound();

  const name = locale === "bn" && doctor.nameBn ? doctor.nameBn : doctor.name;
  const specialty =
    locale === "bn" && doctor.specialtyBn ? doctor.specialtyBn : doctor.specialty;
  const schedule =
    locale === "bn" && doctor.scheduleBn ? doctor.scheduleBn : doctor.schedule;
  const hasSchedule = Boolean(schedule?.trim());

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-8">
        <Link
          href="/doctors"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-8 -ml-2 gap-2 text-muted-foreground",
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("backToList")}
        </Link>

        <section className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-12 xl:grid-cols-[minmax(0,26rem)_1fr]">
          <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-secondary lg:mx-0 lg:max-w-none">
            <div className="relative aspect-[4/5] w-full">
              {doctor.photoUrl ? (
                <Image
                  src={doctor.photoUrl}
                  alt={name}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 24rem, 26rem"
                  priority
                />
              ) : (
                <div
                  className="absolute inset-0 bg-gradient-to-br from-primary/25 via-secondary to-accent/30"
                  aria-hidden
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_55%)]" />
                  <span className="absolute inset-0 flex items-center justify-center text-8xl font-bold tracking-tight text-primary/30">
                    {doctorInitial(name)}
                  </span>
                </div>
              )}
              <div
                className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent lg:hidden"
                aria-hidden
              />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <Badge
              variant="secondary"
              className="w-fit px-3 py-1 text-sm font-medium"
            >
              {specialty}
            </Badge>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {name}
            </h1>

            {doctor.degrees && (
              <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {doctor.degrees}
              </p>
            )}

            <dl className="mt-8 divide-y divide-border/80 border-y border-border/80">
              <div className="flex gap-4 py-5">
                <div
                  className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                    hasSchedule
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <CalendarClock className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <dt className="text-sm font-semibold">{t("schedule")}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {hasSchedule ? schedule : t("noSchedule")}
                  </dd>
                </div>
              </div>

              <div className="flex gap-4 py-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Stethoscope className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <dt className="text-sm font-semibold">{t("consultInfoTitle")}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {t("consultInfoBody")}
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/doctors/${doctor.id}/appointment`}
                className={buttonVariants({ size: "lg" })}
              >
                {t("appointment")}
              </Link>
              <Link
                href="/doctors"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                {t("backToList")}
              </Link>
            </div>
          </div>
        </section>
    </div>
  );
}
