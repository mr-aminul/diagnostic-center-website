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
import { updateBookingStatus, type BookingActionState } from "@/app/admin/(protected)/bookings/[id]/actions";

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SAMPLE_COLLECTED",
  "PROCESSING",
  "REPORT_READY",
  "CANCELLED",
] as const;

const STATUS_LABELS = Object.fromEntries(
  STATUSES.map((status) => [status, status.replaceAll("_", " ")]),
) as Record<(typeof STATUSES)[number], string>;

const initialState: BookingActionState = { status: "idle" };

export function BookingStatusForm({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: string;
}) {
  const action = updateBookingStatus.bind(null, bookingId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [status, setStatus] = useState(currentStatus);

  useEffect(() => {
    if (state.status === "success") toast.success("Booking status updated.");
    if (state.status === "error" && state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <Select
        name="status"
        value={status}
        onValueChange={(value) => value && setStatus(value)}
        items={STATUS_LABELS}
      >
        <SelectTrigger className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={isPending || status === currentStatus}>
        {isPending ? "Saving..." : "Update Status"}
      </Button>
    </form>
  );
}
