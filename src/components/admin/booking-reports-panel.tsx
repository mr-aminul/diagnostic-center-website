"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, FileText, Trash2 } from "lucide-react";
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
import { ReportUploadForm } from "@/components/admin/report-upload-form";
import { deleteReport } from "@/app/admin/(protected)/bookings/[id]/actions";
import { cn } from "@/lib/utils";

export type BookingReportItem = {
  id: string;
  name: string;
  type: "test" | "package";
  report: { fileName: string } | null;
};

export function BookingReportsPanel({
  bookingId,
  items,
}: {
  bookingId: string;
  items: BookingReportItem[];
}) {
  const router = useRouter();
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const viewingItem =
    items.find((item) => item.id === viewingItemId && item.report) ?? null;
  const viewingUrl = viewingItem
    ? `/api/reports/download?bookingId=${encodeURIComponent(bookingId)}&itemId=${encodeURIComponent(viewingItem.id)}&inline=1`
    : null;
  const deleteItem = items.find((item) => item.id === deleteItemId) ?? null;

  const readyCount = items.filter((item) => item.report).length;
  const modalOpen = Boolean(viewingItem && viewingUrl);

  if (items.length === 0) {
    return (
      <section className="rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold">Reports</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add tests or packages to this booking before uploading reports.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <p className="text-sm font-semibold">Reports</p>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {readyCount}/{items.length}
        </p>
      </div>

      <ul className="divide-y">
        {items.map((item) => {
          const isReady = Boolean(item.report);

          return (
            <li key={item.id} className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.report?.fileName ?? "No report yet"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {isReady ? (
                    <>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="outline"
                        aria-label={`View ${item.name} report`}
                        title="View"
                        onClick={() => setViewingItemId(item.id)}
                      >
                        <Eye />
                      </Button>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="outline"
                        aria-label={`Delete ${item.name} report`}
                        title="Delete"
                        onClick={() => setDeleteItemId(item.id)}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </>
                  ) : (
                    <ReportUploadForm
                      bookingId={bookingId}
                      bookingItemId={item.id}
                      variant="outline"
                      iconOnly
                    />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) setViewingItemId(null);
        }}
      >
        <DialogContent
          className="flex h-[min(96vh,100dvh)] w-[min(96vw,100%)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
          showCloseButton
        >
          <DialogHeader className="shrink-0 flex-row items-center justify-between gap-3 border-b px-4 py-3 pr-12 text-left">
            <DialogTitle className="truncate text-sm font-medium">
              {viewingItem?.name ?? "Report"}
            </DialogTitle>
            {viewingUrl ? (
              <a
                href={viewingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "xs" }))}
              >
                <ExternalLink className="h-3 w-3" />
                Open
              </a>
            ) : null}
          </DialogHeader>
          {viewingUrl && viewingItem?.report ? (
            <iframe
              title={`Report: ${viewingItem.report.fileName}`}
              src={`${viewingUrl}#toolbar=1&navpanes=0`}
              className="min-h-0 w-full flex-1 bg-white dark:bg-zinc-100"
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteItem)}
        onOpenChange={(open) => {
          if (!open) setDeleteItemId(null);
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete report?</DialogTitle>
            <DialogDescription>
              Delete the report for {deleteItem?.name}? The patient will no longer
              be able to download it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deletePending}
              onClick={() => setDeleteItemId(null)}
            >
              Keep report
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletePending || !deleteItem}
              onClick={async () => {
                if (!deleteItem) return;
                setDeletePending(true);
                const result = await deleteReport(bookingId, deleteItem.id);
                setDeletePending(false);
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                if (viewingItemId === deleteItem.id) setViewingItemId(null);
                setDeleteItemId(null);
                toast.success("Report deleted.");
                router.refresh();
              }}
            >
              {deletePending ? "Deleting…" : "Delete report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
