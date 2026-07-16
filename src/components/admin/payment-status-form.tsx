"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updatePaymentStatus,
  type BookingActionState,
} from "@/app/admin/(protected)/bookings/[id]/actions";

const PAYMENT_STATUSES = ["UNPAID", "PENDING_ONLINE", "PAID", "WAIVED"] as const;

const PAYMENT_STATUS_LABELS = Object.fromEntries(
  PAYMENT_STATUSES.map((status) => [status, status.replaceAll("_", " ")]),
) as Record<(typeof PAYMENT_STATUSES)[number], string>;

const initialState: BookingActionState = { status: "idle" };

export function PaymentStatusForm({
  bookingId,
  currentStatus,
  paymentMethod,
}: {
  bookingId: string;
  currentStatus: string;
  paymentMethod: string;
}) {
  const action = updatePaymentStatus.bind(null, bookingId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [status, setStatus] = useState(currentStatus);

  useEffect(() => {
    if (state.status === "success") toast.success("Payment status updated.");
    if (state.status === "error" && state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <p className="w-full text-sm text-muted-foreground">
        Method: <span className="font-medium text-foreground">{paymentMethod}</span>
      </p>
      <Select
        name="paymentStatus"
        value={status}
        onValueChange={(value) => value && setStatus(value)}
        items={PAYMENT_STATUS_LABELS}
      >
        <SelectTrigger className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAYMENT_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {PAYMENT_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={isPending || status === currentStatus}>
        {isPending ? "Saving..." : "Update Payment"}
      </Button>
    </form>
  );
}
