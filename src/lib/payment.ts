import { siteConfig } from "@/config/site";

/**
 * Payment integration surface.
 *
 * - `provider: "demo"` → in-app dummy checkout (no real money). Swap this to a
 *   live provider later and implement `createCheckoutSession` for that case.
 * - Feature flag `features.onlinePayment` still gates whether patients see
 *   the online option at all.
 */
export type PaymentProviderId = "demo" | "live";

export interface PaymentCheckoutSession {
  /** Where to send the patient next. Demo returns an in-app step; live would return a gateway URL. */
  mode: "demo-ui" | "redirect";
  redirectUrl?: string;
  sessionId: string;
}

export function getPaymentProvider(): PaymentProviderId {
  return siteConfig.payment.provider;
}

export function isDemoPayment(): boolean {
  return siteConfig.features.onlinePayment && getPaymentProvider() === "demo";
}

/**
 * Placeholder for a real gateway (SSLCommerz, bKash Checkout, Nagad, etc.).
 * Demo mode never leaves the site — the UI handles the flow client-side, then
 * calls `confirmDemoPayment` to mark the booking paid.
 */
export async function createCheckoutSession(input: {
  referenceCode: string;
  amount: number;
  customerPhone: string;
}): Promise<PaymentCheckoutSession> {
  const provider = getPaymentProvider();

  if (provider === "demo") {
    return {
      mode: "demo-ui",
      sessionId: `demo_${input.referenceCode}_${Date.now()}`,
    };
  }

  // Live gateway hook — replace with real API call when credentials exist.
  throw new Error(
    "Live payment provider is not configured. Set siteConfig.payment.provider to \"demo\" or implement createCheckoutSession for your gateway."
  );
}

export function generateDemoTransactionId(method: string): string {
  const prefix = method.toUpperCase().slice(0, 3);
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}
