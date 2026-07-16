"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/sms";
import { siteConfig } from "@/config/site";
import { lastDigits } from "@/lib/phone";
import { generateDemoTransactionId, isDemoPayment } from "@/lib/payment";

const confirmSchema = z.object({
  referenceCode: z.string().trim().min(1).max(30),
  phone: z.string().trim().min(6).max(20),
  method: z.enum(["bkash", "nagad", "card"]),
});

export interface DemoPaymentState {
  status: "idle" | "success" | "error";
  transactionId?: string;
  errorMessage?: string;
}

/**
 * Completes a demo (placeholder) payment. Only works while
 * `siteConfig.payment.provider === "demo"`. A live gateway would confirm
 * via webhook instead of this action.
 */
export async function confirmDemoPayment(
  _previousState: DemoPaymentState,
  formData: FormData
): Promise<DemoPaymentState> {
  if (!isDemoPayment()) {
    return { status: "error", errorMessage: "Demo payments are disabled." };
  }

  const parsed = confirmSchema.safeParse({
    referenceCode: formData.get("referenceCode"),
    phone: formData.get("phone"),
    method: formData.get("method"),
  });

  if (!parsed.success) {
    return { status: "error", errorMessage: "Invalid payment details." };
  }

  // Simulate gateway processing latency.
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const referenceCode = parsed.data.referenceCode.toUpperCase();
  const phoneSuffix = lastDigits(parsed.data.phone);
  if (phoneSuffix.length < 6) {
    return { status: "error", errorMessage: "Invalid phone number." };
  }

  const booking = await db.booking.findFirst({
    where: {
      referenceCode,
      phone: { contains: phoneSuffix },
      paymentMethod: "ONLINE",
    },
  });

  if (!booking) {
    return { status: "error", errorMessage: "Booking not found." };
  }

  if (booking.paymentStatus === "PAID") {
    return {
      status: "success",
      transactionId: generateDemoTransactionId(parsed.data.method),
    };
  }

  if (booking.paymentStatus !== "PENDING_ONLINE" && booking.paymentStatus !== "UNPAID") {
    return { status: "error", errorMessage: "This booking cannot be paid online." };
  }

  const transactionId = generateDemoTransactionId(parsed.data.method);

  await db.booking.update({
    where: { id: booking.id },
    data: {
      paymentStatus: "PAID",
      notes: booking.notes
        ? `${booking.notes}\n[demo-payment] ${parsed.data.method} ${transactionId}`
        : `[demo-payment] ${parsed.data.method} ${transactionId}`,
    },
  });

  await sendSms(
    booking.phone,
    `${siteConfig.shortName}: demo payment received for ${referenceCode}. Txn ${transactionId}. (Sandbox — no real charge.)`
  );

  return { status: "success", transactionId };
}
