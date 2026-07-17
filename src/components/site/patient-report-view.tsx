"use client";

import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Hourglass,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  TrackBookingItemView,
  TrackBookingView,
} from "@/app/[locale]/patient-portal/actions";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Locale } from "@/config/site";
import { cn } from "@/lib/utils";

export type ReadyReportRow = {
  booking: TrackBookingView;
  item: TrackBookingItemView;
};

function reportUrl(
  booking: TrackBookingView,
  item: TrackBookingItemView,
  inline = false,
): string {
  const base = item.downloadToken
    ? `/api/reports/download?token=${encodeURIComponent(item.downloadToken)}`
    : `/api/reports/download?bookingId=${encodeURIComponent(booking.id)}&itemId=${encodeURIComponent(item.id)}`;
  return inline ? `${base}${base.includes("?") ? "&" : "?"}inline=1` : base;
}

function testSummary(booking: TrackBookingView): string {
  const names = booking.items.map((item) => item.name);
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")}…`;
}

export function flattenReadyReports(bookings: TrackBookingView[]): ReadyReportRow[] {
  return bookings.flatMap((booking) =>
    booking.items
      .filter((item) => item.hasReport)
      .map((item) => ({ booking, item })),
  );
}

export function PatientReportView({
  locale,
  readyReports,
  pendingReports,
  viewingItemId,
  onView,
  onClose,
}: {
  locale: Locale;
  readyReports: ReadyReportRow[];
  pendingReports: TrackBookingView[];
  viewingItemId: string | null;
  onView: (itemId: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("track");
  const viewing =
    readyReports.find((row) => row.item.id === viewingItemId) ?? null;

  if (viewing) {
    const previewUrl = reportUrl(viewing.booking, viewing.item, true);
    const downloadHref = reportUrl(viewing.booking, viewing.item);

    return (
      <section className="space-y-4" aria-label={t("reportsTitle")}>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="-ml-2">
            <ArrowLeft className="h-4 w-4" />
            {t("backToReports")}
          </Button>
        </div>

        <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-xl border bg-card lg:min-h-[calc(100dvh-14rem)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {viewing.item.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {viewing.booking.patientName}
                  {viewing.item.reportUploadedAt
                    ? ` · ${t("reportReadyOn", {
                        date: formatDateTime(viewing.item.reportUploadedAt, locale),
                      })}`
                    : null}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t("openReport")}
              </a>
              <a
                href={downloadHref}
                className={cn(buttonVariants({ size: "sm" }))}
                download={viewing.item.reportFileName}
              >
                <Download className="h-3.5 w-3.5" />
                {t("downloadReport")}
              </a>
            </div>
          </div>

          <iframe
            title={t("reportPreviewTitle", {
              name: viewing.item.reportFileName ?? viewing.item.name,
            })}
            src={`${previewUrl}#toolbar=1&navpanes=0`}
            className="min-h-[60vh] w-full flex-1 bg-white lg:min-h-0"
          />

          <div className="border-t bg-secondary/20 px-3 py-3 text-sm sm:px-4">
            <p className="font-medium">{viewing.item.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("staffRef")}: {viewing.booking.referenceCode} ·{" "}
              {formatDate(viewing.booking.createdAt, locale)}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6" aria-label={t("reportsTitle")}>
      <div>
        <h2 className="text-lg font-semibold">{t("reportsTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("reportsSubtitle")}</p>
      </div>

      {readyReports.length > 0 ? (
        <ul className="space-y-3">
          {readyReports.map(({ booking, item }) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-xl border bg-card"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <FileText className="h-3 w-3" aria-hidden />
                      {t("reportReadyBadge")}
                    </Badge>
                  </div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.patientName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.reportUploadedAt
                      ? t("reportReadyOn", {
                          date: formatDateTime(item.reportUploadedAt, locale),
                        })
                      : formatDate(booking.createdAt, locale)}
                    {" · "}
                    {t("staffRef")}: {booking.referenceCode}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:w-44">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => onView(item.id)}
                  >
                    <FileText className="h-4 w-4" />
                    {t("viewReport")}
                  </Button>
                  <a
                    href={reportUrl(booking, item)}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full",
                    )}
                    download={item.reportFileName}
                  >
                    <Download className="h-4 w-4" />
                    {t("downloadReport")}
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed bg-secondary/20 px-4 py-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden />
          <p className="mt-3 text-sm font-medium">{t("noReportsReady")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("noReportsReadyHint")}</p>
        </div>
      )}

      {pendingReports.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">{t("reportsPendingTitle")}</h3>
            <p className="text-xs text-muted-foreground">{t("reportsPendingSubtitle")}</p>
          </div>
          <ul className="space-y-2">
            {pendingReports.map((booking) => {
              const pendingItems = booking.items.filter((item) => !item.hasReport);
              return (
                <li
                  key={booking.id}
                  className="flex items-start gap-3 rounded-lg border bg-card px-3 py-3"
                >
                  <Hourglass
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{booking.patientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {pendingItems.map((item) => item.name).join(", ") ||
                        testSummary(booking)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("estimatedReady")}: {booking.estimatedReady}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto shrink-0 text-xs">
                    {t(
                      `statusValues.${
                        booking.status as
                          | "PENDING"
                          | "CONFIRMED"
                          | "SAMPLE_COLLECTED"
                          | "PROCESSING"
                          | "REPORT_READY"
                      }`,
                    )}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

export function reportDownloadHref(
  booking: TrackBookingView,
  item: TrackBookingItemView,
): string {
  return reportUrl(booking, item);
}
