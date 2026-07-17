"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ItemNameField,
  type CatalogPickItem,
} from "@/components/admin/catalog-item-combobox";
import {
  addBookingItem,
  deleteBookingPayment,
  removeBookingItem,
  replaceBookingItem,
  updateBookingItemDiscounts,
  updateBookingPayment,
  type BookingActionState,
} from "@/app/admin/(protected)/bookings/[id]/actions";
import { toNumber, type Numeric } from "@/lib/format";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  paymentBalance,
} from "@/lib/payment-details";
import { parseLineDiscountItemId } from "@/lib/booking-line-discount-notes";
import { cn } from "@/lib/utils";

function formatAmount(value: Numeric) {
  return new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(
    toNumber(value),
  );
}

function formatPercent(value: number) {
  if (value <= 0) return "0";
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}

function clampDiscount(value: number, maxPrice: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(maxPrice, Math.round(value * 100) / 100);
}

function clampPercent(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(100, Math.round(value * 100) / 100);
}

const initialState: BookingActionState = { status: "idle" };
const COLLECT_METHODS = PAYMENT_METHODS.filter((method) => method !== "ONLINE");

function paymentMethodTitle(method: string) {
  return (
    PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] ?? method
  );
}

const COLLECT_METHOD_TITLES = Object.fromEntries(
  COLLECT_METHODS.map((method) => [method, paymentMethodTitle(method)]),
);

export type BookingItemRow = {
  id: string;
  name: string;
  type: "test" | "package";
  catalogId: string;
  price: number;
  hasReport: boolean;
};

type DraftRow = { key: string; query: string };

function catalogKey(item: Pick<CatalogPickItem, "type" | "id">) {
  return `${item.type}:${item.id}`;
}

