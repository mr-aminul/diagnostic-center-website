"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadReport, type BookingActionState } from "@/app/admin/(protected)/bookings/[id]/actions";

const initialState: BookingActionState = { status: "idle" };

export function ReportUploadForm({
  bookingId,
  hasExistingReport,
}: {
  bookingId: string;
  hasExistingReport: boolean;
}) {
  const action = uploadReport.bind(null, bookingId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Report uploaded and patient notified by SMS.");
      formRef.current?.reset();
    }
    if (state.status === "error" && state.error) toast.error(state.error);
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-3">
      <Input type="file" name="file" accept="application/pdf" required className="max-w-xs" />
      <Button type="submit" disabled={isPending}>
        <UploadCloud className="h-4 w-4" />
        {isPending ? "Uploading..." : hasExistingReport ? "Replace Report" : "Upload Report"}
      </Button>
    </form>
  );
}
