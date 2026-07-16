"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { DoctorCard, type DoctorCardData } from "@/components/site/doctor-card";
import type { Locale } from "@/config/site";
import { cn } from "@/lib/utils";

type SpecialtyOption = {
  value: string;
  label: string;
};

function doctorSearchText(doctor: DoctorCardData) {
  return [
    doctor.name,
    doctor.nameBn,
    doctor.specialty,
    doctor.specialtyBn,
    doctor.degrees,
    doctor.schedule,
    doctor.scheduleBn,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function DoctorsDirectory({
  doctors,
  locale,
}: {
  doctors: DoctorCardData[];
  locale: Locale;
}) {
  const t = useTranslations("doctors");
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "scheduled" | "unscheduled">(
    "all",
  );

  const specialties = useMemo(() => {
    const map = new Map<string, SpecialtyOption>();
    for (const doctor of doctors) {
      if (map.has(doctor.specialty)) continue;
      map.set(doctor.specialty, {
        value: doctor.specialty,
        label:
          locale === "bn" && doctor.specialtyBn
            ? doctor.specialtyBn
            : doctor.specialty,
      });
    }
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, locale === "bn" ? "bn" : "en"),
    );
  }, [doctors, locale]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const matchesSpecialty =
        specialty === "all" || doctor.specialty === specialty;
      const hasSchedule = Boolean(
        (locale === "bn" && doctor.scheduleBn
          ? doctor.scheduleBn
          : doctor.schedule
        )?.trim(),
      );
      const matchesSchedule =
        scheduleFilter === "all" ||
        (scheduleFilter === "scheduled" && hasSchedule) ||
        (scheduleFilter === "unscheduled" && !hasSchedule);
      const matchesSearch =
        !query || doctorSearchText(doctor).includes(query);

      return matchesSpecialty && matchesSchedule && matchesSearch;
    });
  }, [doctors, locale, scheduleFilter, search, specialty]);

  const hasActiveFilters =
    search.trim().length > 0 || specialty !== "all" || scheduleFilter !== "all";

  function clearFilters() {
    setSearch("");
    setSpecialty("all");
    setScheduleFilter("all");
  }

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="bg-background pl-9"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-2">
          <Select
            value={specialty}
            onValueChange={(value) => value && setSpecialty(value)}
            items={{
              all: t("specialtyAll"),
              ...Object.fromEntries(
                specialties.map((option) => [option.value, option.label]),
              ),
            }}
          >
            <SelectTrigger
              aria-label={t("specialtyAll")}
              className="w-full bg-background sm:min-w-48"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">{t("specialtyAll")}</SelectItem>
              {specialties.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={scheduleFilter}
            onValueChange={(value) =>
              value && setScheduleFilter(value as typeof scheduleFilter)
            }
            items={{
              all: t("scheduleAll"),
              scheduled: t("scheduleListed"),
              unscheduled: t("scheduleSoonFilter"),
            }}
          >
            <SelectTrigger
              aria-label={t("scheduleAll")}
              className="w-full bg-background sm:min-w-48"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">{t("scheduleAll")}</SelectItem>
              <SelectItem value="scheduled">{t("scheduleListed")}</SelectItem>
              <SelectItem value="unscheduled">{t("scheduleSoonFilter")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("resultsCount", { count: filtered.length })}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 text-muted-foreground",
            )}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            {t("clearFilters")}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">{t("noResults")}</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
