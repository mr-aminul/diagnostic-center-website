import { db } from "@/lib/db";
import { parseLineDiscountItemId } from "@/lib/booking-line-discount-notes";
import { replaceBookingLineDiscounts } from "@/lib/booking-line-discounts";

/** Active (non-cancelled) booking lines. */
export function isActiveBookingItem(item: { cancelledAt: Date | null }) {
  return item.cancelledAt == null;
}

/** Refresh invoice subtotal and keep per-line discounts in sync after item edits. */
export async function recomputeBookingInvoice(
  bookingId: string,
  recordedById?: string,
) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { items: true, payments: true },
  });
  if (!booking) return null;

  const activeItems = booking.items.filter(isActiveBookingItem);

  const estimatedTotal =
    Math.round(
      activeItems.reduce((sum, item) => sum + Number(item.priceSnapshot), 0) * 100,
    ) / 100;

  await db.booking.update({
    where: { id: bookingId },
    data: { estimatedTotal },
  });

  const itemIds = new Set(activeItems.map((item) => item.id));
  const priceById = new Map(
    activeItems.map((item) => [item.id, Number(item.priceSnapshot)]),
  );
  const discountByItem = new Map<string, number>();

  for (const payment of booking.payments) {
    if (payment.kind !== "DISCOUNT") continue;
    const itemId = parseLineDiscountItemId(payment.note);
    if (!itemId || !itemIds.has(itemId)) continue;
    discountByItem.set(
      itemId,
      (discountByItem.get(itemId) ?? 0) + Number(payment.amount),
    );
  }

  const lines = [...discountByItem.entries()].map(([itemId, discount]) => ({
    itemId,
    discount: Math.min(discount, priceById.get(itemId) ?? 0),
  }));

  return replaceBookingLineDiscounts(bookingId, lines, recordedById);
}
