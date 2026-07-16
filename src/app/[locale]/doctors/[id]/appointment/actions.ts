"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { lastDigits } from "@/lib/phone";
import { sendSms } from "@/lib/sms";
import { siteConfig } from "@/config/site";
import { estimateTimeForSerial } from "@/lib/doctor-serial";
import {
  appointmentDateFromInput,
  isDoctorAvailableOnWeekday,
  isPastDhakaDateString,
  weekdayFromDateInput,
} from "@/lib/doctor-availability";

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

  const data = parsed.data;

  if (lastDigits(data.phone).length < 10) {
    return { status: "error", errorMessage: "errorPhoneInvalid" };
  }

  if (isPastDhakaDateString(data.appointmentDate)) {
    return { status: "error", errorMessage: "errorPastDate" };
  }

  const doctor = await db.doctor.findFirst({
    where: { id: data.doctorId, isActive: true },
  });

  if (!doctor) {
    return { status: "error", errorMessage: "errorDoctorMissing" };
  }

  const availabilitySchedule = doctor.schedule ?? doctor.scheduleBn;
  const weekday = weekdayFromDateInput(data.appointmentDate);
  if (!isDoctorAvailableOnWeekday(availabilitySchedule, weekday)) {
    return { status: "error", errorMessage: "errorDateUnavailable" };
  }

  const appointmentDate = appointmentDateFromInput(data.appointmentDate);

  const existingCount = await db.doctorAppointment.count({
    where: { doctorId: doctor.id, appointmentDate },
  });
  const serialNumber = existingCount + 1;
  const estimatedTime = estimateTimeForSerial(serialNumber, doctor.schedule);

  try {
    await db.doctorAppointment.create({
      data: {
        doctorId: doctor.id,
        patientName: data.patientName,
        phone: data.phone,
        age: data.age,
        gender: data.gender,
        serialNumber,
        appointmentDate,
        estimatedTime,
        notes: data.notes,
      },
    });
  } catch {
    // Unique race — retry once with a fresh count
    const retryCount = await db.doctorAppointment.count({
      where: { doctorId: doctor.id, appointmentDate },
    });
    const retrySerial = retryCount + 1;
    const retryEta = estimateTimeForSerial(retrySerial, doctor.schedule);

    try {
      await db.doctorAppointment.create({
        data: {
          doctorId: doctor.id,
          patientName: data.patientName,
          phone: data.phone,
          age: data.age,
          gender: data.gender,
          serialNumber: retrySerial,
          appointmentDate,
          estimatedTime: retryEta,
          notes: data.notes,
        },
      });

      await notifyPatient({
        phone: data.phone,
        doctorName: doctor.name,
        serialNumber: retrySerial,
        estimatedTime: retryEta,
        appointmentDateLabel: formatDateLabel(appointmentDate),
      });

      return {
        status: "success",
        serialNumber: retrySerial,
        estimatedTime: retryEta,
        doctorName: doctor.name,
        appointmentDateLabel: formatDateLabel(appointmentDate),
      };
    } catch {
      return { status: "error", errorMessage: "generic" };
    }
  }

  await notifyPatient({
    phone: data.phone,
    doctorName: doctor.name,
    serialNumber,
    estimatedTime,
    appointmentDateLabel: formatDateLabel(appointmentDate),
  });

  return {
    status: "success",
    serialNumber,
    estimatedTime,
    doctorName: doctor.name,
    appointmentDateLabel: formatDateLabel(appointmentDate),
  };
}

async function notifyPatient({
  phone,
  doctorName,
  serialNumber,
  estimatedTime,
  appointmentDateLabel,
}: {
  phone: string;
  doctorName: string;
  serialNumber: number;
  estimatedTime: string;
  appointmentDateLabel: string;
}) {
  await sendSms(
    phone,
    `${siteConfig.shortName}: appointment with ${doctorName} on ${appointmentDateLabel}. Serial #${serialNumber}, estimated ${estimatedTime}. Arrive a little early.`,
  );
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
