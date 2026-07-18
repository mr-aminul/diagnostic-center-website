export const PAYMENT_METHODS = [
  "CASH",
  "ONLINE",
  "BKASH",
  "NAGAD",
  "CARD",
  "BANK",
  "OTHER",
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodId, string> = {
  CASH: "Cash",
  ONLINE: "Online",
  BKASH: "bKash",
  NAGAD: "Nagad",
  CARD: "Card",
  BANK: "Bank transfer",
  OTHER: "Other",
};

export const LEDGER_KINDS = ["PAYMENT", "DISCOUNT", "REFUND"] as const;
export type LedgerKindId = (typeof LEDGER_KINDS)[number];

export const LEDGER_KIND_LABELS: Record<LedgerKindId, string> = {
  PAYMENT: "Payment",
  DISCOUNT: "Discount",
  REFUND: "Refund",
};

export const PAYMENT_STATUSES = [
  "UNPAID",
  "PENDING_ONLINE",
  "PARTIAL",
  "PAID",
  "WAIVED",
] as const;

export type PaymentStatusId = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatusId, string> = {
  UNPAID: "Unpaid",
  PENDING_ONLINE: "Awaiting online",
  PARTIAL: "Partial",
  PAID: "Paid",
  WAIVED: "Waived",
};

export function netInvoiceDue(estimatedTotal: number, discountTotal: number): number {
  return Math.max(0, Math.round((estimatedTotal - discountTotal) * 100) / 100);
}

export function paymentBalance(
  estimatedTotal: number,
  amountPaid: number,
  discountTotal = 0,
): number {
  return Math.max(
    0,
    Math.round((netInvoiceDue(estimatedTotal, discountTotal) - amountPaid) * 100) / 100,
  );
}

/** Derive status from payments against the discounted net due. */
export function derivePaymentStatus(input: {
  amountPaid: number;
  estimatedTotal: number;
  discountTotal?: number;
  currentStatus?: PaymentStatusId;
  preferPendingOnline?: boolean;
}): PaymentStatusId {
  const netDue = netInvoiceDue(input.estimatedTotal, input.discountTotal ?? 0);

  if (netDue <= 0) return "PAID";

  if (input.amountPaid <= 0) {
    if (input.preferPendingOnline || input.currentStatus === "PENDING_ONLINE") {
      return "PENDING_ONLINE";
    }
    return "UNPAID";
  }

  if (input.amountPaid + 0.001 < netDue) return "PARTIAL";
  return "PAID";
}
