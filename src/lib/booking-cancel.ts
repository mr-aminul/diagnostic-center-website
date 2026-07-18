/** Booking statuses where report preparation is considered underway. */
export const REPORT_PREP_STATUSES = ["PROCESSING", "REPORT_READY"] as const;

export type ReportPrepStatus = (typeof REPORT_PREP_STATUSES)[number];

export function isReportPrepStatus(status: string): status is ReportPrepStatus {
  return (REPORT_PREP_STATUSES as readonly string[]).includes(status);
}

export function canCancelBookingItem(item: {
  cancelledAt: Date | null;
  report: { id: string } | null;
}): { ok: true } | { ok: false; reason: string } {
  if (item.cancelledAt) {
    return { ok: false, reason: "This item is already cancelled." };
  }
  if (item.report) {
    return {
      ok: false,
      reason: "Cannot cancel after a report has been uploaded for this item.",
    };
  }
  return { ok: true };
}

export function canCancelBooking(booking: {
  status: string;
  items: Array<{ cancelledAt: Date | null; report: { id: string } | null }>;
}): { ok: true } | { ok: false; reason: string } {
  if (booking.status === "CANCELLED") {
    return { ok: false, reason: "This booking is already cancelled." };
  }
  if (isReportPrepStatus(booking.status)) {
    return {
      ok: false,
      reason: "Cannot cancel after report preparation has started.",
    };
  }
  const activeWithReport = booking.items.some(
    (item) => item.cancelledAt == null && item.report != null,
  );
  if (activeWithReport) {
    return {
      ok: false,
      reason: "Cannot cancel while any test still has an uploaded report.",
    };
  }
  return { ok: true };
}
