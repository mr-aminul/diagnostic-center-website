"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ConfirmDeleteButton({
  action,
  confirmMessage = "Are you sure? This cannot be undone.",
}: {
  action: () => Promise<{ error?: string } | void>;
  confirmMessage?: string;
}) {
  return (
    <form
      action={async () => {
        if (!window.confirm(confirmMessage)) return;
        const result = await action();
        if (result?.error) toast.error(result.error);
      }}
    >
      <Button type="submit" variant="ghost" size="icon-sm" aria-label="Delete">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </form>
  );
}
