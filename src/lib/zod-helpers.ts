import { z } from "zod";

/** An optional text field where an empty string is stored as `undefined` instead of "". */
export function optionalText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => (value ? value : undefined));
}

/** An optional URL field; empty string becomes `null` for clearing stored values. */
export function optionalUrl() {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    z.union([z.url("Enter a valid image URL."), z.null()]),
  );
}

/** An optional non-negative number; empty string becomes `null`. */
export function optionalNonNegativeNumber() {
  return z.preprocess((value) => {
    if (value == null || value === "") return null;
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, z.union([z.number().min(0, "Value cannot be negative."), z.null()]));
}
