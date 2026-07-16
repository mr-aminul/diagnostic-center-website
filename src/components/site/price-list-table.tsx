"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/format";
import type { Locale } from "@/config/site";
import { cn } from "@/lib/utils";

interface PriceRow {
  id: string;
  name: string;
  nameBn: string | null;
  price: number;
  category: { name: string; nameBn: string | null };
}

type CategoryOption = {
  value: string;
  label: string;
};

export function PriceListTable({
  tests,
  locale,
}: {
  tests: PriceRow[];
  locale: Locale;
}) {
  const t = useTranslations("priceList");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const map = new Map<string, CategoryOption>();
    for (const test of tests) {
      if (map.has(test.category.name)) continue;
      map.set(test.category.name, {
        value: test.category.name,
        label:
          locale === "bn" && test.category.nameBn
            ? test.category.nameBn
            : test.category.name,
      });
    }
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, locale === "bn" ? "bn" : "en"),
    );
  }, [tests, locale]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tests.filter((test) => {
      const matchesCategory =
        category === "all" || test.category.name === category;
      if (!matchesCategory) return false;
      if (!query) return true;

      const haystack =
        `${test.name} ${test.nameBn ?? ""} ${test.category.name} ${test.category.nameBn ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [tests, search, category]);

  const hasActiveFilters = search.trim().length > 0 || category !== "all";

  function clearFilters() {
    setSearch("");
    setCategory("all");
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="bg-background pl-9"
          />
        </div>

        <Select
          value={category}
          onValueChange={(value) => value && setCategory(value)}
          items={{
            all: t("categoryAll"),
            ...Object.fromEntries(
              categories.map((option) => [option.value, option.label]),
            ),
          }}
        >
          <SelectTrigger
            aria-label={t("categoryAll")}
            className="w-full bg-background sm:w-auto sm:min-w-48"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="all">{t("categoryAll")}</SelectItem>
            {categories.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("resultsCount", { count: filtered.length })}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 text-muted-foreground",
            )}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            {t("clearFilters")}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">{t("noResults")}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.test")}</TableHead>
                <TableHead>{t("table.category")}</TableHead>
                <TableHead className="text-right">{t("table.price")}</TableHead>
                <TableHead className="text-right">{t("table.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-medium">
                    {locale === "bn" && test.nameBn ? test.nameBn : test.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {locale === "bn" && test.category.nameBn
                      ? test.category.nameBn
                      : test.category.name}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(test.price, locale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={{ pathname: "/book", query: { test: test.id } }}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      {t("book")}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
