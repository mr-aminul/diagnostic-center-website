"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarIcon, CheckCircle2, Clock3, Hash } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GenderRadioGroup, type GenderValue } from "@/components/gender-radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  createDoctorAppointment,
  type AppointmentFormState,
} from "@/app/[locale]/doctors/[id]/appointment/actions";
import { BD_PHONE_HINT } from "@/lib/phone";
import { DEV_SAMPLE, demoDefault } from "@/lib/dev-tools";
import {
  dhakaDateInputValue,
  formatLocalDateInput,
  isDateDisabledForDoctor,
} from "@/lib/doctor-availability";
import { cn } from "@/lib/utils";

const initialState: AppointmentFormState = { status: "idle" };

function nextAvailableDate(schedule: string | null | undefined): Date | undefined {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let offset = 0; offset < 60; offset += 1) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + offset);
    if (!isDateDisabledForDoctor(candidate, schedule)) return candidate;
  }
  return undefined;
}

export function DoctorAppointmentForm({
  doctorId,
  doctorName,
  schedule,
}: {
  doctorId: string;
  doctorName: string;
  schedule?: string | null;
}) {
  const t = useTranslations("doctorAppointment");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(
    createDoctorAppointment,
    initialState,
  );
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(() =>
    nextAvailableDate(schedule),
  );
  const [dateOpen, setDateOpen] = useState(false);
  const [gender, setGender] = useState<GenderValue | "">(
    () => (demoDefault("OTHER") as GenderValue | "") || "",
  );

  if (state.status === "success") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary" aria-hidden />
          <div>
            <h2 className="text-xl font-semibold">{t("successTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("successSubtitle", { name: state.doctorName ?? doctorName })}
            </p>
          </div>

          <div className="grid w-full max-w-md gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-background p-4">
              <p className="flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Hash className="h-3.5 w-3.5" aria-hidden />
                {t("serialLabel")}
              </p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {state.serialNumber}
              </p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                {t("etaLabel")}
              </p>
              <p className="mt-2 text-2xl font-bold text-primary">
                {state.estimatedTime}
              </p>
            </div>
          </div>

          {state.appointmentDateLabel && (
            <p className="text-sm text-muted-foreground">
              {t("dateLabel")}: {state.appointmentDateLabel}
            </p>
          )}

          <p className="max-w-md text-sm text-muted-foreground">{t("successHelp")}</p>

          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/doctors" className={buttonVariants({ variant: "outline" })}>
              {t("backToDoctors")}
            </Link>
            <Link href="/" className={buttonVariants()}>
              {t("backHome")}
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const appointmentDateValue = appointmentDate
    ? formatLocalDateInput(appointmentDate)
    : "";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="doctorId" value={doctorId} />
      <input type="hidden" name="appointmentDate" value={appointmentDateValue} />
      <input type="hidden" name="gender" value={gender} />

      <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        {t("systemAssignsNotice")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="patientName">{t("patientName")}</Label>
          <Input
            id="patientName"
            name="patientName"
            required
            maxLength={120}
            defaultValue={demoDefault(DEV_SAMPLE.patientName)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            maxLength={20}
            placeholder={BD_PHONE_HINT}
            inputMode="tel"
            defaultValue={demoDefault(DEV_SAMPLE.phone)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="appointmentDate">{t("appointmentDate")}</Label>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger
            id="appointmentDate"
            render={
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !appointmentDate && "text-muted-foreground",
                )}
              />
            }
          >
            <CalendarIcon className="mr-2 h-4 w-4" aria-hidden />
            {appointmentDate
              ? appointmentDate.toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : t("appointmentDatePlaceholder")}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={appointmentDate}
              onSelect={(date) => {
                if (!date) return;
                setAppointmentDate(date);
                setDateOpen(false);
              }}
              disabled={(date) => isDateDisabledForDoctor(date, schedule)}
              startMonth={new Date(`${dhakaDateInputValue()}T12:00:00`)}
              endMonth={
                new Date(
                  new Date().getFullYear() + 1,
                  new Date().getMonth(),
                  1,
                )
              }
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">{t("appointmentDateHint")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="age">{t("age")}</Label>
          <Input
            id="age"
            name="age"
            type="number"
            required
            min={0}
            max={130}
            defaultValue={demoDefault(DEV_SAMPLE.age)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("gender")}</Label>
          <GenderRadioGroup
            value={gender}
            onValueChange={setGender}
            required
            labels={{
              male: t("genderMale"),
              female: t("genderFemale"),
              other: t("genderOther"),
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">
          {t("notes")}{" "}
          <span className="text-muted-foreground">({tCommon("optional")})</span>
        </Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          defaultValue={demoDefault(DEV_SAMPLE.contactMessage)}
        />
      </div>

      {state.status === "error" && (
        <p className="text-sm text-destructive" role="alert">
          {t(`errors.${state.errorMessage ?? "generic"}`)}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending || !appointmentDateValue || !gender}
        className="w-full sm:w-auto"
      >
        {isPending ? tCommon("submitting") : t("submit")}
      </Button>
    </form>
  );
}
