import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DoctorAppointmentForm } from "@/components/site/doctor-appointment-form";
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
    title: `Appointment — ${doctor.name}`,
  };
}

export default async function DoctorAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("doctorAppointment");
  const tDoctors = await getTranslations("doctors");
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
          href={`/doctors/${doctor.id}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-8 -ml-2 gap-2 text-muted-foreground",
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("backToProfile")}
        </Link>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <aside className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
            <div className="relative overflow-hidden rounded-3xl bg-secondary">
              <div className="relative aspect-[4/5] w-full">
                {doctor.photoUrl ? (
                  <Image
                    src={doctor.photoUrl}
                    alt={name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 24rem, 22rem"
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
              </div>
            </div>

            <div className="mt-5 space-y-3 text-center lg:text-left">
              <Badge
                variant="secondary"
                className="px-3 py-1 text-sm font-medium"
              >
                {specialty}
              </Badge>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{name}</h2>
                {doctor.degrees && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {doctor.degrees}
                  </p>
                )}
              </div>
              <div
                className={cn(
            "flex items-start gap-3 rounded-2xl px-3.5 py-3 text-left text-sm",
                  hasSchedule
                    ? "bg-primary/10 text-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <CalendarClock
                  className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
                    hasSchedule ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    {tDoctors("schedule")}
                  </p>
                  <p className="mt-0.5 leading-relaxed">
                    {hasSchedule ? schedule : tDoctors("noSchedule")}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("title")}
            </h1>
            <div className="mt-8">
              <DoctorAppointmentForm
                doctorId={doctor.id}
                doctorName={name}
                schedule={doctor.schedule ?? doctor.scheduleBn}
              />
            </div>
          </div>
        </div>
    </div>
  );
}
