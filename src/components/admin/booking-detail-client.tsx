"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  AdminBookingForm,
  type BookingFormDefaults,
  type BookableBranch,
} from "@/components/admin/admin-booking-form";
import { BookingStatusForm } from "@/components/admin/booking-status-form";
import {
  BookingReportsPanel,
  type BookingReportItem,
} from "@/components/admin/booking-reports-panel";
import {
  PaymentPanel,
  type BookingItemRow,
  type PaymentTransactionView,
} from "@/components/admin/payment-panel";
import { PrintInvoiceButton } from "@/components/admin/booking-invoice";
import type { CatalogPickItem } from "@/components/admin/catalog-item-combobox";
import { formatCurrency } from "@/lib/format";
import { paymentBalance } from "@/lib/payment-details";

export function BookingDetailClient({
  bookingId,
  referenceCode,
  status,
  canCancel,
  cancelBlockedReason,
  catalog,
  branches,
  defaults,
  estimatedTotal,
  amountPaid,
  discountTotal,
  transactions,
  items,
  reportItems,
}: {
  bookingId: string;
  referenceCode: string;
  status: string;
  canCancel: boolean;
  cancelBlockedReason: string | null;
  catalog: CatalogPickItem[];
  branches: BookableBranch[];
  defaults: BookingFormDefaults;
  branchName?: string | null;
  estimatedTotal: number;
  amountPaid: number;
  discountTotal: number;
  transactions: PaymentTransactionView[];
  items: BookingItemRow[];
  reportItems: BookingReportItem[];
}) {
  const isCancelled = status === "CANCELLED";
  const balance = paymentBalance(estimatedTotal, amountPaid, discountTotal);

  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-0 z-10 -mx-1 rounded-xl border bg-background/95 px-3 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Bookings
            </Link>
            <div className="h-4 w-px bg-border" />
            <h1 className="font-mono text-lg font-semibold tracking-tight">
              {referenceCode}
            </h1>
            <BookingStatusForm
              bookingId={bookingId}
              currentStatus={status}
              canCancel={canCancel}
              cancelBlockedReason={cancelBlockedReason}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {balance > 0 ? (
              <p className="text-sm font-semibold tabular-nums text-rose-700 dark:text-rose-300">
                Due {formatCurrency(balance)}
              </p>
            ) : null}
            <PrintInvoiceButton bookingId={bookingId} />
          </div>
        </div>
        {isCancelled ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Cancelled — invoice history and reports remain available.
          </p>
        ) : null}
      </header>

      <AdminBookingForm
        mode="edit"
        isEditing={!isCancelled}
        detailsLayout="split"
        catalog={catalog}
        branches={branches}
        bookingId={bookingId}
        defaults={defaults}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <PaymentPanel
            bookingId={bookingId}
            isEditing={!isCancelled}
            estimatedTotal={estimatedTotal}
            amountPaid={amountPaid}
            discountTotal={discountTotal}
            transactions={transactions}
            items={items}
            catalog={catalog}
          />
        </div>

        <aside className="xl:sticky xl:top-28">
          <BookingReportsPanel bookingId={bookingId} items={reportItems} />
        </aside>
      </div>
    </div>
  );
}
