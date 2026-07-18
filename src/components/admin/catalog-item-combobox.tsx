"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, TestTube, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  InlineEditableValue,
  InlineUnderlineInput,
  inlineUnderlineSelectTriggerClass,
} from "@/components/admin/inline-editable-value";
import { InvoiceTotals, InvoiceTotalsRow } from "@/components/admin/invoice-totals";
import { BookingSection } from "@/components/admin/booking-workspace";
import { adminCompactTableClass } from "@/components/admin/compact-table";
import { toNumber, type Numeric } from "@/lib/format";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
} from "@/lib/payment-details";
import { cn } from "@/lib/utils";

const COLLECT_METHODS = PAYMENT_METHODS.filter((method) => method !== "ONLINE");

function paymentMethodTitle(method: string) {
  return (
    PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] ?? method
  );
}

const COLLECT_METHOD_TITLES = Object.fromEntries(
  COLLECT_METHODS.map((method) => [method, paymentMethodTitle(method)]),
);

export type CatalogPaymentDraft = {
  amount: string;
  method: string;
  reference: string;
};

function formatAmount(value: Numeric) {
  return new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(
    toNumber(value),
  );
}

export interface CatalogPickItem {
  type: "test" | "package";
  id: string;
  name: string;
  nameBn: string | null;
  price: number;
}

export interface SelectedCatalogItem extends CatalogPickItem {
  /** Resolved discount amount applied to this line. */
  discount: number;
  /** How the staff last set the discount. */
  discountMode: "amount" | "percent";
  /** Entered value: taka amount, or percent 0–100. */
  discountValue: number;
}

type DraftRow = {
  key: string;
  query: string;
};

function itemKey(item: Pick<CatalogPickItem, "type" | "id">) {
  return `${item.type}:${item.id}`;
}

function matchesQuery(item: CatalogPickItem, query: string) {
  const haystack = [item.name, item.nameBn, item.type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

function clampDiscount(value: number, maxPrice: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(maxPrice, Math.round(value * 100) / 100);
}

function clampPercent(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(100, Math.round(value * 100) / 100);
}

function formatPercent(value: number) {
  if (value <= 0) return "0";
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}

function discountFromAmount(amount: number, price: number) {
  const discount = clampDiscount(amount, price);
  return {
    discount,
    discountMode: "amount" as const,
    discountValue: discount,
  };
}

function discountFromPercent(percent: number, price: number) {
  const pct = clampPercent(percent);
  return {
    discountMode: "percent" as const,
    discountValue: pct,
    discount: clampDiscount((price * pct) / 100, price),
  };
}

function percentForItem(item: SelectedCatalogItem) {
  if (item.discountMode === "percent") return item.discountValue;
  if (item.price <= 0 || item.discount <= 0) return 0;
  return clampPercent((item.discount / item.price) * 100);
}

function newDraftKey() {
  return `draft-${Math.random().toString(36).slice(2, 10)}`;
}

export function ItemNameField({
  value,
  suggestions,
  placeholder,
  autoFocus,
  onValueChange,
  onPick,
  onBlurEmpty,
}: {
  value: string;
  suggestions: CatalogPickItem[];
  placeholder?: string;
  autoFocus?: boolean;
  onValueChange: (next: string) => void;
  onPick: (item: CatalogPickItem) => void;
  onBlurEmpty?: () => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(Boolean(autoFocus));
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    placement: "bottom" | "top";
  } | null>(null);

  function updatePosition() {
    const input = inputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const gap = 4;
    const preferredHeight = 192;
    const spaceBelow = window.innerHeight - rect.bottom - gap - 8;
    const spaceAbove = rect.top - gap - 8;
    const placement =
      spaceBelow < 120 && spaceAbove > spaceBelow ? "top" : "bottom";
    const maxHeight = Math.max(
      96,
      Math.min(preferredHeight, placement === "bottom" ? spaceBelow : spaceAbove),
    );
    const width = Math.min(320, Math.max(rect.width, 220), window.innerWidth - 16);
    let left = rect.left;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8);
    }
    setCoords({
      top: placement === "bottom" ? rect.bottom + gap : rect.top - gap - maxHeight,
      left,
      width,
      maxHeight,
      placement,
    });
  }

  useEffect(() => {
    if (!autoFocus) return;
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      setOpen(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
    function handleReposition() {
      updatePosition();
    }
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, suggestions.length, value]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const listbox =
    open && coords
      ? createPortal(
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: coords.width,
            maxHeight: coords.maxHeight,
          }}
          className="z-[100] overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          {suggestions.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              {value.trim()
                ? `No matches for “${value.trim()}”.`
                : "No more catalog items available."}
            </p>
          ) : (
            suggestions.map((item, index) => (
              <button
                key={itemKey(item)}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={false}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onPick(item);
                  setOpen(false);
                }}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {item.type === "package" ? "Package" : "Test"}
                    </Badge>
                    <span className="truncate font-medium">{item.name}</span>
                  </span>
                </span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {formatAmount(item.price)}
                </span>
              </button>
            ))
          )}
        </div>,
        document.body,
      )
      : null;

  return (
    <div ref={rootRef} className="relative min-w-[10rem]">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        placeholder={placeholder ?? "Type to search…"}
        className="w-full border-0 border-b border-transparent bg-transparent p-0 text-xs font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground hover:border-muted-foreground/40 focus:border-foreground"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onValueChange(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            event.currentTarget.blur();
          }
          if (event.key === "Enter" && suggestions.length === 1) {
            event.preventDefault();
            onPick(suggestions[0]);
            setOpen(false);
          }
          if (event.key === "ArrowDown" && suggestions.length > 0) {
            event.preventDefault();
            setOpen(true);
            const first = document.getElementById(`${listId}-0`);
            first?.focus();
          }
        }}
        onBlur={() => {
          window.setTimeout(() => {
            const active = document.activeElement;
            if (
              rootRef.current?.contains(active) ||
              listRef.current?.contains(active)
            ) {
              return;
            }
            setOpen(false);
            if (!value.trim()) onBlurEmpty?.();
          }, 0);
        }}
      />
      {listbox}
    </div>
  );
}

