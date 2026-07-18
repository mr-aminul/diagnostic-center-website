"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { CalendarIcon, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GenderRadioGroup, type GenderValue } from "@/components/gender-radio-group";
import {
  DoctorSearchCombobox,
  type SearchableDoctor,
} from "@/components/admin/doctor-search-combobox";
import {
  createAdminDoctorAppointment,
  type AdminBookAppointmentState,
} from "@/app/admin/(protected)/appointments/actions";
import { BD_PHONE_HINT } from "@/lib/phone";
import {
  dhakaDateInputValue,
  formatLocalDateInput,
  isDateDisabledForDoctor,
} from "@/lib/doctor-availability";
import { cn } from "@/lib/utils";

export interface BookableDoctor extends SearchableDoctor {
  schedule: string | null;
  scheduleBn: string | null;
}

const initialState: AdminBookAppointmentState = { status: "idle" };

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

export function BookAppointmentDialog({ doctors }: { doctors: BookableDoctor[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createAdminDoctorAppointment,
    initialState,
  );
  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>();
  const [dateOpen, setDateOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [gender, setGender] = useState<GenderValue | "">("");

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === doctorId),
    [doctors, doctorId],
  );
  const schedule = selectedDoctor?.schedule ?? selectedDoctor?.scheduleBn;

  useEffect(() => {
    if (!open || !doctorId) {
      setAppointmentDate(undefined);
      return;
    }
    setAppointmentDate(nextAvailableDate(schedule));
  }, [open, doctorId, schedule]);

  useEffect(() => {
    if (state.status === "success" && state.serialNumber != null) {
      setShowSuccess(true);
      toast.success(
        `Booked serial #${state.serialNumber} at ${state.estimatedTime} with ${state.doctorName}.`,
      );
    } else if (state.status === "error" && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const appointmentDateValue = appointmentDate
    ? formatLocalDateInput(appointmentDate)
    : "";

  function prepareFreshForm() {
    setShowSuccess(false);
    setFormKey((key) => key + 1);
    setDoctorId("");
    setAppointmentDate(undefined);
    setGender("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) prepareFreshForm();
      }}
    >
      <DialogTrigger render={<Button disabled={doctors.length === 0} />}>
        <Plus className="h-4 w-4" />
        Book appointment
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Book doctor appointment</DialogTitle>
        </DialogHeader>

        {doctors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add an active doctor before booking appointments.
          </p>
        ) : showSuccess && state.status === "success" ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/40 px-4 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden />
              <div>
                <p className="font-medium">Appointment booked</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {state.doctorName}
                  {state.appointmentDateLabel ? ` · ${state.appointmentDateLabel}` : ""}
                </p>
              </div>
              <div className="grid w-full max-w-xs grid-cols-2 gap-3">
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Serial</p>
                  <p className="text-2xl font-semibold">#{state.serialNumber}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Estimated</p>
                  <p className="text-2xl font-semibold">{state.estimatedTime}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                An SMS confirmation was sent to the patient&apos;s phone.
              </p>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button type="button" onClick={prepareFreshForm}>
                Book another
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form key={formKey} action={formAction} className="space-y-4">
            <input type="hidden" name="doctorId" value={doctorId} />
            <input type="hidden" name="appointmentDate" value={appointmentDateValue} />
            <input type="hidden" name="gender" value={gender} />

            <p className="text-sm text-muted-foreground">
              For hotline callers. Serial and estimated time are assigned automatically.
            </p>

            <div className="space-y-2">
              <Label htmlFor="admin-doctor">Doctor</Label>
              <DoctorSearchCombobox
                id="admin-doctor"
                doctors={doctors}
                value={doctorId}
                onValueChange={setDoctorId}
              />
              {schedule && (
                <p className="text-xs text-muted-foreground">Schedule: {schedule}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-patientName">Patient name</Label>
                <Input id="admin-patientName" name="patientName" required maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-phone">Phone</Label>
                <Input
                  id="admin-phone"
                  name="phone"
                  type="tel"
                  required
                  maxLength={20}
                  placeholder={BD_PHONE_HINT}
                  inputMode="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-appointmentDate">Appointment date</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger
                  id="admin-appointmentDate"
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
                    : "Select date"}
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
                      new Date(new Date().getFullYear() + 1, new Date().getMonth(), 1)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-age">Age</Label>
                <Input id="admin-age" name="age" type="number" required min={0} max={130} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <GenderRadioGroup
                  idPrefix="admin-appt-gender"
                  value={gender}
                  onValueChange={setGender}
                  required
                  labels={{ male: "Male", female: "Female", other: "Other" }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-notes">
                Notes <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea id="admin-notes" name="notes" rows={2} maxLength={500} />
            </div>

            {state.status === "error" && state.error && (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="submit"
                disabled={isPending || !doctorId || !appointmentDateValue || !gender}
              >
                {isPending ? "Booking..." : "Book appointment"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
