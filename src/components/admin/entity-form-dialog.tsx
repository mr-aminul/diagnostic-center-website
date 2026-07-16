"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface EntityFormState {
  status: "idle" | "success" | "error";
  error?: string;
}

export function EntityFormDialog({
  triggerLabel,
  title,
  action,
  children,
  submitLabel = "Save",
}: {
  triggerLabel: ReactNode;
  title: string;
  action: (previousState: EntityFormState, formData: FormData) => Promise<EntityFormState>;
  children: ReactNode;
  submitLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, { status: "idle" });

  // Close the dialog in direct response to a new action result rather than in
  // an effect, per https://react.dev/learn/you-might-not-need-an-effect —
  // this only runs once per distinct `state` object (i.e. once per submit).
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.status === "success") {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Saved.");
    } else if (state.status === "error" && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>{triggerLabel}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {children}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