function matchesCatalogQuery(item: CatalogPickItem, query: string) {
  const haystack = [item.name, item.nameBn, item.type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

export type PaymentTransactionView = {
  id: string;
  kind: string;
  amount: number;
  method: string | null;
  reference: string | null;
  note: string | null;
  paidAt: string;
};

type LineState = BookingItemRow & {
  discount: number;
  discountMode: "amount" | "percent";
  discountValue: number;
};

type PaymentDraft = {
  amount: string;
  method: string;
  reference: string;
};

function buildLineState(
  items: BookingItemRow[],
  transactions: PaymentTransactionView[],
  discountTotal: number,
): LineState[] {
  const tagged = new Map<string, number>();
  let untagged = 0;
  for (const txn of transactions) {
    if (txn.kind !== "DISCOUNT") continue;
    const itemId = parseLineDiscountItemId(txn.note);
    if (itemId) tagged.set(itemId, (tagged.get(itemId) ?? 0) + txn.amount);
    else untagged += txn.amount;
  }

  const hasTagged = tagged.size > 0;
  const pool = hasTagged ? 0 : untagged > 0 ? untagged : discountTotal;
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  let allocated = 0;
  return items.map((item, index) => {
    let discount = 0;
    if (hasTagged) {
      discount = clampDiscount(tagged.get(item.id) ?? 0, item.price);
    } else if (pool > 0 && subtotal > 0) {
      if (index === items.length - 1) {
        discount = clampDiscount(pool - allocated, item.price);
      } else {
        discount = clampDiscount((pool * item.price) / subtotal, item.price);
        allocated += discount;
      }
    }
    return {
      ...item,
      discount,
      discountMode: "amount" as const,
      discountValue: discount,
    };
  });
}

/** Always-editable items table with discounts, payments, and catalog add/replace. */
export function PaymentPanel({
  bookingId,
  estimatedTotal,
  amountPaid,
  discountTotal,
  transactions,
  items,
  catalog,
}: {
  bookingId: string;
  estimatedTotal: number;
  amountPaid: number;
  discountTotal: number;
  transactions: PaymentTransactionView[];
  items: BookingItemRow[];
  catalog: CatalogPickItem[];
}) {
  const router = useRouter();
  const amountRef = useRef<HTMLInputElement>(null);
  const receivedEditorRef = useRef<HTMLDivElement>(null);
  const paymentDraftRef = useRef<PaymentDraft | null>(null);
  const paymentInFlightRef = useRef(false);
  const [, startDiscountTransition] = useTransition();
  const [payPending, startPaymentTransition] = useTransition();
  const [itemPending, startItemTransition] = useTransition();

  const [lines, setLines] = useState(() =>
    buildLineState(items, transactions, discountTotal),
  );
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [focusDraftKey, setFocusDraftKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingQuery, setEditingQuery] = useState("");
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft | null>(null);
  const [removeTarget, setRemoveTarget] = useState<LineState | null>(null);
  paymentDraftRef.current = paymentDraft;

  const selectedKeys = useMemo(
    () => new Set(items.map((item) => catalogKey({ type: item.type, id: item.catalogId }))),
    [items],
  );

  const available = useMemo(
    () => catalog.filter((item) => !selectedKeys.has(catalogKey(item))),
    [catalog, selectedKeys],
  );

  function suggestionsFor(query: string, excludeKey?: string) {
    const pool = catalog.filter((item) => {
      const key = catalogKey(item);
      if (excludeKey && key === excludeKey) return true;
      return !selectedKeys.has(key);
    });
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pool.slice(0, 40);
    return pool.filter((item) => matchesCatalogQuery(item, normalized)).slice(0, 40);
  }

  useEffect(() => {
    setLines(buildLineState(items, transactions, discountTotal));
  }, [items, transactions, discountTotal]);

  const lineDiscountTotal = lines.reduce((sum, line) => sum + line.discount, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.price, 0);
  const payable = Math.max(0, Math.round((subtotal - lineDiscountTotal) * 100) / 100);
  const balance = paymentBalance(estimatedTotal, amountPaid, discountTotal);

  const draftAmount = paymentDraft ? Number(paymentDraft.amount) || 0 : 0;
  const displayReceived = paymentDraft ? amountPaid + draftAmount : amountPaid;
  const displayDue = paymentDraft
    ? Math.max(0, Math.round((payable - displayReceived) * 100) / 100)
    : Math.max(0, Math.round((payable - amountPaid) * 100) / 100);

  const paymentsOnly = useMemo(
    () => transactions.filter((txn) => txn.kind === "PAYMENT"),
    [transactions],
  );

  const isReceivingPayment = paymentDraft != null;

  useEffect(() => {
    if (!isReceivingPayment) return;
    const frame = requestAnimationFrame(() => amountRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isReceivingPayment]);

  const isDue = displayDue > 0;
  const statusLabel = isDue ? "Due" : "Paid";
  const statusBadgeClass = isDue
    ? "border-transparent bg-destructive/10 text-destructive"
    : "border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";

  function startPaymentRow() {
    if (balance <= 0 || paymentDraft) return;
    setPaymentDraft({
      amount: String(balance),
      method: "CASH",
      reference: "",
    });
  }

  function draftIsReady(draft: PaymentDraft) {
    const amount = Number(draft.amount);
    return Number.isFinite(amount) && amount > 0;
  }

  function persistPayment(draft: PaymentDraft) {
    if (
      paymentInFlightRef.current ||
      payPending ||
      balance <= 0 ||
      !draftIsReady(draft)
    ) {
      return;
    }
    paymentInFlightRef.current = true;
    startPaymentTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("intent", "add");
        formData.set("kind", "PAYMENT");
        formData.set("paymentMethod", draft.method);
        formData.set("amount", draft.amount);
        const result = await updateBookingPayment(
          bookingId,
          initialState,
          formData,
        );
        if (result.status === "success") {
          toast.success("Payment recorded.");
          setPaymentDraft(null);
        } else if (result.error) {
          toast.error(result.error);
        }
      } finally {
        paymentInFlightRef.current = false;
      }
    });
  }

  function schedulePersistIfLeftEditor() {
    window.setTimeout(() => {
      const draft = paymentDraftRef.current;
      if (!draft || paymentInFlightRef.current || payPending) return;
      const active = document.activeElement;
      if (receivedEditorRef.current?.contains(active)) return;
      if (
        active?.closest(
          '[data-slot="select-content"], [data-slot="select-popup"], [role="listbox"]',
        )
      ) {
        return;
      }
      persistPayment(draft);
    }, 0);
  }

  function persistDiscounts(next: LineState[]) {
    setLines(next);
    const payload = JSON.stringify(
      next.map((line) => ({ itemId: line.id, discount: line.discount })),
    );
    startDiscountTransition(async () => {
      const formData = new FormData();
      formData.set("lines", payload);
      const result = await updateBookingItemDiscounts(bookingId, initialState, formData);
      if (result.status === "error" && result.error) {
        toast.error(result.error);
        setLines(buildLineState(items, transactions, discountTotal));
      }
    });
  }

  function setItemDiscountAmount(item: LineState, raw: string) {
    const numeric = Number(raw.trim());
    const discount = clampDiscount(
      raw.trim() === "" || !Number.isFinite(numeric) ? 0 : numeric,
      item.price,
    );
    persistDiscounts(
      lines.map((row) =>
        row.id === item.id
          ? { ...row, discount, discountMode: "amount", discountValue: discount }
          : row,
      ),
    );
  }

  function setItemDiscountPercent(item: LineState, raw: string) {
    const numeric = Number(raw.trim());
    const pct = clampPercent(
      raw.trim() === "" || !Number.isFinite(numeric) ? 0 : numeric,
    );
    const discount = clampDiscount((item.price * pct) / 100, item.price);
    persistDiscounts(
      lines.map((row) =>
        row.id === item.id
          ? { ...row, discount, discountMode: "percent", discountValue: pct }
          : row,
      ),
    );
  }

  function percentForItem(item: LineState) {
    if (item.discountMode === "percent") return item.discountValue;
    if (item.price <= 0 || item.discount <= 0) return 0;
    return clampPercent((item.discount / item.price) * 100);
  }

  const showEmpty = lines.length === 0 && drafts.length === 0;
  const showTotals = lines.length > 0 || amountPaid > 0 || Boolean(paymentDraft);

  function addDraftRow() {
    if (available.length === 0 || itemPending) return;
    const key = `draft-${Math.random().toString(36).slice(2, 10)}`;
    setDrafts((current) => [...current, { key, query: "" }]);
    setFocusDraftKey(key);
    setEditingKey(null);
  }

  function commitDraft(draftKey: string, picked: CatalogPickItem) {
    setDrafts((current) => current.filter((draft) => draft.key !== draftKey));
    setFocusDraftKey(null);
    startItemTransition(async () => {
      const result = await addBookingItem(bookingId, {
        type: picked.type,
        id: picked.id,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function commitReplace(item: LineState, picked: CatalogPickItem) {
    setEditingKey(null);
    setEditingQuery("");
    startItemTransition(async () => {
      const result = await replaceBookingItem(bookingId, item.id, {
        type: picked.type,
        id: picked.id,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function requestRemoveLine(item: LineState) {
    if (item.hasReport) {
      toast.error("Delete the report for this item before removing it.");
      return;
    }
    if (lines.length <= 1) {
      toast.error("A booking must keep at least one test or package.");
      return;
    }
    setRemoveTarget(item);
  }

  function confirmRemoveLine() {
    const item = removeTarget;
    if (!item) return;
    startItemTransition(async () => {
      const result = await removeBookingItem(bookingId, item.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setRemoveTarget(null);
      router.refresh();
    });
  }

  return (
    <>
    <BookingSection
      title="Tests & packages"
      className="order-3"
      titleAction={
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={available.length === 0 || itemPending}
          onClick={addDraftRow}
        >
          <Plus />
          Add
        </Button>
      }
      headerRight={
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
            disabled={payPending || balance <= 0 || Boolean(paymentDraft)}
            onClick={startPaymentRow}
          >
            <Plus />
            Receive payment
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border">
          <Table className={adminCompactTableClass}>
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
                  Click Add to insert a row, then type a test or package name.
                </TableCell>
              </TableRow>
            ) : null}

            {lines.map((item) => {
              const percent = percentForItem(item);
              const lineTotal = Math.max(
                0,
                Math.round((item.price - item.discount) * 100) / 100,
              );
              const isRenaming = editingKey === item.id;
              return (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-normal">
                    {isRenaming ? (
                      <ItemNameField
                        value={editingQuery}
                        suggestions={suggestionsFor(
                          editingQuery,
                          catalogKey({ type: item.type, id: item.catalogId }),
                        )}
                        autoFocus
                        onValueChange={setEditingQuery}
                        onPick={(picked) => commitReplace(item, picked)}
                        onBlurEmpty={() => {
                          setEditingKey(null);
                          setEditingQuery("");
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        disabled={itemPending || item.hasReport}
                        className="w-full border-0 border-b border-transparent bg-transparent p-0 text-left text-xs font-medium outline-none hover:border-muted-foreground/40 disabled:cursor-not-allowed disabled:opacity-60"
                        title={
                          item.hasReport
                            ? "Delete the report before replacing this item"
                            : "Replace item"
                        }
                        onClick={() => {
                          setEditingKey(item.id);
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
                      disabled={itemPending || item.hasReport || lines.length <= 1}
                      aria-label={`Remove ${item.name}`}
                      title={
                        item.hasReport
                          ? "Delete the report before removing this item"
                          : "Remove item"
                      }
                      onClick={() => requestRemoveLine(item)}
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
                    onValueChange={(query) =>
                      setDrafts((current) =>
                        current.map((row) =>
                          row.key === draft.key ? { ...row, query } : row,
                        ),
                      )
                    }
                    onPick={(picked) => commitDraft(draft.key, picked)}
                    onBlurEmpty={() =>
                      setDrafts((current) =>
                        current.filter((row) => row.key !== draft.key),
                      )
                    }
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
                    onClick={() =>
                      setDrafts((current) =>
                        current.filter((row) => row.key !== draft.key),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showTotals ? (
        <InvoiceTotals
          itemCount={lines.length}
          subtotal={subtotal}
          discount={lineDiscountTotal}
          payable={payable}
          due={displayDue}
          dueEmphasis
          paymentRowsRef={paymentDraft ? receivedEditorRef : undefined}
          paymentRowsOnBlur={paymentDraft ? schedulePersistIfLeftEditor : undefined}
          paymentRows={
            <>
              {paymentsOnly.map((txn) => (
                <InvoiceTotalsRow
                  key={txn.id}
                  label={paymentMethodTitle(txn.method ?? "OTHER")}
                  value={txn.amount}
                  action={
                    <DeletePaymentButton
                      bookingId={bookingId}
                      paymentId={txn.id}
                      methodLabel={paymentMethodTitle(txn.method ?? "OTHER")}
                      amount={txn.amount}
                    />
                  }
                />
              ))}

              {paymentDraft ? (
                <InvoiceTotalsRow
                  label={
                    <Select
                      value={paymentDraft.method}
                      onValueChange={(value) =>
                        value &&
                        setPaymentDraft({
                          ...paymentDraft,
                          method: value,
                        })
                      }
                      disabled={payPending}
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
                      ref={amountRef}
                      type="text"
                      inputMode="decimal"
                      value={paymentDraft.amount}
                      disabled={payPending}
                      onChange={(event) =>
                        setPaymentDraft({
                          ...paymentDraft,
                          amount: event.target.value.replace(/[^\d.]/g, ""),
                        })
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          persistPayment(paymentDraft);
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          setPaymentDraft(null);
                        }
                      }}
                      className="w-14 text-right font-medium tabular-nums"
                      aria-label="Amount received"
                    />
                  }
                />
              ) : null}

              {paymentsOnly.length === 0 && !paymentDraft ? (
                <InvoiceTotalsRow label="Received" value={0} />
              ) : null}
            </>
          }
        />
      ) : null}
      </div>
    </BookingSection>

    <Dialog
      open={removeTarget != null}
      onOpenChange={(open) => {
        if (!open && !itemPending) setRemoveTarget(null);
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove item?</DialogTitle>
          <DialogDescription>
            Remove {removeTarget?.name ?? "this item"} from this booking? Discounts
            on this line will be cleared.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={itemPending}
            onClick={() => setRemoveTarget(null)}
          >
            Keep item
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={itemPending || !removeTarget}
            onClick={confirmRemoveLine}
          >
            {itemPending ? "Removing…" : "Remove item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

function DeletePaymentButton({
  bookingId,
  paymentId,
  methodLabel,
  amount,
}: {
  bookingId: string;
  paymentId: string;
  methodLabel: string;
  amount: number;
}) {
  const [open, setOpen] = useState(false);
  const action = deleteBookingPayment.bind(null, bookingId, paymentId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Payment removed.");
      setOpen(false);
    }
    if (state.status === "error" && state.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove payment"
            className="size-4 text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-3" />
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove payment?</DialogTitle>
          <DialogDescription>
            Remove this {methodLabel} payment of ৳{formatAmount(amount)}? This cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <form action={formAction}>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Removing…" : "Remove"}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
