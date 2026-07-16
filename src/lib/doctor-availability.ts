/** JS weekday indices: 0 = Sunday … 6 = Saturday. */

const DAY_NAME_TO_INDEX: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
  রবি: 0,
  রবিবার: 0,
  সোম: 1,
  সোমবার: 1,
  মঙ্গল: 2,
  মঙ্গলবার: 2,
  বুধ: 3,
  বুধবার: 3,
  বৃহস্পতি: 4,
  বৃহস্পতিবার: 4,
  শুক্র: 5,
  শুক্রবার: 5,
  শনি: 6,
  শনিবার: 6,
};

const DAY_TOKEN =
  /sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|রবিবার|রবি|সোমবার|সোম|মঙ্গলবার|মঙ্গল|বুধবার|বুধ|বৃহস্পতিবার|বৃহস্পতি|শুক্রবার|শুক্র|শনিবার|শনি/gi;

/**
 * Parse free-text doctor schedules into weekday indices.
 * Supports lists ("Sun, Tue, Thu") and ranges ("Sat–Thu", "শনি–বৃহস্পতি").
 * Returns null when the schedule has no parseable days (caller may allow any day).
 */
export function parseAvailableWeekdays(
  schedule: string | null | undefined,
): number[] | null {
  if (!schedule?.trim()) return null;

  const dayPart = schedule
    .replace(/\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?/g, " ")
    .replace(
      /(?:সকাল|দুপুর|বিকাল|সন্ধ্যা|রাত)\s*\d{1,2}\s*টা(?:\s*[-–]\s*(?:সকাল|দুপুর|বিকাল|সন্ধ্যা|রাত)?\s*\d{1,2}\s*টা)?/g,
      " ",
    )
    .trim();

  const rangeMatch = dayPart.match(
    new RegExp(`(${DAY_TOKEN.source})\\s*[–-]\\s*(${DAY_TOKEN.source})`, "i"),
  );

  if (rangeMatch) {
    const start = dayTokenToIndex(rangeMatch[1]);
    const end = dayTokenToIndex(rangeMatch[2]);
    if (start !== null && end !== null) {
      return expandWeekdayRange(start, end);
    }
  }

  const found = new Set<number>();
  for (const match of dayPart.matchAll(DAY_TOKEN)) {
    const index = dayTokenToIndex(match[0]);
    if (index !== null) found.add(index);
  }

  if (found.size === 0) return null;
  return [...found].sort((a, b) => a - b);
}

export function isDoctorAvailableOnWeekday(
  schedule: string | null | undefined,
  weekday: number,
): boolean {
  const days = parseAvailableWeekdays(schedule);
  if (days === null) return true;
  return days.includes(weekday);
}

/** Asia/Dhaka calendar day as YYYY-MM-DD. */
export function dhakaDateInputValue(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** YYYY-MM-DD → UTC midnight Date for Prisma `@db.Date`. */
export function appointmentDateFromInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function weekdayFromDateInput(value: string): number {
  return appointmentDateFromInput(value).getUTCDay();
}

export function formatLocalDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isPastDhakaDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
  return value < dhakaDateInputValue();
}

export function isDateDisabledForDoctor(
  date: Date,
  schedule: string | null | undefined,
): boolean {
  const ymd = formatLocalDateInput(date);
  if (isPastDhakaDateString(ymd)) return true;
  return !isDoctorAvailableOnWeekday(schedule, date.getDay());
}

function dayTokenToIndex(token: string): number | null {
  const key = token.trim().toLowerCase();
  if (key in DAY_NAME_TO_INDEX) return DAY_NAME_TO_INDEX[key];
  // Bangla tokens are case-stable; match original form too
  const original = token.trim();
  if (original in DAY_NAME_TO_INDEX) return DAY_NAME_TO_INDEX[original];
  return null;
}

function expandWeekdayRange(start: number, end: number): number[] {
  const days: number[] = [];
  let current = start;
  for (let step = 0; step < 7; step += 1) {
    days.push(current);
    if (current === end) break;
    current = (current + 1) % 7;
  }
  return days;
}
