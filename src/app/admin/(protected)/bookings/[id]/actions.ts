"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { reportStorage } from "@/lib/storage";
import { sendSms } from "@/lib/sms";
import { siteConfig } from "@/config/site";
import { syncBookingPaymentTotals } from "@/lib/booking-payments";
import { recomputeBookingInvoice } from "@/lib/booking-items";
import { replaceBookingLineDiscounts } from "@/lib/booking-line-discounts";
import {
  BD_PHONE_INVALID_MESSAGE,
  formatBdPhoneForStorage,
  isValidOptionalAge,
} from "@/lib/phone";
import { TIME_SLOT_VALUES } from "@/lib/time-slots";

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

/** Admin edit: home visit fields may be completed after switching collection type. */
const detailsSchema = z
  .object({
    collectionType: z.enum(["IN_CENTER", "HOME"]),
    patientName: z
      .string()
      .trim()
      .min(1, "Patient name is required.")
      .max(120, "Patient name is too long."),
    phone: z.string().trim().min(1, "Phone is required.").max(20),
    age: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], {
      message: "Select the patient's gender.",
    }),
    branchId: z.string().min(1).optional(),
    preferredDate: z
      .string()
      .optional()
      .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
        message: "Enter a valid preferred date.",
      }),
    preferredTime: z.string().optional(),
    address: z.string().trim().max(300, "Address is too long.").optional(),
    notes: z.string().trim().max(500, "Notes are too long.").optional(),
  })
  .superRefine((data, ctx) => {
    if (!formatBdPhoneForStorage(data.phone)) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: BD_PHONE_INVALID_MESSAGE,
      });
    }
    if (data.age != null && data.age !== "" && !isValidOptionalAge(data.age)) {
      ctx.addIssue({
        code: "custom",
        path: ["age"],
        message: "Age must be between 0 and 130.",
      });
    }
    if (
      data.preferredTime &&
      !TIME_SLOT_VALUES.includes(
        data.preferredTime as (typeof TIME_SLOT_VALUES)[number],
      )
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["preferredTime"],
        message: "Choose a valid time slot.",
      });
    }
  });

