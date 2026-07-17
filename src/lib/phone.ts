/** Strip to digits only. */
export function digitsOnly(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/** Compare bookings by last N digits so formatting differences still match. */
export function lastDigits(phone: string, count = 10): string {
  return digitsOnly(phone).slice(-count);
}

/** Hint shown under phone fields for Bangladesh numbers. */
export const BD_PHONE_HINT = "01XXXXXXXXX";

export const BD_PHONE_INVALID_MESSAGE =
  "Enter a valid Bangladesh mobile number (01XXXXXXXXX).";

/**
 * Normalize to national 01XXXXXXXXX digits when possible.
 * Accepts 01…, 1… (10 digits), +8801…, 8801….
 */
export function normalizeBdPhoneDigits(phone: string): string {
  let digits = digitsOnly(phone);
  if (digits.startsWith("880")) {
    digits = digits.slice(3);
  }
  if (digits.length === 10 && digits.startsWith("1")) {
    digits = `0${digits}`;
  }
  return digits;
}

/** BD mobile: 01[3-9] followed by 8 digits (Grameen, Robi, Airtel, etc.). */
export function isPlausibleBdPhone(phone: string): boolean {
  return /^01[3-9]\d{8}$/.test(normalizeBdPhoneDigits(phone));
}

/** Canonical storage form, or null if invalid. */
export function formatBdPhoneForStorage(phone: string): string | null {
  const normalized = normalizeBdPhoneDigits(phone);
  return /^01[3-9]\d{8}$/.test(normalized) ? normalized : null;
}

/**
 * Live input sanitizer: digits only, optional leading +, max length for +8801… .
 * Letters and other symbols are dropped immediately.
 */
export function sanitizeBdPhoneInput(raw: string): string {
  const trimmed = raw.trimStart();
  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "").slice(0, 14)}`;
  }
  return trimmed.replace(/\D/g, "").slice(0, 14);
}

/** Optional age: empty, or integer 0–130. */
export function sanitizeAgeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 3);
  if (digits === "") return "";
  const value = Number(digits);
  if (!Number.isFinite(value)) return "";
  if (value > 130) return "130";
  return String(value);
}

export function isValidOptionalAge(raw: string): boolean {
  if (raw.trim() === "") return true;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 && value <= 130;
}
