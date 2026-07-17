"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ArrowUpFromLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadReport, type BookingActionState } from "@/app/admin/(protected)/bookings/[id]/actions";

const initialState: BookingActionState = { status: "idle" };

export function ReportUploadForm({
  bookingId,
  bookingItemId,
  size = "default",
  variant = "default",
  iconOnly = false,
}: {
  bookingId: string;
  bookingItemId: string;
  size?: "default" | "sm" | "xs";
  variant?: "default" | "outline" | "ghost";
  iconOnly?: boolean;
}) {
  const action = uploadReport.bind(null, bookingId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Report uploaded and patient notified by SMS.");
      formRef.current?.reset();
    }
    if (state.status === "error" && state.error) toast.error(state.error);
  }, [state]);

  const label = isPending ? "Uploading…" : "Upload report";

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="bookingItemId" value={bookingItemId} />
      <input
        ref={fileInputRef}
        type="file"
        name="file"
        accept="application/pdf"
        required
        className="sr-only"
        tabIndex={-1}
        onChange={() => {
          if (fileInputRef.current?.files?.length) {
            formRef.current?.requestSubmit();
          }
        }}
      />
      <Button
        type="button"
        size={iconOnly ? "icon-xs" : size}
        variant={variant}
        disabled={isPending}
        aria-label={label}
        title={label}
        onClick={() => fileInputRef.current?.click()}
      >
        {isPending ? <Loader2 className="animate-spin" /> : <ArrowUpFromLine />}
        {iconOnly ? null : label}
      </Button>
    </form>
  );
}
