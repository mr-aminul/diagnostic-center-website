import { db } from "@/lib/db";
import { syncBookingPaymentTotals } from "@/lib/booking-payments";
import {
  LINE_DISCOUNT_PREFIX,
  lineDiscountNote,
} from "@/lib/booking-line-discount-notes";

export { lineDiscountNote, parseLineDiscountItemId } from "@/lib/booking-line-discount-notes";

/** Replace per-line discount ledger rows from amounts, then sync totals. */
export async function replaceBookingLineDiscounts(
  bookingId: string,
  lines: Array<{ itemId: string; discount: number }>,
  recordedById?: string,
) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { items: true },
  });
  if (!booking) return null;

  const activeItems = booking.items.filter((item) => item.cancelledAt == null);
  const itemIds = new Set(activeItems.map((item) => item.id));
  const priceById = new Map(
    activeItems.map((item) => [item.id, Number(item.priceSnapshot)]),
  );

  // Only clear line-tagged discounts — preserve untagged/manual DISCOUNT rows.
  await db.bookingPayment.deleteMany({
    where: {
      bookingId,
      kind: "DISCOUNT",
      note: { startsWith: LINE_DISCOUNT_PREFIX },
    },
  });

  const now = new Date();
  for (const line of lines) {
    if (!itemIds.has(line.itemId)) continue;
    const maxPrice = priceById.get(line.itemId) ?? 0;
    const discount = Math.max(
      0,
      Math.min(maxPrice, Math.round(line.discount * 100) / 100),
    );
    if (discount <= 0) continue;
    await db.bookingPayment.create({
      data: {
        bookingId,
        kind: "DISCOUNT",
        amount: discount,
        method: null,
        note: lineDiscountNote(line.itemId),
        paidAt: now,
        recordedById: recordedById ?? null,
      },
    });
  }

  return syncBookingPaymentTotals(bookingId);
}
