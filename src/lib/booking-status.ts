/**
 * Highest turnaround among selected tests, used as a soft ETA on Track.
 * Falls back to 24 hours for packages or missing metadata.
 */
export function estimateReadyLabel(
  turnaroundTimes: (string | null | undefined)[],
  locale: "en" | "bn"
): string {
  const cleaned = turnaroundTimes.map((t) => t?.trim()).filter(Boolean) as string[];
  if (cleaned.length === 0) {
    return locale === "bn" ? "সাধারণত ২৪ ঘণ্টার মধ্যে" : "Usually within 24 hours";
  }

  // Prefer the longest literal string — catalogs use human phrases like "24 hours".
  const longest = cleaned.reduce((a, b) => (b.length > a.length ? b : a));
  return longest;
}

export const STATUS_ORDER = [
  "PENDING",
  "CONFIRMED",
  "SAMPLE_COLLECTED",
  "PROCESSING",
  "REPORT_READY",
] as const;

export type TimelineStatus = (typeof STATUS_ORDER)[number];

export function statusStepIndex(status: string): number {
  if (status === "CANCELLED") return -1;
  const index = STATUS_ORDER.indexOf(status as TimelineStatus);
  return index >= 0 ? index : 0;
}
