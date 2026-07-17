"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/**
 * Next.js only auto-prefetches Link targets in production. In local `next
 * dev`, every click otherwise pays a full RSC round-trip (and often a
 * compile). Warm the main public routes once the shell is up so soft nav
 * can reuse the client cache with experimental.staleTimes.
 */
const PUBLIC_ROUTES = [
  "/",
  "/doctors",
  "/services",
  "/packages",
  "/price-list",
  "/contact",
  "/about",
  "/faq",
  "/book",
  "/patient-portal",
  "/branches",
  "/home-collection",
] as const;

export function PrefetchWarmup({
  doctorsPage,
  homeCollection,
}: {
  doctorsPage: boolean;
  homeCollection: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    const routes = PUBLIC_ROUTES.filter((href) => {
      if (href === "/doctors" && !doctorsPage) return false;
      if (href === "/home-collection" && !homeCollection) {
        return false;
      }
      return true;
    });

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      for (const href of routes) {
        try {
          void router.prefetch(href);
        } catch {
          // Prefetch is best-effort; never block the UI.
        }
      }
    };

    const idleId =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(run, { timeout: 2000 })
        : window.setTimeout(run, 200);

    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function" && typeof idleId === "number") {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, [router, doctorsPage, homeCollection]);

  return null;
}
