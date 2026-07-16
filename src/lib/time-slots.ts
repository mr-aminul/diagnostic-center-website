import type { Locale } from "@/config/site";

export const TIME_SLOT_VALUES = [
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 2:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
  "6:00 PM - 8:00 PM",
] as const;

export type TimeSlotValue = (typeof TIME_SLOT_VALUES)[number];

const BN_LABELS: Record<TimeSlotValue, string> = {
  "8:00 AM - 10:00 AM": "সকাল ৮টা - ১০টা",
  "10:00 AM - 12:00 PM": "সকাল ১০টা - দুপুর ১২টা",
  "12:00 PM - 2:00 PM": "দুপুর ১২টা - ২টা",
  "2:00 PM - 4:00 PM": "বিকাল ২টা - ৪টা",
  "4:00 PM - 6:00 PM": "বিকাল ৪টা - ৬টা",
  "6:00 PM - 8:00 PM": "সন্ধ্যা ৬টা - ৮টা",
};

export function labelTimeSlot(value: string, locale: Locale): string {
  if (locale === "bn" && value in BN_LABELS) {
    return BN_LABELS[value as TimeSlotValue];
  }
  return value;
}

/** Today's date in local YYYY-MM-DD for `<input type="date" min=...>`. */
export function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isPastDateString(value: string): boolean {
  if (!value) return false;
  return value < todayDateInputValue();
}
