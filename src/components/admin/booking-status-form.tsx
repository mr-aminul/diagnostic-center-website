"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateBookingStatus } from "@/app/admin/(protected)/bookings/[id]/actions";
import { cn } from "@/lib/utils";

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SAMPLE_COLLECTED",
  "PROCESSING",
  "REPORT_READY",
  "CANCELLED",
] as const;

const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SAMPLE_COLLECTED: "Sample collected",
  PROCESSING: "Processing",
  REPORT_READY: "Report ready",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<(typeof STATUSES)[number], string> = {
  PENDING:
    "border-amber-500/35 bg-amber-500/15 text-amber-950 hover:bg-amber-500/25 dark:text-amber-100",
  CONFIRMED:
    "border-sky-500/35 bg-sky-500/15 text-sky-950 hover:bg-sky-500/25 dark:text-sky-100",
  SAMPLE_COLLECTED:
    "border-violet-500/35 bg-violet-500/15 text-violet-950 hover:bg-violet-500/25 dark:text-violet-100",
  PROCESSING:
    "border-orange-500/35 bg-orange-500/15 text-orange-950 hover:bg-orange-500/25 dark:text-orange-100",
  REPORT_READY:
    "border-emerald-500/35 bg-emerald-500/15 text-emerald-950 hover:bg-emerald-500/25 dark:text-emerald-100",
  CANCELLED:
    "border-red-500/35 bg-red-500/15 text-red-950 hover:bg-red-500/25 dark:text-red-100",
};

export function BookingStatusForm({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const status = (
    STATUSES.includes(currentStatus as (typeof STATUSES)[number])
      ? currentStatus
      : "PENDING"
  ) as (typeof STATUSES)[number];

  function applyStatus(next: (typeof STATUSES)[number]) {
    if (next === status) return;
    const formData = new FormData();
    formData.set("status", next);
    startTransition(async () => {
      const result = await updateBookingStatus(
        bookingId,
        { status: "idle" },
        formData,
      );
      if (result.status === "success") {
        toast.success(
          next === "CANCELLED" ? "Booking cancelled." : "Booking status updated.",
        );
        setCancelOpen(false);
      }
      if (result.status === "error" && result.error) toast.error(result.error);
    });
  }

  function changeStatus(next: (typeof STATUSES)[number]) {
    if (next === "CANCELLED") {
      setCancelOpen(true);
      return;
    }
    applyStatus(next);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-full px-3",
            STATUS_COLORS[status],
            pending && "opacity-60",
          )}
          aria-label={`Status: ${STATUS_LABELS[status]}. Click to change.`}
        >
          {STATUS_LABELS[status]}
          <ChevronDown data-icon="inline-end" className="opacity-70" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44 p-1">
          {STATUSES.map((option) => (
            <DropdownMenuItem
              key={option}
              disabled={pending || option === status}
              onClick={() => changeStatus(option)}
            >
              {STATUS_LABELS[option]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              The patient will be notified by SMS. You can change the status again
              later if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setCancelOpen(false)}
            >
              Keep booking
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => applyStatus("CANCELLED")}
            >
              {pending ? "Cancelling…" : "Cancel booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
