/** Default clinic start (5:00 PM) when a doctor's schedule has no parseable time. */
const DEFAULT_START_MINUTES = 17 * 60;
const DEFAULT_MINUTES_PER_PATIENT = 15;

export function normalizeMinutesPerPatient(minutes: number | null | undefined): number {
  if (typeof minutes !== "number" || !Number.isFinite(minutes)) {
    return DEFAULT_MINUTES_PER_PATIENT;
  }
  return Math.min(120, Math.max(1, Math.round(minutes)));
}

/**
 * Pull the first clock time from free-text schedules like
 * "Sun, Tue, Thu, 6:00 PM – 9:00 PM".
 */
export function parseScheduleStartMinutes(schedule: string | null | undefined): number {
  if (!schedule) return DEFAULT_START_MINUTES;

  const match = schedule.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
  if (!match) return DEFAULT_START_MINUTES;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridian = match[3]?.toUpperCase();

  if (meridian === "PM" && hours < 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function formatClockMinutes(totalMinutes: number): string {
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours24 = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  const meridian = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${meridian}`;
}

/**
 * Serial 1 starts at the clinic window; later patients are spaced by the
 * doctor's estimated minutes per patient.
 */
export function estimateTimeForSerial(
  serialNumber: number,
  schedule: string | null | undefined,
  minutesPerPatient?: number | null,
): string {
  const start = parseScheduleStartMinutes(schedule);
  const slotMinutes = normalizeMinutesPerPatient(minutesPerPatient);
  const eta = start + Math.max(serialNumber - 1, 0) * slotMinutes;
  return formatClockMinutes(eta);
}

/** Calendar date in Asia/Dhaka as YYYY-MM-DD for @db.Date storage. */
export function todayAppointmentDate(): Date {
  const now = new Date();
  const dhaka = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${dhaka}T00:00:00.000Z`);
}
