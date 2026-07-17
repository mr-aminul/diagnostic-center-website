"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/sms";
import { lastDigits } from "@/lib/phone";
import { generateDemoTransactionId, isDemoPaymentResolved } from "@/lib/payment";
import { getResolvedSiteConfig } from "@/lib/data/site-settings";
import { syncBookingPaymentTotals } from "@/lib/booking-payments";

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
  if (!(await isDemoPaymentResolved())) {
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
  const methodMap = {
    bkash: "BKASH",
    nagad: "NAGAD",
    card: "CARD",
  } as const;
  const remaining = Math.max(
    0,
    Number(booking.estimatedTotal) - Number(booking.amountPaid),
  );

  if (remaining <= 0) {
    return { status: "success", transactionId };
  }

  await db.bookingPayment.create({
    data: {
      bookingId: booking.id,
      amount: remaining,
      method: methodMap[parsed.data.method],
      reference: transactionId,
      note: "Demo online payment",
      paidAt: new Date(),
    },
  });
  await syncBookingPaymentTotals(booking.id);

  const site = await getResolvedSiteConfig();
  await sendSms(
    booking.phone,
    `${site.shortName}: demo payment received for ${referenceCode}. Txn ${transactionId}. (Sandbox — no real charge.)`
  );

  return { status: "success", transactionId };
}