export function CatalogItemCombobox({
  items,
  selected,
  onSelectedChange,
  id,
  paymentDraft,
  onPaymentDraftChange,
  paymentDue = 0,
  sectionClassName,
}: {
  items: CatalogPickItem[];
  selected: SelectedCatalogItem[];
  onSelectedChange: (next: SelectedCatalogItem[]) => void;
  id?: string;
  paymentDraft?: CatalogPaymentDraft | null;
  onPaymentDraftChange?: (next: CatalogPaymentDraft | null) => void;
  paymentDue?: number;
  sectionClassName?: string;
}) {
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [focusDraftKey, setFocusDraftKey] = useState<string | null>(null);
  /** Committed rows being renamed/replaced via the name field. */
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingQuery, setEditingQuery] = useState("");

  const selectedKeys = useMemo(
    () => new Set(selected.map((item) => itemKey(item))),
    [selected],
  );

  const available = useMemo(
    () => items.filter((item) => !selectedKeys.has(itemKey(item))),
    [items, selectedKeys],
  );

  const subtotal = selected.reduce((sum, item) => sum + item.price, 0);
  const discountTotal = selected.reduce((sum, item) => sum + item.discount, 0);
  const netTotal = Math.max(0, Math.round((subtotal - discountTotal) * 100) / 100);

  function suggestionsFor(query: string, excludeKey?: string) {
    const pool = items.filter((item) => {
      const key = itemKey(item);
      if (excludeKey && key === excludeKey) return true;
      return !selectedKeys.has(key);
    });
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pool.slice(0, 40);
    return pool.filter((item) => matchesQuery(item, normalized)).slice(0, 40);
  }

  function addDraftRow() {
    if (available.length === 0) return;
    const key = newDraftKey();
    setDrafts((current) => [...current, { key, query: "" }]);
    setFocusDraftKey(key);
    setEditingKey(null);
  }

  useEffect(() => {
    if (!focusDraftKey) return;
    const timer = window.setTimeout(() => setFocusDraftKey(null), 50);
    return () => window.clearTimeout(timer);
  }, [focusDraftKey]);

  function updateDraftQuery(key: string, query: string) {
    setDrafts((current) =>
      current.map((row) => (row.key === key ? { ...row, query } : row)),
    );
  }

  function removeDraft(key: string) {
    setDrafts((current) => current.filter((row) => row.key !== key));
    if (focusDraftKey === key) setFocusDraftKey(null);
  }

  function commitDraft(key: string, item: CatalogPickItem) {
    if (selected.some((row) => row.id === item.id && row.type === item.type)) {
      removeDraft(key);
      return;
    }
    onSelectedChange([
      ...selected,
      { ...item, discount: 0, discountMode: "amount", discountValue: 0 },
    ]);
    removeDraft(key);
  }

  function replaceSelected(previous: SelectedCatalogItem, next: CatalogPickItem) {
    onSelectedChange(
      selected.map((row) =>
        row.id === previous.id && row.type === previous.type
          ? {
            ...next,
            discount: 0,
            discountMode: "amount",
            discountValue: 0,
          }
          : row,
      ),
    );
    setEditingKey(null);
    setEditingQuery("");
  }

  function removeItem(item: SelectedCatalogItem) {
    onSelectedChange(
      selected.filter((s) => !(s.id === item.id && s.type === item.type)),
    );
    if (editingKey === itemKey(item)) {
      setEditingKey(null);
      setEditingQuery("");
    }
  }

  function setItemDiscountAmount(item: SelectedCatalogItem, raw: string) {
    const numeric = Number(raw.trim());
    const parsed = discountFromAmount(
      raw.trim() === "" || !Number.isFinite(numeric) ? 0 : numeric,
      item.price,
    );
    onSelectedChange(
      selected.map((row) =>
        row.id === item.id && row.type === item.type ? { ...row, ...parsed } : row,
      ),
    );
  }

  function setItemDiscountPercent(item: SelectedCatalogItem, raw: string) {
    const numeric = Number(raw.trim());
    const parsed = discountFromPercent(
      raw.trim() === "" || !Number.isFinite(numeric) ? 0 : numeric,
      item.price,
    );
    onSelectedChange(
      selected.map((row) =>
        row.id === item.id && row.type === item.type ? { ...row, ...parsed } : row,
      ),
    );
  }

  const showEmpty = selected.length === 0 && drafts.length === 0;
  const received = paymentDraft ? Number(paymentDraft.amount) || 0 : 0;
  const displayDue = Math.max(0, Math.round((netTotal - received) * 100) / 100);
  const isDue = displayDue > 0;
  const statusLabel = isDue ? "Due" : "Paid";
  const statusBadgeClass = isDue
    ? "border-transparent bg-destructive/10 text-destructive"
    : "border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";

  function startReceivePayment() {
    if (!onPaymentDraftChange || paymentDue <= 0 || paymentDraft) return;
    onPaymentDraftChange({
      amount: paymentDue > 0 ? String(paymentDue) : "",
      method: "CASH",
      reference: "",
    });
  }

  return (
    <BookingSection
      title="Tests & packages"
      icon={TestTube}
      className={sectionClassName}
      headerRight={
        onPaymentDraftChange ? (
          <>
            <Badge
              variant="outline"
              className={cn("h-8 px-2.5 text-sm", statusBadgeClass)}
            >
              {statusLabel}
            </Badge>
            <Button
              type="button"
              size="sm"
              disabled={paymentDue <= 0 || Boolean(paymentDraft)}
              onClick={startReceivePayment}
            >
              <Plus />
              Receive payment
            </Button>
          </>
        ) : null
      }
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border">
          <Table className={cn(adminCompactTableClass)}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Item</TableHead>
                <TableHead className="w-20">Type</TableHead>
                <TableHead className="w-20 text-right">Price</TableHead>
                <TableHead className="w-20 text-right">Discount</TableHead>
                <TableHead className="w-14 text-right">%</TableHead>
                <TableHead className="w-20 text-right">Total</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {showEmpty ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-5 text-center text-muted-foreground">
                    No tests or packages yet. Add an item below to get started.
                  </TableCell>
                </TableRow>
              ) : null}

              {selected.map((item) => {
                const key = itemKey(item);
                const isEditing = editingKey === key;
                const percent = percentForItem(item);
                const lineTotal = Math.max(
                  0,
                  Math.round((item.price - item.discount) * 100) / 100,
                );
                return (
                  <TableRow key={key}>
                    <TableCell className="whitespace-normal">
                      {isEditing ? (
                        <ItemNameField
                          value={editingQuery}
                          suggestions={suggestionsFor(editingQuery, key)}
                          autoFocus
                          onValueChange={setEditingQuery}
                          onPick={(picked) => replaceSelected(item, picked)}
                          onBlurEmpty={() => {
                            setEditingKey(null);
                            setEditingQuery("");
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          className="w-full border-0 border-b border-transparent bg-transparent p-0 text-left text-xs font-medium outline-none hover:border-muted-foreground/40"
                          onClick={() => {
                            setEditingKey(key);
                            setEditingQuery(item.name);
                            setFocusDraftKey(null);
                          }}
                        >
                          {item.name}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.type === "package" ? "Package" : "Test"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(item.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <InlineEditableValue
                        display={item.discount > 0 ? formatAmount(item.discount) : "0"}
                        draftSeed={item.discount > 0 ? String(item.discount) : ""}
                        label={`Discount amount for ${item.name}`}
                        title="Edit discount amount"
                        onCommit={(raw) => setItemDiscountAmount(item, raw)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <InlineEditableValue
                        display={percent > 0 ? `${formatPercent(percent)}%` : "0%"}
                        draftSeed={percent > 0 ? formatPercent(percent) : ""}
                        label={`Discount percent for ${item.name}`}
                        title="Edit discount percent"
                        suffix="%"
                        onCommit={(raw) => setItemDiscountPercent(item, raw)}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatAmount(lineTotal)}
                    </TableCell>
                    <TableCell className="px-1 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item)}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {drafts.map((draft) => (
                <TableRow key={draft.key} className="bg-muted/20">
                  <TableCell className="whitespace-normal">
                    <ItemNameField
                      value={draft.query}
                      suggestions={suggestionsFor(draft.query)}
                      autoFocus={focusDraftKey === draft.key}
                      placeholder="Type test or package name…"
                      onValueChange={(query) => updateDraftQuery(draft.key, query)}
                      onPick={(item) => commitDraft(draft.key, item)}
                      onBlurEmpty={() => removeDraft(draft.key)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                  <TableCell className="px-1 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove row"
                      onClick={() => removeDraft(draft.key)}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t px-2 py-1.5">
            <Button
              id={id}
              type="button"
              variant="ghost"
              size="sm"
              disabled={available.length === 0}
              onClick={addDraftRow}
              className="h-8 w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <Plus />
              Add item
            </Button>
          </div>
        </div>

        {selected.length > 0 || paymentDraft ? (
          <InvoiceTotals
            itemCount={selected.length}
            subtotal={subtotal}
            discount={discountTotal}
            payable={netTotal}
            due={displayDue}
            dueEmphasis
            paymentRows={
              paymentDraft && onPaymentDraftChange ? (
                <InvoiceTotalsRow
                  label={
                    <Select
                      value={paymentDraft.method}
                      onValueChange={(value) =>
                        value &&
                        onPaymentDraftChange({
                          ...paymentDraft,
                          method: value,
                        })
                      }
                      items={COLLECT_METHOD_TITLES}
                    >
                      <SelectTrigger
                        className={cn(
                          inlineUnderlineSelectTriggerClass,
                          "w-auto max-w-[7rem] text-muted-foreground",
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLLECT_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {paymentMethodTitle(method)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  }
                  valueNode={
                    <InlineUnderlineInput
                      type="text"
                      inputMode="decimal"
                      value={paymentDraft.amount}
                      onChange={(event) =>
                        onPaymentDraftChange({
                          ...paymentDraft,
                          amount: event.target.value.replace(/[^\d.]/g, ""),
                        })
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault();
                          onPaymentDraftChange(null);
                        }
                      }}
                      className="w-14 text-right font-medium tabular-nums"
                      aria-label="Amount received"
                    />
                  }
                />
              ) : (
                <InvoiceTotalsRow label="Received" value={0} />
              )
            }
          />
        ) : null}
      </div>
    </BookingSection>
  );
}
