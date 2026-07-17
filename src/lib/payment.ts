import { siteConfig } from "@/config/site";
import { getResolvedSiteConfig } from "@/lib/data/site-settings";

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

/** Sync fallback for code paths that cannot await CMS settings. Prefer async helpers. */
export function getPaymentProvider(): PaymentProviderId {
  return siteConfig.payment.provider;
}

export function isDemoPayment(): boolean {
  return siteConfig.features.onlinePayment && getPaymentProvider() === "demo";
}

export async function isDemoPaymentResolved(): Promise<boolean> {
  const site = await getResolvedSiteConfig();
  return site.features.onlinePayment && site.payment.provider === "demo";
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
  const site = await getResolvedSiteConfig();
  const provider = site.payment.provider;

  if (provider === "demo") {
    return {
      mode: "demo-ui",
      sessionId: `demo_${input.referenceCode}_${Date.now()}`,
    };
  }

  throw new Error(
    "Live payment provider is not configured. Set payment provider to \"demo\" in admin Site settings or implement createCheckoutSession for your gateway.",
  );
}

export function generateDemoTransactionId(method: string): string {
  const stamp = Date.now().toString(36).toUpperCase();
  return `DEMO-${method.toUpperCase()}-${stamp}`;
}
