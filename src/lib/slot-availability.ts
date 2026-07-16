import { db } from "@/lib/db";
import { TIME_SLOT_VALUES, type TimeSlotValue } from "@/lib/time-slots";

/** Soft capacity per preferred slot — prevents over-promising without a full schedule system. */
const SLOT_CAPACITY = 12;

export async function getSlotAvailability(date: string): Promise<Record<string, { remaining: number; isFull: boolean }>> {
  if (!date) {
    return Object.fromEntries(
      TIME_SLOT_VALUES.map((slot) => [slot, { remaining: SLOT_CAPACITY, isFull: false }])
    );
  }

  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59`);

  const bookings = await db.booking.findMany({
    where: {
      preferredDate: { gte: start, lte: end },
      status: { not: "CANCELLED" },
      preferredTime: { not: null },
    },
    select: { preferredTime: true },
  });

  const counts = new Map<string, number>();
  for (const booking of bookings) {
    if (!booking.preferredTime) continue;
    counts.set(booking.preferredTime, (counts.get(booking.preferredTime) ?? 0) + 1);
  }

  return Object.fromEntries(
    TIME_SLOT_VALUES.map((slot) => {
      const used = counts.get(slot) ?? 0;
      const remaining = Math.max(0, SLOT_CAPACITY - used);
      return [slot, { remaining, isFull: remaining === 0 }];
    })
  );
}

export async function isSlotAvailable(date: string | undefined, time: string | undefined): Promise<boolean> {
  if (!date || !time) return true;
  if (!TIME_SLOT_VALUES.includes(time as TimeSlotValue)) return false;
  const availability = await getSlotAvailability(date);
  return !availability[time]?.isFull;
}
