import { db } from "@/lib/db";
import { derivePaymentStatus, type PaymentStatusId } from "@/lib/payment-details";

/** Recompute denormalized booking payment fields from the ledger. */
export async function syncBookingPaymentTotals(
  bookingId: string,
  options?: { forceStatus?: PaymentStatusId },
) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  if (!booking) return null;

  const paymentRows = booking.payments.filter((row) => row.kind === "PAYMENT");
  const discountRows = booking.payments.filter((row) => row.kind === "DISCOUNT");

  const amountPaid =
    Math.round(paymentRows.reduce((sum, row) => sum + Number(row.amount), 0) * 100) / 100;
  const discountTotal =
    Math.round(discountRows.reduce((sum, row) => sum + Number(row.amount), 0) * 100) / 100;
  const estimatedTotal = Number(booking.estimatedTotal);
  const latestPayment = paymentRows[0] ?? null;

  const paymentStatus =
    options?.forceStatus ??
    derivePaymentStatus({
      amountPaid,
      estimatedTotal,
      discountTotal,
      currentStatus:
        booking.paymentStatus === "PENDING_ONLINE" && amountPaid <= 0
          ? "PENDING_ONLINE"
          : undefined,
    });

  return db.booking.update({
    where: { id: bookingId },
    data: {
      amountPaid,
      discountTotal,
      paymentStatus,
      paymentMethod: latestPayment?.method ?? booking.paymentMethod,
      paymentReference: latestPayment?.reference ?? null,
      paidAt: latestPayment?.paidAt ?? null,
    },
  });
}