export async function updateBookingDetails(
  bookingId: string,
  _previousState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  await requireSession();

  const ageRaw = formData.get("age");
  const parsed = detailsSchema.safeParse({
    collectionType: formData.get("collectionType") || "IN_CENTER",
    patientName: formData.get("patientName"),
    phone: formData.get("phone"),
    age: ageRaw == null ? "" : String(ageRaw),
    gender: formData.get("gender") || undefined,
    branchId: formData.get("branchId") || undefined,
    preferredDate: formData.get("preferredDate") || undefined,
    preferredTime: formData.get("preferredTime") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Could not save booking details.",
    };
  }

  const phone = formatBdPhoneForStorage(parsed.data.phone);
  if (!phone) {
    return { status: "error", error: BD_PHONE_INVALID_MESSAGE };
  }

  const existing = await db.booking.findUnique({ where: { id: bookingId } });
  if (!existing) {
    return { status: "error", error: "Booking not found." };
  }

  const data = parsed.data;
  const age =
    data.age != null && data.age !== "" ? Number.parseInt(data.age, 10) : null;
  await db.booking.update({
    where: { id: bookingId },
    data: {
      patientName: data.patientName,
      phone,
      age,
      gender: data.gender,
      collectionType: data.collectionType,
      address: data.collectionType === "HOME" ? (data.address?.trim() || null) : null,
      branchId: data.collectionType === "IN_CENTER" ? (data.branchId || null) : null,
      preferredDate: data.preferredDate ? new Date(`${data.preferredDate}T00:00:00.000Z`) : null,
      preferredTime:
        data.collectionType === "HOME" ? (data.preferredTime || null) : null,
      notes: data.notes?.trim() || null,
    },
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  return { status: "success" };
}

export async function updateBookingItemDiscounts(
  bookingId: string,
  _previousState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const session = await requireSession();

  let linesRaw: unknown;
  try {
    linesRaw = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { status: "error", error: "Invalid discount payload." };
  }

  const linesSchema = z.array(
    z.object({
      itemId: z.string().min(1),
      discount: z.coerce.number().min(0).max(1_000_000),
    }),
  );
  const parsed = linesSchema.safeParse(linesRaw);
  if (!parsed.success) {
    return { status: "error", error: "Invalid discount lines." };
  }

  const existing = await db.booking.findUnique({
    where: { id: bookingId },
    include: { items: true },
  });
  if (!existing) {
    return { status: "error", error: "Booking not found." };
  }

  const estimatedTotal = Number(existing.estimatedTotal);
  const requested = Math.round(
    parsed.data.reduce((sum, line) => sum + line.discount, 0) * 100,
  ) / 100;
  if (requested > estimatedTotal + 0.001) {
    return {
      status: "error",
      error: `Discount cannot exceed the invoice (৳${estimatedTotal.toFixed(0)}).`,
    };
  }

  const updated = await replaceBookingLineDiscounts(
    bookingId,
    parsed.data,
    session.userId,
  );
  if (!updated) {
    return { status: "error", error: "Could not update discounts." };
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  return { status: "success" };
}

const paymentMethodSchema = z.enum([
  "CASH",
  "ONLINE",
  "BKASH",
  "NAGAD",
  "CARD",
  "BANK",
  "OTHER",
]);

const ledgerKindSchema = z.enum(["PAYMENT", "DISCOUNT"]);
const paymentIntentSchema = z.enum(["add", "reset", "pending_online"]);

export async function updateBookingPayment(
  bookingId: string,
  _previousState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const session = await requireSession();

  const intent = paymentIntentSchema.safeParse(formData.get("intent") ?? "add");
  if (!intent.success) {
    return { status: "error", error: "Invalid payment action." };
  }

  const existing = await db.booking.findUnique({
    where: { id: bookingId },
    include: { payments: true },
  });
  if (!existing) {
    return { status: "error", error: "Booking not found." };
  }

  const estimatedTotal = Number(existing.estimatedTotal);
  const previouslyPaid = Number(existing.amountPaid);
  const previousDiscount = Number(existing.discountTotal);
  const previousNet = Math.max(0, estimatedTotal - previousDiscount);
  let shouldNotifyPaid = false;

  if (intent.data === "reset" || intent.data === "pending_online") {
    if (intent.data === "reset") {
      await db.bookingPayment.deleteMany({
        where: { bookingId, kind: "PAYMENT" },
      });
      await syncBookingPaymentTotals(bookingId);
    } else {
      await db.bookingPayment.deleteMany({ where: { bookingId } });
      await db.booking.update({
        where: { id: bookingId },
        data: {
          amountPaid: 0,
          discountTotal: 0,
          paymentReference: null,
          paidAt: null,
          paymentMethod: "ONLINE",
          paymentStatus: "PENDING_ONLINE",
        },
      });
    }
  } else {
    const kind = ledgerKindSchema.safeParse(formData.get("kind") ?? "PAYMENT");
    if (!kind.success) {
      return { status: "error", error: "Choose Payment or Discount." };
    }

    const amountRaw = String(formData.get("amount") ?? "").trim();
    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { status: "error", error: "Enter an amount greater than zero." };
    }

    const roundedAmount = Math.round(amount * 100) / 100;
    const reference = String(formData.get("paymentReference") ?? "").trim() || null;
    const note = String(formData.get("note") ?? "").trim() || null;

    if (kind.data === "DISCOUNT") {
      const discountRoom = Math.max(0, estimatedTotal - previousDiscount);
      if (roundedAmount > discountRoom + 0.001) {
        return {
          status: "error",
          error: `Discount cannot exceed ৳${discountRoom.toFixed(2)} of the invoice.`,
        };
      }

      await db.bookingPayment.create({
        data: {
          bookingId,
          kind: "DISCOUNT",
          amount: roundedAmount,
          method: null,
          reference,
          note,
          paidAt: new Date(),
          recordedById: session.userId,
        },
      });
    } else {
      const remaining = Math.max(0, previousNet - previouslyPaid);
      if (roundedAmount > remaining + 0.001) {
        return {
          status: "error",
          error: `Amount cannot exceed the remaining balance (৳${remaining.toFixed(2)}).`,
        };
      }

      const method = paymentMethodSchema.safeParse(formData.get("paymentMethod"));
      if (!method.success) {
        return { status: "error", error: "Invalid payment method." };
      }

      await db.bookingPayment.create({
        data: {
          bookingId,
          kind: "PAYMENT",
          amount: roundedAmount,
          method: method.data,
          reference,
          note,
          paidAt: new Date(),
          recordedById: session.userId,
        },
      });
    }

    const booking = await syncBookingPaymentTotals(bookingId);
    shouldNotifyPaid =
      kind.data === "PAYMENT" &&
      booking?.paymentStatus === "PAID" &&
      previouslyPaid < previousNet;
  }

  if (shouldNotifyPaid) {
    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (booking) {
      await sendSms(
        booking.phone,
        `Payment received for booking ${booking.referenceCode} at ${siteConfig.shortName}. Thank you.`
      );
    }
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");

  return { status: "success" };
}

export async function deleteBookingPayment(
  bookingId: string,
  paymentId: string,
  _previousState: BookingActionState,
  _formData: FormData
): Promise<BookingActionState> {
  await requireSession();

  const payment = await db.bookingPayment.findFirst({
    where: { id: paymentId, bookingId },
  });
  if (!payment) {
    return { status: "error", error: "Payment transaction not found." };
  }

  await db.bookingPayment.delete({ where: { id: paymentId } });
  await syncBookingPaymentTotals(bookingId);

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");

  return { status: "success" };
}

const catalogItemSchema = z.object({
  type: z.enum(["test", "package"]),
  id: z.string().min(1),
});

async function resolveCatalogItem(input: z.infer<typeof catalogItemSchema>) {
  if (input.type === "test") {
    const test = await db.test.findFirst({
      where: { id: input.id, isActive: true },
    });
    if (!test) return null;
    return {
      type: "test" as const,
      testId: test.id,
      packageId: null as string | null,
      nameSnapshot: test.name,
      priceSnapshot: Number(test.price),
    };
  }

  const pkg = await db.package.findFirst({
    where: { id: input.id, isActive: true },
  });
  if (!pkg) return null;
  return {
    type: "package" as const,
    testId: null as string | null,
    packageId: pkg.id,
    nameSnapshot: pkg.name,
    priceSnapshot: Number(pkg.price),
  };
}

export async function addBookingItem(
  bookingId: string,
  input: { type: "test" | "package"; id: string },
): Promise<{ error?: string }> {
  const session = await requireSession();
  const parsed = catalogItemSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid test or package." };

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { items: true },
  });
  if (!booking) return { error: "Booking not found." };

  const alreadyOnBooking = booking.items.some((item) =>
    parsed.data.type === "test"
      ? item.testId === parsed.data.id
      : item.packageId === parsed.data.id,
  );
  if (alreadyOnBooking) {
    return { error: "That test or package is already on this booking." };
  }

  const catalogItem = await resolveCatalogItem(parsed.data);
  if (!catalogItem) return { error: "Test or package not found." };

  await db.bookingItem.create({
    data: {
      bookingId,
      testId: catalogItem.testId,
      packageId: catalogItem.packageId,
      nameSnapshot: catalogItem.nameSnapshot,
      priceSnapshot: catalogItem.priceSnapshot,
    },
  });

  await recomputeBookingInvoice(bookingId, session.userId);
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  return {};
}

export async function replaceBookingItem(
  bookingId: string,
  bookingItemId: string,
  input: { type: "test" | "package"; id: string },
): Promise<{ error?: string }> {
  const session = await requireSession();
  const parsed = catalogItemSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid test or package." };

  const item = await db.bookingItem.findFirst({
    where: { id: bookingItemId, bookingId },
    include: { report: true },
  });
  if (!item) return { error: "Item not found." };
  if (item.report) {
    return { error: "Delete the report for this item before replacing it." };
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { items: true },
  });
  if (!booking) return { error: "Booking not found." };

  const alreadyOnBooking = booking.items.some(
    (row) =>
      row.id !== bookingItemId &&
      (parsed.data.type === "test"
        ? row.testId === parsed.data.id
        : row.packageId === parsed.data.id),
  );
  if (alreadyOnBooking) {
    return { error: "That test or package is already on this booking." };
  }

  const catalogItem = await resolveCatalogItem(parsed.data);
  if (!catalogItem) return { error: "Test or package not found." };

  await db.bookingItem.update({
    where: { id: item.id },
    data: {
      testId: catalogItem.testId,
      packageId: catalogItem.packageId,
      nameSnapshot: catalogItem.nameSnapshot,
      priceSnapshot: catalogItem.priceSnapshot,
    },
  });

  await recomputeBookingInvoice(bookingId, session.userId);
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  return {};
}

