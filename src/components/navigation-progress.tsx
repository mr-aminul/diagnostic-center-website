"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

type ProgressController = {
  start: () => void;
};

let progressController: ProgressController | null = null;

/** Start the top bar from programmatic navigations (router.push / replace). */
export function startNavigationProgress() {
  progressController?.start();
}

/**
 * Thin top-of-viewport progress bar for App Router soft navigations.
 * Starts on same-origin link clicks / back-forward; completes when the
 * pathname or search params settle.
 */
function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);

  const activeRef = useRef(false);
  const firstRouteRef = useRef(true);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (trickleRef.current) {
      clearInterval(trickleRef.current);
      trickleRef.current = null;
    }
    if (hideRef.current) {
      clearTimeout(hideRef.current);
      hideRef.current = null;
    }
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    if (!activeRef.current) return;
    if (trickleRef.current) {
      clearInterval(trickleRef.current);
      trickleRef.current = null;
    }
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
    setWidth(100);
    hideRef.current = setTimeout(() => {
      activeRef.current = false;
      setVisible(false);
      setWidth(0);
      hideRef.current = null;
    }, 260);
  }, []);

  const start = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    clearTimers();
    setVisible(true);
    setWidth(14);

    trickleRef.current = setInterval(() => {
      setWidth((current) => {
        if (current >= 90) return current;
        const step = current < 35 ? 10 : current < 65 ? 4 : 1.2;
        return Math.min(90, current + step);
      });
    }, 280);

    // Never leave the bar stuck if a navigation is cancelled or stalls.
    safetyRef.current = setTimeout(() => {
      finish();
    }, 10_000);
  }, [clearTimers, finish]);

  useEffect(() => {
    progressController = { start };
    return () => {
      if (progressController?.start === start) {
        progressController = null;
      }
    };
  }, [start]);

  useEffect(() => {
    if (firstRouteRef.current) {
      firstRouteRef.current = false;
      return;
    }
    finish();
  }, [routeKey, finish]);

  useEffect(() => {
    const isModifiedClick = (event: MouseEvent) =>
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) return;

      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      start();
    };

    const onPopState = () => start();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
  }, [start, clearTimers]);

  return (
    <div
      className="navigation-progress pointer-events-none fixed inset-x-0 top-0 z-[9999] h-1"
      role="progressbar"
      aria-hidden={!visible}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={visible ? Math.round(width) : 0}
      aria-label="Loading page"
    >
      <div
        className="navigation-progress__bar relative h-full bg-primary"
        style={{
          width: `${width}%`,
          opacity: visible ? 1 : 0,
          transition:
            width === 0
              ? "none"
              : width >= 100
                ? "width 180ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease 60ms"
                : "width 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 120ms ease",
        }}
      >
        <span className="navigation-progress__tip" aria-hidden />
      </div>
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
