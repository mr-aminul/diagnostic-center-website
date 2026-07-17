"use server";

import { z } from "zod";
import { bookTestBooking } from "@/lib/book-test-booking";
import { formatBdPhoneForStorage } from "@/lib/phone";

const itemSchema = z.object({
  type: z.enum(["test", "package"]),
  id: z.string().min(1),
});

const bookingSchema = z
  .object({
    collectionType: z.enum(["IN_CENTER", "HOME"]),
    items: z.array(itemSchema).min(1),
    patientName: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(1).max(20),
    age: z.coerce.number().int().min(0).max(130).optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    branchId: z.string().min(1).optional(),
    preferredDate: z.string().optional(),
    preferredTime: z.string().optional(),
    address: z.string().trim().max(300).optional(),
    notes: z.string().trim().max(500).optional(),
    paymentMethod: z.enum(["CASH", "ONLINE"]).default("CASH"),
    doctorId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!formatBdPhoneForStorage(data.phone)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "errorPhoneInvalid" });
    }
    if (data.collectionType !== "HOME") return;
    if (!data.preferredDate) {
      ctx.addIssue({ code: "custom", path: ["preferredDate"], message: "errorDateRequired" });
    }
    if (!data.preferredTime) {
      ctx.addIssue({ code: "custom", path: ["preferredTime"], message: "errorTimeRequired" });
    }
  });

export interface BookingFormState {
  status: "idle" | "success" | "error";
  referenceCode?: string;
  estimatedTotal?: number;
  paymentMethod?: "CASH" | "ONLINE";
  patientPhone?: string;
  preparations?: string[];
  errorMessage?: string;
}

export async function createBooking(
  _previousState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  let itemsInput: unknown;
  try {
    itemsInput = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { status: "error", errorMessage: "errorEmptyTests" };
  }

  const parsed = bookingSchema.safeParse({
    collectionType: formData.get("collectionType"),
    items: itemsInput,
    patientName: formData.get("patientName"),
    phone: formData.get("phone"),
    age: formData.get("age") || undefined,
    gender: formData.get("gender") || undefined,
    branchId: formData.get("branchId") || undefined,
    preferredDate: formData.get("preferredDate") || undefined,
    preferredTime: formData.get("preferredTime") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
    paymentMethod: formData.get("paymentMethod") || "CASH",
    doctorId: formData.get("doctorId") || undefined,
  });

  if (!parsed.success) {
    const paths = parsed.error.issues.map((issue) => issue.path[0]);
    if (paths.includes("items")) {
      return { status: "error", errorMessage: "errorEmptyTests" };
    }
    if (paths.includes("phone")) {
      return { status: "error", errorMessage: "errorPhoneInvalid" };
    }
    if (paths.includes("gender")) {
      return { status: "error", errorMessage: "errorGenderRequired" };
    }
    if (paths.includes("preferredDate")) {
      return { status: "error", errorMessage: "errorDateRequired" };
    }
    if (paths.includes("preferredTime")) {
      return { status: "error", errorMessage: "errorTimeRequired" };
    }
    return { status: "error", errorMessage: "generic" };
  }

  const phone = formatBdPhoneForStorage(parsed.data.phone);
  if (!phone) {
    return { status: "error", errorMessage: "errorPhoneInvalid" };
  }

  const result = await bookTestBooking({ ...parsed.data, phone });
  if (!result.ok) {
    return { status: "error", errorMessage: result.error };
  }

  return {
    status: "success",
    referenceCode: result.referenceCode,
    estimatedTotal: result.estimatedTotal,
    paymentMethod: result.paymentMethod,
    patientPhone: result.patientPhone,
    preparations: result.preparations,
  };
}
