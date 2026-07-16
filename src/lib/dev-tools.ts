/**
 * Development-only helpers for walking the product without real SMS/OTP.
 *
 * PRODUCTION RULES (enforced in code):
 * - Autofill buttons never render in `NODE_ENV=production` builds.
 * - OTP bypass never runs in `NODE_ENV=production` — even if env vars are set.
 *
 * Local / staging:
 * - Defaults ON when `NODE_ENV !== "production"`.
 * - Set `DEV_TOOLS=false` to hide autofill buttons.
 * - Set `DEV_OTP_BYPASS=false` to require real SMS OTPs locally.
 *
 * When deploying: leave these unset (or false). Do not set them to true in prod.
 */

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Subtle "fill" buttons on forms. Client + server safe. */
export function isDevToolsEnabled(): boolean {
  if (isProductionRuntime()) return false;
  return process.env.NEXT_PUBLIC_DEV_TOOLS !== "false" && process.env.DEV_TOOLS !== "false";
}

/**
 * Accept any OTP code for the patient portal.
 * PLACEHOLDER: remove reliance on this before go-live — real OTP verification
 * is already implemented in `src/lib/phone-otp.ts` when this returns false.
 */
export function isDevOtpBypassEnabled(): boolean {
  if (isProductionRuntime()) return false;
  return process.env.DEV_OTP_BYPASS !== "false";
}

/** Shared sample values for autofill. Keep in sync across book → track flows. */
export const DEV_SAMPLE = {
  patientName: "Test Patient",
  phone: "01712345678",
  age: "30",
  address: "House 12, Road 5, Dhanmondi, Dhaka",
  notes: "Dev autofill — sample booking",
  contactName: "Test Patient",
  contactMessage: "Dev autofill — checking the contact form works.",
  otp: "000000",
  adminPhone: "+8801700000000",
  adminPassword: "change-this-password",
  walletPin: "1234",
  cardNumber: "4111111111111111",
  cardExpiry: "12/30",
  cardCvc: "123",
} as const;
