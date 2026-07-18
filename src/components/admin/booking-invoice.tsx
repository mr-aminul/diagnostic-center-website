"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Printer, Stethoscope } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  PAYMENT_METHOD_LABELS,
  netInvoiceDue,
  paymentBalance,
  type PaymentMethodId,
} from "@/lib/payment-details";
import { cn } from "@/lib/utils";

export type BookingInvoiceItem = {
  id: string;
  name: string;
  price: number;
  isCancelled?: boolean;
};

export type BookingInvoicePayment = {
  id: string;
  kind?: string;
  amount: number;
  method: string | null;
  reference: string | null;
};

export type BookingInvoiceData = {
  referenceCode: string;
  patientName: string;
  phone: string;
  age: number | null;
  gender: string | null;
  address: string | null;
  collectionType: string;
  branchName: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  estimatedTotal: number;
  amountPaid: number;
  discountTotal: number;
  createdAt: string;
  notes: string | null;
  items: BookingInvoiceItem[];
  payments: BookingInvoicePayment[];
};

export type BookingInvoiceCenter = {
  name: string;
  shortName: string;
  phones: string[];
  email: string;
  /** Absolute path under /public when a real logo file exists. */
  logoSrc: string | null;
};

function paymentMethodLabel(method: string | null) {
  if (!method) return "Payment";
  return (
    PAYMENT_METHOD_LABELS[method as PaymentMethodId] ?? method.replaceAll("_", " ")
  );
}

function InvoiceDetail({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  if (!value) return null;
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[10px] leading-tight tracking-wide text-zinc-500 uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm text-zinc-900" title={value}>
        {value}
      </dd>
    </div>
  );
}

/** Opens the printable invoice in a new tab and triggers the browser print dialog. */
export function PrintInvoiceButton({
  bookingId,
  className,
}: {
  bookingId: string;
  className?: string;
}) {
  return (
    <Link
      href={`/admin/bookings/${bookingId}/invoice?print=1`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ size: "sm" }), className)}
    >
      <Printer className="h-4 w-4" />
      Print invoice
    </Link>
  );
}

