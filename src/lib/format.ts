import type { Locale } from "@/config/site";

export type Numeric = number | string | { toString(): string };

export function toNumber(value: Numeric): number {
  return typeof value === "number" ? value : Number(value.toString());
}

export function formatCurrency(value: Numeric, locale: Locale = "en"): string {
  const amount = toNumber(value);
  const formatted = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `\u09F3${formatted}`;
}

export function formatDate(value: Date | string, locale: Locale = "en"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    dateStyle: "medium",
  }).format(date);
}

export function formatDateTime(value: Date | string, locale: Locale = "en"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
