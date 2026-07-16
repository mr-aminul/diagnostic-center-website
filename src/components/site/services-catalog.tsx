"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/config/site";
import { formatCurrency } from "@/lib/format";

export interface CatalogTest {
  id: string;
  name: string;
  nameBn: string | null;
  price: number;
  sampleType: string | null;
  preparation: string | null;
  preparationBn: string | null;
  turnaroundTime: string | null;
  category: { id: string; name: string; nameBn: string | null };
}

export function ServicesCatalog({
  tests,
  categories,
  locale,
}: {
  tests: CatalogTest[];
  categories: { id: string; name: string; nameBn: string | null }[];
  locale: Locale;
}) {
  const t = useTranslations("services");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");

  const filtered = useMemo(() => {
    return tests.filter((test) => {
      const matchesCategory = categoryId === "all" || test.category.id === categoryId;
      const nameToSearch = `${test.name} ${test.nameBn ?? ""}`.toLowerCase();
      const matchesSearch = nameToSearch.includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [tests, search, categoryId]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="bg-background pl-9"
          />
        </div>
        <Select
          value={categoryId}
          onValueChange={(value) => value && setCategoryId(value)}
          items={{
            all: t("categoryAll"),
            ...Object.fromEntries(
              categories.map((category) => [
                category.id,
                locale === "bn" && category.nameBn ? category.nameBn : category.name,
              ]),
            ),
          }}
        >
          <SelectTrigger
            aria-label={t("categoryAll")}
            className="w-full bg-background sm:w-56"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="all">{t("categoryAll")}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {locale === "bn" && category.nameBn ? category.nameBn : category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">{t("noResults")}</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((test) => (
            <Card
              key={test.id}
              className="transition-shadow duration-300 hover:shadow-md"
            >
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">
                    {locale === "bn" && test.nameBn ? test.nameBn : test.name}
                  </h3>
                  <Badge variant="secondary" className="shrink-0">
                    {locale === "bn" && test.category.nameBn
                      ? test.category.nameBn
                      : test.category.name}
                  </Badge>
                </div>
                <p className="mt-3 text-xl font-bold text-primary">
                  {formatCurrency(test.price, locale)}
                </p>
                <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {test.sampleType && (
                    <div className="flex justify-between gap-2">
                      <dt>{t("sampleType")}</dt>
                      <dd>{test.sampleType}</dd>
                    </div>
                  )}
                  {test.turnaroundTime && (
                    <div className="flex justify-between gap-2">
                      <dt>{t("turnaround")}</dt>
                      <dd>{test.turnaroundTime}</dd>
                    </div>
                  )}
                </dl>
                {(test.preparation || test.preparationBn) && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <span className="font-medium">{t("preparation")}: </span>
                    {locale === "bn" && test.preparationBn
                      ? test.preparationBn
                      : test.preparation}
                  </p>
                )}
                <Link
                  href={{ pathname: "/book", query: { test: test.id } }}
                  className={buttonVariants({ className: "mt-auto pt-4" })}
                >
                  {t("addToBooking")}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
