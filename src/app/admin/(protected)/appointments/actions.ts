"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { bookDoctorAppointment } from "@/lib/book-doctor-appointment";
import type { AppointmentStatus } from "@prisma/client";

export interface AppointmentActionState {
  status: "idle" | "success" | "error";
  error?: string;
}

export interface AdminBookAppointmentState {
  status: "idle" | "success" | "error";
  serialNumber?: number;
  estimatedTime?: string;
  doctorName?: string;
  appointmentDateLabel?: string;
  error?: string;
}

const STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

const ERROR_MESSAGES: Record<string, string> = {
  errorDateRequired: "Select an appointment date.",
  errorAgeRequired: "Enter the patient's age.",
  errorGenderRequired: "Select the patient's gender.",
  errorPhoneInvalid: "Enter a valid Bangladesh phone number.",
  errorPastDate: "Appointment date cannot be in the past.",
  errorDoctorMissing: "Selected doctor is not available.",
  errorDateUnavailable: "That doctor is not available on the selected date.",
  generic: "Could not book the appointment. Please try again.",
};

const bookSchema = z.object({
  doctorId: z.string().min(1, "Select a doctor."),
  patientName: z.string().trim().min(1, "Patient name is required.").max(120),
  phone: z.string().trim().min(6, "Phone is required.").max(20),
  appointmentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Select an appointment date."),
  age: z.coerce.number().int().min(0).max(130),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  notes: z.string().trim().max(500).optional(),
});

export async function updateAppointmentStatus(
  appointmentId: string,
  _previousState: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  await requireSession();
  const parsed = z
    .object({ status: z.enum(STATUSES) })
    .safeParse({ status: formData.get("status") });

  if (!parsed.success) {
    return { status: "error", error: "Invalid status." };
  }

  await db.doctorAppointment.update({
    where: { id: appointmentId },
    data: { status: parsed.data.status as AppointmentStatus },
  });

  revalidatePath("/admin/appointments");
  return { status: "success" };
}

export async function createAdminDoctorAppointment(
  _previous: AdminBookAppointmentState,
  formData: FormData,
): Promise<AdminBookAppointmentState> {
  await requireSession();

  const parsed = bookSchema.safeParse({
    doctorId: formData.get("doctorId") || undefined,
    patientName: formData.get("patientName"),
    phone: formData.get("phone"),
    appointmentDate: formData.get("appointmentDate") || undefined,
    age: formData.get("age") || undefined,
    gender: formData.get("gender") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? ERROR_MESSAGES.generic,
    };
  }

  const result = await bookDoctorAppointment({
    ...parsed.data,
    notes: parsed.data.notes || undefined,
  });

  if (!result.ok) {
    return {
      status: "error",
      error: ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.generic,
    };
  }

  revalidatePath("/admin/appointments");
  return {
    status: "success",
    serialNumber: result.serialNumber,
    estimatedTime: result.estimatedTime,
    doctorName: result.doctorName,
    appointmentDateLabel: result.appointmentDateLabel,
  };
}
