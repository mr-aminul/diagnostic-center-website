"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { reportStorage } from "@/lib/storage";
import { sendSms } from "@/lib/sms";
import { siteConfig } from "@/config/site";

const statusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "SAMPLE_COLLECTED",
  "PROCESSING",
  "REPORT_READY",
  "CANCELLED",
]);

export interface BookingActionState {
  status: "idle" | "success" | "error";
  error?: string;
}

const STATUS_SMS_MESSAGES: Partial<Record<z.infer<typeof statusSchema>, (ref: string) => string>> = {
  CONFIRMED: (ref) => `Your booking ${ref} with ${siteConfig.shortName} has been confirmed.`,
  SAMPLE_COLLECTED: (ref) =>
    `We've collected your sample for booking ${ref}. We'll notify you once your report is ready.`,
  CANCELLED: (ref) => `Your booking ${ref} with ${siteConfig.shortName} has been cancelled.`,
};

export async function updateBookingStatus(
  bookingId: string,
  _previousState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  await requireSession();

  const parsedStatus = statusSchema.safeParse(formData.get("status"));
  if (!parsedStatus.success) {
    return { status: "error", error: "Invalid status." };
  }

  const booking = await db.booking.update({
    where: { id: bookingId },
    data: { status: parsedStatus.data },
  });

  const smsMessage = STATUS_SMS_MESSAGES[parsedStatus.data];
  if (smsMessage) {
    await sendSms(booking.phone, smsMessage(booking.referenceCode));
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");

  return { status: "success" };
}

const paymentStatusSchema = z.enum(["UNPAID", "PENDING_ONLINE", "PAID", "WAIVED"]);

export async function updatePaymentStatus(
  bookingId: string,
  _previousState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  await requireSession();

  const parsed = paymentStatusSchema.safeParse(formData.get("paymentStatus"));
  if (!parsed.success) {
    return { status: "error", error: "Invalid payment status." };
  }

  const booking = await db.booking.update({
    where: { id: bookingId },
    data: { paymentStatus: parsed.data },
  });

  if (parsed.data === "PAID") {
    await sendSms(
      booking.phone,
      `Payment received for booking ${booking.referenceCode} at ${siteConfig.shortName}. Thank you.`
    );
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");

  return { status: "success" };
}

export async function uploadReport(
  bookingId: string,
  _previousState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const session = await requireSession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", error: "Please choose a PDF file to upload." };
  }
  if (file.type !== "application/pdf") {
    return { status: "error", error: "Reports must be uploaded as PDF files." };
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { report: true },
  });
  if (!booking) {
    return { status: "error", error: "Booking not found." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = await reportStorage.save(buffer, file.name);

  if (booking.report) {
    await reportStorage.delete(booking.report.storageKey);
    await db.report.delete({ where: { id: booking.report.id } });
  }

  await db.report.create({
    data: { bookingId, fileName: file.name, storageKey, uploadedById: session.userId },
  });
  await db.booking.update({ where: { id: bookingId }, data: { status: "REPORT_READY" } });

  await sendSms(
    booking.phone,
    `Your report for booking ${booking.referenceCode} is ready! Visit our website's Track page to download it.`
  );

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");

  return { status: "success" };
}
