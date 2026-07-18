import { db } from "@/lib/db";
import {
  derivePaymentStatus,
  netInvoiceDue,
  type PaymentStatusId,
} from "@/lib/payment-details";

/**
 * After invoice totals shrink (e.g. item cancel), record a REFUND for any
 * amount still held above the new net due.
 */
export async function refundBookingOverpayment(
  bookingId: string,
  recordedById: string,
  note?: string,
) {
  await syncBookingPaymentTotals(bookingId);

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return null;

  const netDue = netInvoiceDue(
    Number(booking.estimatedTotal),
    Number(booking.discountTotal),
  );
  const amountPaid = Number(booking.amountPaid);
  const excess = Math.round((amountPaid - netDue) * 100) / 100;
  if (excess <= 0) return booking;

  await db.bookingPayment.create({
    data: {
      bookingId,
      kind: "REFUND",
      amount: excess,
      method: booking.paymentMethod,
      note: note ?? "Refund after cancellation",
      paidAt: new Date(),
      recordedById,
    },
  });

  return syncBookingPaymentTotals(bookingId);
}

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
  const refundRows = booking.payments.filter((row) => row.kind === "REFUND");
  const discountRows = booking.payments.filter((row) => row.kind === "DISCOUNT");

  const paymentsTotal =
    Math.round(paymentRows.reduce((sum, row) => sum + Number(row.amount), 0) * 100) / 100;
  const refundsTotal =
    Math.round(refundRows.reduce((sum, row) => sum + Number(row.amount), 0) * 100) / 100;
  const amountPaid = Math.max(0, Math.round((paymentsTotal - refundsTotal) * 100) / 100);
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