export async function removeBookingItem(
  bookingId: string,
  bookingItemId: string,
): Promise<{ error?: string }> {
  const session = await requireSession();

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      items: { include: { report: true } },
    },
  });
  if (!booking) return { error: "Booking not found." };
  if (booking.items.length <= 1) {
    return { error: "A booking must keep at least one test or package." };
  }

  const item = booking.items.find((row) => row.id === bookingItemId);
  if (!item) return { error: "Item not found." };
  if (item.report) {
    return { error: "Delete the report for this item before removing it." };
  }

  await db.bookingItem.delete({ where: { id: item.id } });
  await recomputeBookingInvoice(bookingId, session.userId);
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  return {};
}

export async function uploadReport(
  bookingId: string,
  _previousState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const session = await requireSession();

  const bookingItemId = String(formData.get("bookingItemId") ?? "").trim();
  if (!bookingItemId) {
    return { status: "error", error: "Choose which test or package this report belongs to." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", error: "Please choose a PDF file to upload." };
  }
  if (file.type !== "application/pdf") {
    return { status: "error", error: "Reports must be uploaded as PDF files." };
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      items: {
        where: { id: bookingItemId },
        include: { report: true },
      },
    },
  });
  if (!booking) {
    return { status: "error", error: "Booking not found." };
  }

  const item = booking.items[0];
  if (!item) {
    return { status: "error", error: "That test or package is not on this booking." };
  }

  if (item.report) {
    return {
      status: "error",
      error: "Delete the current report before uploading a new one.",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = await reportStorage.save(buffer, file.name);

  await db.report.create({
    data: {
      bookingId,
      bookingItemId: item.id,
      fileName: file.name,
      storageKey,
      uploadedById: session.userId,
    },
  });

  const [itemCount, reportCount] = await Promise.all([
    db.bookingItem.count({ where: { bookingId } }),
    db.report.count({ where: { bookingId } }),
  ]);
  const allReportsReady = itemCount > 0 && reportCount >= itemCount;
  if (booking.status !== "CANCELLED") {
    await db.booking.update({
      where: { id: bookingId },
      data: { status: allReportsReady ? "REPORT_READY" : "PROCESSING" },
    });
  }

  if (booking.status !== "CANCELLED") {
    await sendSms(
      booking.phone,
      allReportsReady
        ? `Your reports for booking ${booking.referenceCode} are ready! Visit our website's Track page to download them.`
        : `Your report for ${item.nameSnapshot} (${booking.referenceCode}) is ready! Visit our website's Track page to download it.`,
    );
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");

  return { status: "success" };
}

export async function deleteReport(
  bookingId: string,
  bookingItemId: string,
): Promise<{ error?: string }> {
  await requireSession();

  const report = await db.report.findFirst({
    where: { bookingId, bookingItemId },
  });
  if (!report) {
    return { error: "Report not found." };
  }

  await reportStorage.delete(report.storageKey);
  await db.report.delete({ where: { id: report.id } });

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { status: true },
  });
  const [itemCount, remaining] = await Promise.all([
    db.bookingItem.count({ where: { bookingId } }),
    db.report.count({ where: { bookingId } }),
  ]);
  if (
    booking &&
    booking.status !== "CANCELLED" &&
    (remaining === 0 || remaining < itemCount)
  ) {
    await db.booking.update({
      where: { id: bookingId },
      data: { status: "PROCESSING" },
    });
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");

  return {};
}
