"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GlobalSearch } from "@/components/site/global-search";
import type { Locale } from "@/config/site";
import type { SearchHit } from "@/lib/search/types";

/**
 * Renders the search shell immediately; loads the index after idle / on focus
 * so home navigations don't ship the full catalog in the RSC payload.
 */
export function GlobalSearchLazy({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const [items, setItems] = useState<SearchHit[]>([]);
  const loadingRef = useRef(false);
  const loadedRef = useRef(false);

  const ensureIndex = useCallback(async () => {
    if (loadedRef.current || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await fetch("/api/search-index");
      if (!response.ok) return;
      const data = (await response.json()) as { items: SearchHit[] };
      setItems(data.items);
      loadedRef.current = true;
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => {
        void ensureIndex();
      });
    } else {
      timeoutId = setTimeout(() => {
        void ensureIndex();
      }, 400);
    }

    return () => {
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [ensureIndex]);

  return (
    <div className={className} onFocusCapture={() => void ensureIndex()}>
      <GlobalSearch items={items} locale={locale} />
    </div>
  );
}
