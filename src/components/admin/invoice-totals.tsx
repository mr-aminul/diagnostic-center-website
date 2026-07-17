"use client";

import type { ReactNode, Ref, FocusEventHandler } from "react";
import { toNumber, type Numeric } from "@/lib/format";
import { cn } from "@/lib/utils";

function formatAmount(value: Numeric) {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

export function InvoiceTotalsRow({
  label,
  detail,
  value,
  strong,
  muted,
  valueNode,
  action,
  className,
}: {
  label: ReactNode;
  /** Middle slot (e.g. transaction id between method and amount). */
  detail?: ReactNode;
  value?: Numeric;
  strong?: boolean;
  muted?: boolean;
  valueNode?: ReactNode;
  /** Optional trailing control; does not affect amount alignment. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline gap-3 text-xs",
        muted && "text-muted-foreground",
        strong && "font-semibold text-foreground",
        className,
      )}
    >
      <span className={cn("shrink-0", !strong && "text-muted-foreground")}>{label}</span>
      {detail != null ? (
        <span className="min-w-0 flex-1 truncate text-muted-foreground">{detail}</span>
      ) : (
        <span className="min-w-0 flex-1" />
      )}
      <span className="relative shrink-0">
        {action ? (
          <span className="absolute top-1/2 right-full mr-0.5 -translate-y-1/2">
            {action}
          </span>
        ) : null}
        {valueNode ?? (
          <span className="tabular-nums">{formatAmount(value ?? 0)}</span>
        )}
      </span>
    </div>
  );
}

/** Receipt-style money summary: Total → Discount → Payable → payments → Due. */
export function InvoiceTotals({
  itemCount,
  subtotal,
  discount,
  payable,
  due,
  paymentRows,
  paymentRowsRef,
  paymentRowsOnBlur,
  dueEmphasis,
  footer,
}: {
  itemCount?: number;
  subtotal: number;
  discount: number;
  payable: number;
  due: number;
  /** Payment lines between Payable and Due (e.g. Cash · 500). */
  paymentRows: ReactNode;
  paymentRowsRef?: Ref<HTMLDivElement>;
  paymentRowsOnBlur?: FocusEventHandler<HTMLDivElement>;
  dueEmphasis?: boolean;
  footer?: ReactNode;
}) {
  return (
    <div className="flex justify-end">
      <div className="w-full max-w-[16.5rem] sm:max-w-[18rem]">
        <div className="flex flex-col gap-1.5">
          <InvoiceTotalsRow
            label={
              <>
                Total amount
                {itemCount != null && itemCount > 0 ? (
                  <span className="ml-1 font-normal text-muted-foreground/70">
                    · {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                ) : null}
              </>
            }
            value={subtotal}
            muted
          />
          <InvoiceTotalsRow
            label="Discount"
            value={discount}
            muted
            valueNode={
              <span className="tabular-nums">
                {discount > 0 ? `−${formatAmount(discount)}` : formatAmount(0)}
              </span>
            }
          />
        </div>

        <div className="my-2 border-t border-border" />

        <div className="flex flex-col gap-1.5">
          <InvoiceTotalsRow label="Payable" value={payable} strong />
          <div ref={paymentRowsRef} className="flex flex-col gap-1.5" onBlur={paymentRowsOnBlur}>
            {paymentRows}
          </div>
        </div>

        <div className="my-2 border-t border-border" />

        <InvoiceTotalsRow
          label="Due"
          value={due}
          strong
          className={cn(
            dueEmphasis && due > 0 && "text-destructive",
          )}
        />

        {footer ? <div className="mt-2">{footer}</div> : null}
      </div>
    </div>
  );
}
