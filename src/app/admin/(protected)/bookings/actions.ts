"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { bookTestBooking } from "@/lib/book-test-booking";
import { replaceBookingLineDiscounts } from "@/lib/booking-line-discounts";
import { syncBookingPaymentTotals } from "@/lib/booking-payments";
import { getResolvedSiteConfig } from "@/lib/data/site-settings";
import {
  BD_PHONE_INVALID_MESSAGE,
  formatBdPhoneForStorage,
  isValidAge,
} from "@/lib/phone";
import { TIME_SLOT_VALUES } from "@/lib/time-slots";

export interface AdminBookBookingState {
  status: "idle" | "success" | "error";
  bookingId?: string;
  referenceCode?: string;
  estimatedTotal?: number;
  discountTotal?: number;
  netTotal?: number;
  paymentMethod?: "CASH" | "ONLINE";
  error?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  errorEmptyTests: "Select at least one test or package.",
  errorPhoneInvalid: BD_PHONE_INVALID_MESSAGE,
  errorAddressRequired: "Home collection requires an address.",
  errorPastDate: "Preferred date cannot be in the past.",
  errorSlotFull: "That date/time slot is full. Choose another.",
  errorGenderRequired: "Select the patient's gender.",
  generic: "Could not create the booking. Please try again.",
};

const itemSchema = z.object({
  type: z.enum(["test", "package"]),
  id: z.string().min(1),
  discount: z.coerce.number().min(0).max(1_000_000).optional().default(0),
});

const collectMethodSchema = z.enum([
  "CASH",
  "BKASH",
  "NAGAD",
  "CARD",
  "BANK",
  "OTHER",
]);

const bookSchema = z
  .object({
    collectionType: z.enum(["IN_CENTER", "HOME"]),
    items: z.array(itemSchema).min(1, "Select at least one test or package."),
    patientName: z
      .string()
      .trim()
      .min(1, "Patient name is required.")
      .max(120, "Patient name is too long."),
    phone: z.string().trim().min(1, "Phone is required.").max(20),
    age: z.string().trim().min(1, "Enter the patient's age."),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], {
      message: "Select the patient's gender.",
    }),
    branchId: z.string().min(1).optional(),
    preferredDate: z.string().optional(),
    preferredTime: z.string().optional(),
    address: z.string().trim().max(300, "Address is too long.").optional(),
    notes: z.string().trim().max(500, "Notes are too long.").optional(),
    paymentIntent: z.enum(["unpaid", "collect", "pending_online"]).default("unpaid"),
    collectedAmount: z.coerce.number().min(0).max(1_000_000).optional(),
    collectedMethod: collectMethodSchema.optional(),
    paymentReference: z.string().trim().max(120).optional(),
  })
  .superRefine((data, ctx) => {
    if (!formatBdPhoneForStorage(data.phone)) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: BD_PHONE_INVALID_MESSAGE,
      });
    }
    if (!isValidAge(data.age)) {
      ctx.addIssue({
        code: "custom",
        path: ["age"],
        message: "Age must be between 0 and 130.",
      });
    }
    if (data.preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.preferredDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["preferredDate"],
        message: "Enter a valid preferred date.",
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

    if (data.collectionType === "HOME") {
      if (!data.address?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["address"],
          message: "Home collection requires an address.",
        });
      }
      if (!data.preferredDate) {
        ctx.addIssue({
          code: "custom",
          path: ["preferredDate"],
          message: "Preferred date is required for home collection.",
        });
      }
      if (!data.preferredTime) {
        ctx.addIssue({
          code: "custom",
          path: ["preferredTime"],
          message: "Preferred time is required for home collection.",
        });
      }
    }

    if (data.paymentIntent !== "collect") return;

    if (!data.collectedMethod) {
      ctx.addIssue({
        code: "custom",
        path: ["collectedMethod"],
        message: "Choose how payment was collected.",
      });
    }
    if (!data.collectedAmount || data.collectedAmount <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["collectedAmount"],
        message: "Enter the amount collected.",
      });
    }
  });

