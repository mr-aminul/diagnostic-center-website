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
  triggerSize = "sm",
  open: controlledOpen,
  onOpenChange,
}: {
  triggerLabel: ReactNode;
  title: string;
  action: (previousState: EntityFormState, formData: FormData) => Promise<EntityFormState>;
  children: ReactNode;
  submitLabel?: string;
  /** Page CTAs use default (matches filter dropdowns); row actions stay sm. */
  triggerSize?: "default" | "sm";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (!isControlled) setUncontrolledOpen(next);
  };
  const [state, formAction, isPending] = useActionState(action, { status: "idle" });

  // Close uncontrolled dialogs in direct response to a new action result rather
  // than in an effect, per https://react.dev/learn/you-might-not-need-an-effect.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.status === "success" && !isControlled) {
      setUncontrolledOpen(false);
    }
  }

  useEffect(() => {
    if (state.status === "success") {
      if (isControlled) onOpenChange?.(false);
      toast.success("Saved.");
    } else if (state.status === "error" && state.error) {
      toast.error(state.error);
    }
  }, [state, isControlled, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size={triggerSize} />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
