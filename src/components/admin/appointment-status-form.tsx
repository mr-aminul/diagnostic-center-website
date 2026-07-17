"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateAppointmentStatus } from "@/app/admin/(protected)/appointments/actions";
import { cn } from "@/lib/utils";

const STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<(typeof STATUSES)[number], string> = {
  PENDING:
    "border-amber-500/35 bg-amber-500/15 text-amber-950 hover:bg-amber-500/25 dark:text-amber-100",
  CONFIRMED:
    "border-sky-500/35 bg-sky-500/15 text-sky-950 hover:bg-sky-500/25 dark:text-sky-100",
  COMPLETED:
    "border-emerald-500/35 bg-emerald-500/15 text-emerald-950 hover:bg-emerald-500/25 dark:text-emerald-100",
  CANCELLED:
    "border-red-500/35 bg-red-500/15 text-red-950 hover:bg-red-500/25 dark:text-red-100",
};

export function AppointmentStatusForm({
  appointmentId,
  currentStatus,
}: {
  appointmentId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const status = (
    STATUSES.includes(currentStatus as (typeof STATUSES)[number])
      ? currentStatus
      : "PENDING"
  ) as (typeof STATUSES)[number];

  function changeStatus(next: (typeof STATUSES)[number]) {
    if (next === status) return;
    const formData = new FormData();
    formData.set("status", next);
    startTransition(async () => {
      const result = await updateAppointmentStatus(
        appointmentId,
        { status: "idle" },
        formData,
      );
      if (result.status === "success") toast.success("Status updated.");
      if (result.status === "error" && result.error) toast.error(result.error);
    });
  }

  return (
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
      <DropdownMenuContent align="start" className="min-w-40 p-1">
        {STATUSES.map((item) => (
          <DropdownMenuItem
            key={item}
            onClick={() => changeStatus(item)}
            className={cn(
              "h-9 px-3 text-sm",
              item === status && "bg-muted font-medium",
            )}
          >
            {STATUS_LABELS[item]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