export async function createAdminTestBooking(
  _previous: AdminBookBookingState,
  formData: FormData,
): Promise<AdminBookBookingState> {
  const session = await requireSession();

  let itemsInput: unknown;
  try {
    itemsInput = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { status: "error", error: ERROR_MESSAGES.errorEmptyTests };
  }

  const ageRaw = formData.get("age");
  const parsed = bookSchema.safeParse({
    collectionType: formData.get("collectionType") || "IN_CENTER",
    items: itemsInput,
    patientName: formData.get("patientName"),
    phone: formData.get("phone"),
    age: ageRaw == null ? "" : String(ageRaw),
    gender: formData.get("gender") || undefined,
    branchId: formData.get("branchId") || undefined,
    preferredDate: formData.get("preferredDate") || undefined,
    preferredTime: formData.get("preferredTime") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
    paymentIntent: formData.get("paymentIntent") || "unpaid",
    collectedAmount: formData.get("collectedAmount") || undefined,
    collectedMethod: formData.get("collectedMethod") || undefined,
    paymentReference: formData.get("paymentReference") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? ERROR_MESSAGES.generic,
    };
  }

  const phone = formatBdPhoneForStorage(parsed.data.phone);
  if (!phone) {
    return { status: "error", error: ERROR_MESSAGES.errorPhoneInvalid };
  }

  const site = await getResolvedSiteConfig();
  if (parsed.data.paymentIntent === "pending_online" && !site.features.onlinePayment) {
    return {
      status: "error",
      error: "Online payment is disabled in site settings.",
    };
  }

  const bookingPaymentMethod =
    parsed.data.paymentIntent === "pending_online"
      ? ("ONLINE" as const)
      : ("CASH" as const);

  const age = Number.parseInt(parsed.data.age, 10);

  const result = await bookTestBooking({
    collectionType: parsed.data.collectionType,
    items: parsed.data.items.map(({ type, id }) => ({ type, id })),
    patientName: parsed.data.patientName,
    phone,
    address: parsed.data.address || undefined,
    notes: parsed.data.notes || undefined,
    preferredDate: parsed.data.preferredDate || undefined,
    preferredTime: parsed.data.preferredTime || undefined,
    branchId: parsed.data.branchId || undefined,
    age,
    gender: parsed.data.gender,
    paymentMethod: bookingPaymentMethod,
  });

  if (!result.ok) {
    return {
      status: "error",
      error: ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.generic,
    };
  }

  const requestedDiscount =
    Math.round(
      parsed.data.items.reduce((sum, item) => sum + (item.discount ?? 0), 0) * 100,
    ) / 100;

  let discountTotal = 0;
  if (requestedDiscount > 0) {
    const booking = await db.booking.findUnique({
      where: { id: result.bookingId },
      include: { items: true },
    });
    if (booking) {
      const lines = parsed.data.items
        .map((inputItem) => {
          const row = booking.items.find((item) =>
            inputItem.type === "package"
              ? item.packageId === inputItem.id
              : item.testId === inputItem.id,
          );
          return {
            itemId: row?.id ?? "",
            discount: inputItem.discount ?? 0,
          };
        })
        .filter((line) => line.itemId);

      await replaceBookingLineDiscounts(result.bookingId, lines, session.userId);
      discountTotal = Math.min(requestedDiscount, result.estimatedTotal);
    }
  }

  const netTotal =
    Math.max(0, Math.round((result.estimatedTotal - discountTotal) * 100) / 100);

  if (parsed.data.paymentIntent === "collect") {
    const requested = Math.round((parsed.data.collectedAmount ?? 0) * 100) / 100;
    const amount = Math.min(requested, netTotal);
    if (amount > 0) {
      await db.bookingPayment.create({
        data: {
          bookingId: result.bookingId,
          kind: "PAYMENT",
          amount,
          method: parsed.data.collectedMethod ?? "CASH",
          reference: parsed.data.paymentReference?.trim() || null,
          note: "Collected at booking",
          paidAt: new Date(),
          recordedById: session.userId,
        },
      });
      await syncBookingPaymentTotals(result.bookingId);
    }
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${result.bookingId}`);
  return {
    status: "success",
    bookingId: result.bookingId,
    referenceCode: result.referenceCode,
    estimatedTotal: result.estimatedTotal,
    discountTotal,
    netTotal,
    paymentMethod: bookingPaymentMethod,
  };
}
