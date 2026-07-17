"use client";

import {
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type AdminFilterOption = {
  value: string;
  label: string;
};

export type AdminFilterField = {
  name: string;
  label: string;
  defaultValue?: string;
  options: AdminFilterOption[];
  className?: string;
};

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Shared search + filter row for admin list pages.
 * Select changes apply immediately; search applies after a short debounce.
 */
export function AdminFilterBar({
  searchPlaceholder,
  searchDefaultValue,
  searchLabel = "Search",
  filters,
  children,
}: {
  searchPlaceholder: string;
  searchDefaultValue?: string;
  searchLabel?: string;
  filters: AdminFilterField[];
  children?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(searchDefaultValue ?? "");

  useEffect(() => {
    setQuery(searchDefaultValue ?? "");
  }, [searchDefaultValue]);

  function navigate(overrides: Partial<Record<string, string>>) {
    const params = new URLSearchParams();
    const nextQuery = (overrides.q ?? query).trim();
    if (nextQuery) params.set("q", nextQuery);

    for (const filter of filters) {
      const value = overrides[filter.name] ?? filter.defaultValue ?? "all";
      if (value && value !== "all") params.set(filter.name, value);
    }

    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  useEffect(() => {
    const trimmed = query.trim();
    const current = (searchDefaultValue ?? "").trim();
    if (trimmed === current) return;

    const timer = window.setTimeout(() => {
      navigate({ q: trimmed });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
    // Intentionally depend on query only — navigate closes over latest filters/query.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce search keystrokes
  }, [query]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    filters.some((filter) => {
      const value = filter.defaultValue ?? "all";
      return Boolean(value && value !== "all");
    });

  function clearAll() {
    setQuery("");
    startTransition(() => {
      router.replace(pathname);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        <span className="px-0.5">{searchLabel}</span>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              navigate({ q: query.trim() });
            }
          }}
          placeholder={searchPlaceholder}
          className="w-full max-w-sm min-w-[16rem]"
        />
      </label>
      {filters.map((filter) => {
        const items = Object.fromEntries(
          filter.options.map((option) => [option.value, option.label]),
        );
        const value = filter.defaultValue ?? filter.options[0]?.value ?? "all";

        return (
          <label
            key={filter.name}
            className="flex flex-col gap-1 text-xs text-muted-foreground"
          >
            <span className="px-0.5">{filter.label}</span>
            <Select
              value={value}
              onValueChange={(next) => {
                if (next) navigate({ [filter.name]: next });
              }}
              items={items}
            >
              <SelectTrigger className={cn("w-44", filter.className)}>
                <SelectValue placeholder={filter.options[0]?.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        );
      })}
      {children}
      {hasActiveFilters ? (
        <Button
          type="button"
          variant="outline"
          className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
          onClick={clearAll}
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}
