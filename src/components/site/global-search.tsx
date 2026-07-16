"use client";

import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import {
  Building2,
  CalendarCheck2,
  ClipboardList,
  FileSearch,
  FlaskConical,
  HelpCircle,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  Stethoscope,
  X,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { startNavigationProgress } from "@/components/navigation-progress";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/config/site";
import { formatCurrency } from "@/lib/format";
import {
  localizedSubtitle,
  localizedTitle,
  scoreSearchHit,
} from "@/lib/search/match";
import type { SearchCategory, SearchHit, SearchHref } from "@/lib/search/types";
import { cn } from "@/lib/utils";

const MAX_RESULTS = 10;
const SUGGESTION_IDS = [
  "page-book",
  "page-track",
  "page-doctors",
  "page-price-list",
  "page-packages",
  "page-contact",
] as const;

const CATEGORY_ICONS: Record<
  SearchCategory,
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  test: FlaskConical,
  package: Package,
  doctor: Stethoscope,
  category: ClipboardList,
  page: FileSearch,
  contact: Phone,
  branch: Building2,
};

function pageIcon(hit: SearchHit) {
  if (hit.id === "page-book") return CalendarCheck2;
  if (hit.id === "page-track") return FileSearch;
  if (hit.id === "page-faq") return HelpCircle;
  if (hit.id === "page-contact") return MapPin;
  if (hit.id.includes("whatsapp") || hit.id.includes("email")) {
    return hit.id.includes("email") ? Mail : Phone;
  }
  return CATEGORY_ICONS[hit.category];
}

function navigateTo(router: ReturnType<typeof useRouter>, href: SearchHref) {
  if (href.kind === "external") {
    window.location.assign(href.url);
    return;
  }

  startNavigationProgress();

  if (href.query) {
    router.push({ pathname: href.pathname, query: href.query } as Parameters<
      typeof router.push
    >[0]);
    return;
  }

  router.push(href.pathname as Parameters<typeof router.push>[0]);
}

export function GlobalSearch({
  items,
  locale,
  className,
}: {
  items: SearchHit[];
  locale: Locale;
  className?: string;
}) {
  const t = useTranslations("home.search");
  const router = useRouter();
  const listboxId = useId();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [rawActiveIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);

  function focusInput() {
    document.getElementById(inputId)?.focus();
  }

  function blurInput() {
    document.getElementById(inputId)?.blur();
  }

  const suggestions = useMemo(
    () =>
      SUGGESTION_IDS.map((id) => items.find((item) => item.id === id)).filter(
        (item): item is SearchHit => Boolean(item),
      ),
    [items],
  );

  const results = useMemo(() => {
    const trimmed = deferredQuery.trim();
    if (!trimmed) return suggestions;

    return items
      .map((item) => ({ item, score: scoreSearchHit(item, trimmed, locale) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .slice(0, MAX_RESULTS)
      .map(({ item }) => item);
  }, [deferredQuery, items, locale, suggestions]);

  const showPanel = open && (query.trim().length > 0 || suggestions.length > 0);
  const activeIndex =
    results.length === 0 ? 0 : Math.min(rawActiveIndex, results.length - 1);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function selectHit(hit: SearchHit) {
    setOpen(false);
    setQuery("");
    navigateTo(router, hit.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showPanel) {
      if (event.key === "ArrowDown" && results.length > 0) {
        setOpen(true);
        event.preventDefault();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % Math.max(results.length, 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        index <= 0 ? Math.max(results.length - 1, 0) : index - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      const hit = results[activeIndex];
      if (hit) {
        event.preventDefault();
        selectHit(hit);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (query) {
        setQuery("");
      } else {
        setOpen(false);
        blurInput();
      }
    }
  }

  const activeOptionId =
    showPanel && results[activeIndex]
      ? `${listboxId}-option-${results[activeIndex].id}`
      : undefined;

  return (
    <div ref={rootRef} className={cn("relative w-full max-w-xl", className)}>
      <label htmlFor={inputId} className="sr-only">
        {t("label")}
      </label>
      <div
        className={cn(
          "group relative flex items-center rounded-xl border border-white/25 bg-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md transition-[border-color,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          open && "border-white/45 bg-white/18 shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
        )}
      >
        <Search
          className="pointer-events-none absolute left-3.5 h-5 w-5 text-white/70 transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] group-focus-within:scale-105 group-focus-within:text-white"
          aria-hidden
        />
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("placeholder")}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="h-14 border-0 bg-transparent pr-11 pl-11 text-base text-white shadow-none placeholder:text-white/55 focus-visible:border-0 focus-visible:ring-0 md:text-base"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              focusInput();
            }}
            className="absolute right-3 rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
            aria-label={t("clear")}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={t("label")}
          className="absolute z-20 mt-2 max-h-[min(24rem,55vh)] w-full overflow-auto rounded-xl border border-white/20 bg-background/95 p-1.5 text-foreground shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-200"
        >
          {!query.trim() ? (
            <p className="px-3 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("suggestions")}
            </p>
          ) : null}

          {results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">{t("noResults")}</p>
          ) : (
            results.map((hit, index) => {
              const Icon = pageIcon(hit);
              const title = localizedTitle(hit, locale);
              const subtitle = localizedSubtitle(hit, locale);
              const isActive = index === activeIndex;

              return (
                <button
                  key={hit.id}
                  id={`${listboxId}-option-${hit.id}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectHit(hit)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150",
                    isActive ? "bg-primary/10 text-foreground" : "hover:bg-muted/80",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isActive ? "bg-primary/15 text-primary" : "bg-secondary text-primary",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{title}</span>
                      {hit.price != null ? (
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {formatCurrency(hit.price, locale)}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                          {t(`categories.${hit.category}`)}
                        </span>
                      )}
                    </span>
                    {subtitle ? (
                      <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {subtitle}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
