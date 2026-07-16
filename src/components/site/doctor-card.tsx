"use client";

import Image from "next/image";
import { CalendarClock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/config/site";
import { cn } from "@/lib/utils";

export type DoctorCardData = {
  id: string;
  name: string;
  nameBn: string | null;
  specialty: string;
  specialtyBn: string | null;
  degrees: string | null;
  schedule: string | null;
  scheduleBn: string | null;
  photoUrl: string | null;
};

function doctorInitial(name: string) {
  return name.replace(/^Dr\.?\s*|^ডা\.?\s*/i, "").charAt(0).toUpperCase();
}

export function DoctorCard({
  doctor,
  locale,
  className,
}: {
  doctor: DoctorCardData;
  locale: Locale;
  className?: string;
}) {
  const t = useTranslations("doctors");

  const name = locale === "bn" && doctor.nameBn ? doctor.nameBn : doctor.name;
  const specialty =
    locale === "bn" && doctor.specialtyBn ? doctor.specialtyBn : doctor.specialty;
  const schedule =
    locale === "bn" && doctor.scheduleBn ? doctor.scheduleBn : doctor.schedule;
  const hasSchedule = Boolean(schedule?.trim());

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {doctor.photoUrl ? (
          <Image
            src={doctor.photoUrl}
            alt={name}
            fill
            className="object-cover object-top"
            sizes="250px"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/25 via-secondary to-accent/30"
            aria-hidden
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_55%)]" />
            <span className="absolute inset-0 flex items-center justify-center text-6xl font-bold tracking-tight text-primary/30">
              {doctorInitial(name)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3 text-center">
        <h3 className="text-base font-semibold leading-snug tracking-tight">{name}</h3>

        <Badge variant="secondary" className="mx-auto mt-2 w-fit text-xs font-medium">
          {specialty}
        </Badge>

        {doctor.degrees && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {doctor.degrees}
          </p>
        )}

        <div
          className={cn(
            "mt-3 flex items-start gap-2 rounded-xl px-2.5 py-2 text-left text-xs",
            hasSchedule
              ? "bg-primary/10 text-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          <CalendarClock
            className={cn(
              "mt-0.5 h-3.5 w-3.5 shrink-0",
              hasSchedule ? "text-primary" : "text-muted-foreground",
            )}
            aria-hidden
          />
          <p className="min-w-0 text-xs leading-relaxed">
            {hasSchedule ? schedule : t("noSchedule")}
          </p>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
          <Link
            href={`/doctors/${doctor.id}/appointment`}
            className={buttonVariants({ size: "sm", className: "rounded-full" })}
          >
            {t("appointment")}
          </Link>
          <Link
            href={`/doctors/${doctor.id}`}
            className={buttonVariants({
              size: "sm",
              variant: "outline",
              className: "rounded-full",
            })}
          >
            {t("profile")}
          </Link>
        </div>
      </div>
    </article>
  );
}
