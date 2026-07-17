"use server";

import { z } from "zod";
import { bookDoctorAppointment } from "@/lib/book-doctor-appointment";

const appointmentSchema = z.object({
  doctorId: z.string().min(1),
  patientName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(20),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  age: z.coerce.number().int().min(0).max(130),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  notes: z.string().trim().max(500).optional(),
});

export interface AppointmentFormState {
  status: "idle" | "success" | "error";
  serialNumber?: number;
  estimatedTime?: string;
  doctorName?: string;
  appointmentDateLabel?: string;
  errorMessage?: string;
}

export async function createDoctorAppointment(
  _previous: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  const parsed = appointmentSchema.safeParse({
    doctorId: formData.get("doctorId"),
    patientName: formData.get("patientName"),
    phone: formData.get("phone"),
    appointmentDate: formData.get("appointmentDate") || undefined,
    age: formData.get("age") || undefined,
    gender: formData.get("gender") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    const paths = parsed.error.issues.map((issue) => issue.path[0]);
    if (paths.includes("appointmentDate")) {
      return { status: "error", errorMessage: "errorDateRequired" };
    }
    if (paths.includes("age")) {
      return { status: "error", errorMessage: "errorAgeRequired" };
    }
    if (paths.includes("gender")) {
      return { status: "error", errorMessage: "errorGenderRequired" };
    }
    return { status: "error", errorMessage: "generic" };
  }

  const result = await bookDoctorAppointment(parsed.data);
  if (!result.ok) {
    return { status: "error", errorMessage: result.error };
  }

  return {
    status: "success",
    serialNumber: result.serialNumber,
    estimatedTime: result.estimatedTime,
    doctorName: result.doctorName,
    appointmentDateLabel: result.appointmentDateLabel,
  };
}
