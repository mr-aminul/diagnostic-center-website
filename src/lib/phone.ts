/** Normalize to digits only, keep the trailing national number for matching. */
export function digitsOnly(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/** Compare bookings by last N digits so formatting differences still match. */
export function lastDigits(phone: string, count = 10): string {
  return digitsOnly(phone).slice(-count);
}

/** Hint shown under phone fields for Bangladesh numbers. */
export const BD_PHONE_HINT = "01XXXXXXXXX";

/** Loose client-side check: at least 10 digits after stripping non-digits. */
export function isPlausibleBdPhone(phone: string): boolean {
  return lastDigits(phone).length >= 10;
}
