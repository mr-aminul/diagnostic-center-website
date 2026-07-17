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

export type BookDoctorAppointmentError =
  | "errorDateRequired"
  | "errorAgeRequired"
  | "errorGenderRequired"
  | "errorPhoneInvalid"
  | "errorPastDate"
  | "errorDoctorMissing"
  | "errorDateUnavailable"
  | "generic";

export interface BookDoctorAppointmentInput {
  doctorId: string;
  patientName: string;
  phone: string;
  appointmentDate: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  notes?: string;
}

export type BookDoctorAppointmentResult =
  | {
      ok: true;
      serialNumber: number;
      estimatedTime: string;
      doctorName: string;
      appointmentDateLabel: string;
    }
  | { ok: false; error: BookDoctorAppointmentError };

export async function bookDoctorAppointment(
  input: BookDoctorAppointmentInput,
): Promise<BookDoctorAppointmentResult> {
  if (lastDigits(input.phone).length < 10) {
    return { ok: false, error: "errorPhoneInvalid" };
  }

  if (isPastDhakaDateString(input.appointmentDate)) {
    return { ok: false, error: "errorPastDate" };
  }

  const doctor = await db.doctor.findFirst({
    where: { id: input.doctorId, isActive: true },
  });

  if (!doctor) {
    return { ok: false, error: "errorDoctorMissing" };
  }

  const availabilitySchedule = doctor.schedule ?? doctor.scheduleBn;
  const weekday = weekdayFromDateInput(input.appointmentDate);
  if (!isDoctorAvailableOnWeekday(availabilitySchedule, weekday)) {
    return { ok: false, error: "errorDateUnavailable" };
  }

  const appointmentDate = appointmentDateFromInput(input.appointmentDate);
  const existingCount = await db.doctorAppointment.count({
    where: { doctorId: doctor.id, appointmentDate },
  });
  const serialNumber = existingCount + 1;
  const estimatedTime = estimateTimeForSerial(
    serialNumber,
    doctor.schedule,
    doctor.minutesPerPatient,
  );

  const createData = {
    doctorId: doctor.id,
    patientName: input.patientName,
    phone: input.phone,
    age: input.age,
    gender: input.gender,
    serialNumber,
    appointmentDate,
    estimatedTime,
    notes: input.notes,
  };

  try {
    await db.doctorAppointment.create({ data: createData });
  } catch {
    const retryCount = await db.doctorAppointment.count({
      where: { doctorId: doctor.id, appointmentDate },
    });
    const retrySerial = retryCount + 1;
    const retryEta = estimateTimeForSerial(
      retrySerial,
      doctor.schedule,
      doctor.minutesPerPatient,
    );

    try {
      await db.doctorAppointment.create({
        data: {
          ...createData,
          serialNumber: retrySerial,
          estimatedTime: retryEta,
        },
      });

      const appointmentDateLabel = formatDateLabel(appointmentDate);
      await notifyPatient({
        phone: input.phone,
        doctorName: doctor.name,
        serialNumber: retrySerial,
        estimatedTime: retryEta,
        appointmentDateLabel,
      });

      return {
        ok: true,
        serialNumber: retrySerial,
        estimatedTime: retryEta,
        doctorName: doctor.name,
        appointmentDateLabel,
      };
    } catch {
      return { ok: false, error: "generic" };
    }
  }

  const appointmentDateLabel = formatDateLabel(appointmentDate);
  await notifyPatient({
    phone: input.phone,
    doctorName: doctor.name,
    serialNumber,
    estimatedTime,
    appointmentDateLabel,
  });

  return {
    ok: true,
    serialNumber,
    estimatedTime,
    doctorName: doctor.name,
    appointmentDateLabel,
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