export function InvoicePrintTrigger({ autoPrint }: { autoPrint: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    const timer = window.setTimeout(() => window.print(), 250);
    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  return null;
}

export function BookingInvoiceToolbar({
  bookingId,
  autoPrint,
}: {
  bookingId: string;
  autoPrint: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
      <InvoicePrintTrigger autoPrint={autoPrint} />
      <Link
        href={`/admin/bookings/${bookingId}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to booking
      </Link>
      <Button type="button" size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Print
      </Button>
    </div>
  );
}

export function BookingInvoiceDocument({
  center,
  booking,
}: {
  center: BookingInvoiceCenter;
  booking: BookingInvoiceData;
}) {
  const payable = netInvoiceDue(booking.estimatedTotal, booking.discountTotal);
  const due = paymentBalance(
    booking.estimatedTotal,
    booking.amountPaid,
    booking.discountTotal,
  );
  const phoneLine = center.phones.filter(Boolean).join(" · ");
  const genderLabel = booking.gender
    ? booking.gender.charAt(0) + booking.gender.slice(1).toLowerCase()
    : null;

  return (
    <article className="mx-auto max-w-4xl bg-white text-zinc-900 print:max-w-none">
      <header className="border-b border-zinc-200 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {center.logoSrc ? (
              <Image
                src={center.logoSrc}
                alt={center.shortName || center.name}
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 rounded-lg object-contain"
                priority
              />
            ) : (
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground print:bg-zinc-900 print:text-white"
                aria-hidden
              >
                <Stethoscope className="h-7 w-7" strokeWidth={2.25} />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight">{center.name}</h1>
              {booking.branchName ? (
                <p className="mt-0.5 text-sm font-medium text-zinc-700">
                  {booking.branchName}
                </p>
              ) : null}
              {phoneLine ? (
                <p className="mt-1 text-sm text-zinc-600">{phoneLine}</p>
              ) : null}
              {center.email ? (
                <p className="text-sm text-zinc-600">{center.email}</p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
              Invoice
            </p>
            <p className="mt-1 text-lg font-semibold">{booking.referenceCode}</p>
            <p className="mt-1 text-sm text-zinc-600">
              {formatDateTime(booking.createdAt)}
            </p>
          </div>
        </div>
      </header>

      <section className="mt-6">
        <h2 className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
          Patient & visit
        </h2>
        <dl className="mt-3 flex flex-nowrap items-start gap-4 overflow-hidden">
          <InvoiceDetail label="Name" value={booking.patientName} className="min-w-[7rem] flex-[1.4]" />
          <InvoiceDetail label="Phone" value={booking.phone} className="min-w-[6.5rem] flex-1" />
          <InvoiceDetail
            label="Age"
            value={booking.age != null ? String(booking.age) : null}
            className="w-10 shrink-0"
          />
          <InvoiceDetail label="Gender" value={genderLabel} className="w-14 shrink-0" />
          <InvoiceDetail
            label="Collection"
            value={booking.collectionType.replaceAll("_", " ")}
            className="min-w-[5.5rem] flex-1"
          />
          <InvoiceDetail
            label="Date"
            value={booking.preferredDate}
            className="min-w-[5.5rem] flex-1"
          />
          <InvoiceDetail
            label="Time"
            value={booking.preferredTime}
            className="w-16 shrink-0"
          />
          <InvoiceDetail
            label="Address"
            value={booking.address}
            className="min-w-[8rem] flex-[1.6]"
          />
        </dl>
      </section>

      <section className="mt-8">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-300 text-left text-xs tracking-wide text-zinc-500 uppercase">
              <th className="py-2 pr-3 font-medium">#</th>
              <th className="py-2 pr-3 font-medium">Item</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {booking.items.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-zinc-500">
                  No items on this booking.
                </td>
              </tr>
            ) : (
              booking.items.map((item, index) => (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b border-zinc-100",
                    item.isCancelled && "text-zinc-400",
                  )}
                >
                  <td className="py-2.5 pr-3 text-zinc-500">{index + 1}</td>
                  <td
                    className={cn(
                      "py-2.5 pr-3 font-medium",
                      item.isCancelled && "line-through",
                    )}
                  >
                    {item.name}
                    {item.isCancelled ? (
                      <span className="ml-2 text-xs font-normal no-underline">
                        (Cancelled)
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    {item.isCancelled ? "—" : formatCurrency(item.price)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="mt-6 flex justify-end">
        <dl className="w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between gap-6">
            <dt className="text-zinc-500">Total</dt>
            <dd className="tabular-nums">{formatCurrency(booking.estimatedTotal)}</dd>
          </div>
          {booking.discountTotal > 0 ? (
            <div className="flex justify-between gap-6">
              <dt className="text-zinc-500">Discount</dt>
              <dd className="tabular-nums">
                −{formatCurrency(booking.discountTotal)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-6 border-t border-zinc-200 pt-2 font-semibold">
            <dt>Payable</dt>
            <dd className="tabular-nums">{formatCurrency(payable)}</dd>
          </div>
          {booking.payments.map((payment) => (
            <div key={payment.id} className="flex justify-between gap-6">
              <dt className="min-w-0 truncate text-zinc-500">
                {payment.kind === "REFUND"
                  ? `Refund · ${paymentMethodLabel(payment.method)}`
                  : paymentMethodLabel(payment.method)}
                {payment.reference ? ` · ${payment.reference}` : ""}
              </dt>
              <dd className="shrink-0 tabular-nums">
                {payment.kind === "REFUND"
                  ? `−${formatCurrency(payment.amount)}`
                  : formatCurrency(payment.amount)}
              </dd>
            </div>
          ))}
          <div className="flex justify-between gap-6 border-t border-zinc-200 pt-2 font-semibold">
            <dt>Due</dt>
            <dd className="tabular-nums">{formatCurrency(due)}</dd>
          </div>
        </dl>
      </section>

      {booking.notes ? (
        <section className="mt-8 border-t border-zinc-200 pt-4">
          <h2 className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            Notes
          </h2>
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-zinc-700">
            {booking.notes}
          </p>
        </section>
      ) : null}

      <footer className="mt-10 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-500">
        Thank you for choosing {center.shortName || center.name}.
      </footer>
    </article>
  );
}
