/**
 * Helpers for walking the product without real SMS/OTP — used in local
 * development and on the public demo (while payment.provider is still "demo").
 *
 * RULES:
 * - When `siteConfig.payment.provider === "demo"`, forms are prefilled and OTP
 *   bypass stays on even in production so visitors can explore the site.
 * - Switch payment to `"live"` before go-live; that turns these off in prod.
 * - Locally: defaults ON when `NODE_ENV !== "production"`.
 * - Set `DEV_TOOLS=false` / `DEV_OTP_BYPASS=false` to force them off locally.
 */

import { siteConfig } from "@/config/site";

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Dummy/sandbox deploy — demo prefills + OTP shortcuts stay available. */
export function isDemoSandbox(): boolean {
  return siteConfig.payment.provider === "demo";
}

/** Whether demo form prefills (and related UI hints) are active. */
export function isDevToolsEnabled(): boolean {
  if (isDemoSandbox()) {
    return process.env.NEXT_PUBLIC_DEV_TOOLS !== "false" && process.env.DEV_TOOLS !== "false";
  }
  if (isProductionRuntime()) return false;
  return process.env.NEXT_PUBLIC_DEV_TOOLS !== "false" && process.env.DEV_TOOLS !== "false";
}

/**
 * Accept any OTP code for the patient portal.
 * Real verification already exists in `src/lib/phone-otp.ts` when this is false.
 * Off automatically in production once payment.provider is no longer "demo".
 */
export function isDevOtpBypassEnabled(): boolean {
  if (isDemoSandbox()) {
    return process.env.DEV_OTP_BYPASS !== "false";
  }
  if (isProductionRuntime()) return false;
  return process.env.DEV_OTP_BYPASS !== "false";
}

/** Prefill for uncontrolled inputs; `undefined` when demos are off. */
export function demoDefault<T extends string>(value: T): T | undefined {
  return isDevToolsEnabled() ? value : undefined;
}

/** Shared sample values for demo prefills. Keep in sync across book → track flows. */
export const DEV_SAMPLE = {
  patientName: "Test Patient",
  phone: "01712345678",
  age: "30",
  address: "House 12, Road 5, Dhanmondi, Dhaka",
  notes: "Demo sample booking",
  contactName: "Test Patient",
  contactMessage: "Demo sample — checking the contact form works.",
  otp: "000000",
  adminPhone: "+8801700000000",
  adminPassword: "change-this-password",
  walletPin: "1234",
  cardNumber: "4111111111111111",
  cardExpiry: "12/30",
  cardCvc: "123",
} as const;
