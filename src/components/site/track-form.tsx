"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Circle,
  Download,
  FileText,
  LogOut,
  MessageSquareText,
  XCircle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cancelBooking,
  logoutPatientPortal,
  requestTrackOtp,
  rescheduleBooking,
  resendStatusSms,
  verifyTrackOtp,
  type TrackBookingView,
  type TrackPortalState,
} from "@/app/[locale]/patient-portal/actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { BD_PHONE_HINT } from "@/lib/phone";
import { STATUS_ORDER, statusStepIndex } from "@/lib/booking-status";
import {
  TIME_SLOT_VALUES,
  labelTimeSlot,
  todayDateInputValue,
} from "@/lib/time-slots";
import { siteConfig, type Locale } from "@/config/site";
import { isDemoPayment } from "@/lib/payment";
import { DemoPaymentCheckout } from "@/components/site/demo-payment-checkout";
import { DevAutofillButton } from "@/components/site/dev-autofill-button";
import { DEV_SAMPLE, isDevToolsEnabled } from "@/lib/dev-tools";
import { cn } from "@/lib/utils";

const idle: TrackPortalState = { status: "idle" };

type StatusKey =
  | "PENDING"
  | "CONFIRMED"
  | "SAMPLE_COLLECTED"
  | "PROCESSING"
  | "REPORT_READY"
  | "CANCELLED";

function bookingsFrom(state: TrackPortalState): TrackBookingView[] {
  if (state.status === "verified" || state.status === "updated") return state.bookings;
  return [];
}

function phoneFrom(state: TrackPortalState): string {
  if ("phone" in state && state.phone) return state.phone;
  return "";
}

export function TrackForm({
  locale,
  initialPortal = idle,
}: {
  locale: Locale;
  initialPortal?: TrackPortalState;
}) {
  const t = useTranslations("track");
  const tCommon = useTranslations("common");

  const [requestState, requestAction, requestPending] = useActionState(
    requestTrackOtp,
    idle
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyTrackOtp,
    idle
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelBooking, idle);
  const [rescheduleState, rescheduleAction, reschedulePending] = useActionState(
    rescheduleBooking,
    idle
  );
  const [resendState, resendAction, resendPending] = useActionState(resendStatusSms, idle);
  const [signedOut, setSignedOut] = useState(false);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [appliedFocusId, setAppliedFocusId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);
  const [localPaid, setLocalPaid] = useState<Record<string, string>>({});

  const portalState: TrackPortalState = signedOut ? idle : initialPortal;

  const active: TrackPortalState =
    cancelState.status === "updated" || cancelState.status === "error"
      ? cancelState
      : rescheduleState.status === "updated"
        ? rescheduleState
        : resendState.status === "updated"
          ? resendState
          : verifyState.status === "verified" ||
              verifyState.status === "error" ||
              verifyState.status === "empty"
            ? verifyState
            : requestState.status === "otp_sent" ||
                requestState.status === "empty" ||
                requestState.status === "error"
              ? requestState
              : portalState;

  const listState: TrackPortalState =
    rescheduleState.status === "updated"
      ? rescheduleState
      : cancelState.status === "updated"
        ? cancelState
        : resendState.status === "updated"
          ? resendState
          : verifyState.status === "verified"
            ? verifyState
            : portalState.status === "verified"
              ? portalState
              : active;

  const bookings = bookingsFrom(listState);
  const sessionPhone = phoneFrom(listState) || phone;
  const otpSent =
    active.status === "otp_sent" ||
    (active.status === "error" && active.step === "otp") ||
    (requestState.status === "otp_sent" && verifyState.status !== "verified");

  const isVerified = bookings.length > 0 || listState.status === "updated";

  const focusBookingId =
    listState.status === "updated" ? listState.focusBookingId ?? null : null;
  if (focusBookingId && focusBookingId !== appliedFocusId) {
    setAppliedFocusId(focusBookingId);
    setExpandedId(focusBookingId);
  }

  if (isVerified) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{t("signedInAs")}</p>
            <p className="font-medium">{sessionPhone}</p>
          </div>
          <form
            action={async () => {
              await logoutPatientPortal();
              setSignedOut(true);
              setPhone("");
              setOtp("");
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="h-4 w-4" />
              {t("signOut")}
            </Button>
          </form>
        </div>

        {(listState.status === "updated") && (
          <p className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary" role="status">
            {t(
              listState.notice === "cancelled"
                ? "cancelledSuccess"
                : listState.notice === "rescheduled"
                  ? "rescheduledSuccess"
                  : "smsSentSuccess"
            )}
          </p>
        )}

        {(cancelState.status === "error" ||
          rescheduleState.status === "error") && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
            {t(
              ((cancelState.status === "error" && cancelState.errorMessage) ||
                (rescheduleState.status === "error" && rescheduleState.errorMessage) ||
                "errorInvalid") as
                | "errorInvalid"
                | "errorCannotCancel"
                | "errorCannotReschedule"
                | "errorRescheduleRequired"
                | "errorPastDate"
                | "errorSlotFull"
                | "errorSessionExpired"
            )}
          </p>
        )}

        <div>
          <h2 className="text-lg font-semibold">{t("historyTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("historySubtitle")}</p>
        </div>

        <div className="space-y-3">
          {bookings.map((booking) => {
            const expanded = expandedId === booking.id;
            const isCancelled = booking.status === "CANCELLED";
            const currentStep = statusStepIndex(booking.status);
            const paidTxn = localPaid[booking.id];
            const paymentStatus = paidTxn ? "PAID" : booking.paymentStatus;

            return (
              <Card key={booking.id} className="overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/40"
                  onClick={() => setExpandedId(expanded ? null : booking.id)}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={isCancelled ? "destructive" : "default"}>
                        {t(`statusValues.${booking.status as StatusKey}`)}
                      </Badge>
                      {booking.hasReport && (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          {t("reportReadyBadge")}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 font-medium">{booking.patientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(booking.createdAt, locale)} ·{" "}
                      {booking.items
                        .map((item) => item.name)
                        .slice(0, 2)
                        .join(", ")}
                      {booking.items.length > 2 ? "…" : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("staffRef")}: {booking.referenceCode}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-primary">
                    {formatCurrency(booking.estimatedTotal, locale)}
                  </span>
                </button>

                {expanded && (
                  <CardContent className="space-y-5 border-t bg-secondary/20 p-4">
                    {!isCancelled && (
                      <ol className="space-y-2" aria-label={t("timeline")}>
                        {STATUS_ORDER.map((step, index) => {
                          const done = currentStep >= index;
                          const current = currentStep === index;
                          return (
                            <li key={step} className="flex items-center gap-2 text-sm">
                              {done ? (
                                <CheckCircle2
                                  className={cn(
                                    "h-4 w-4",
                                    current ? "text-primary" : "text-primary/70"
                                  )}
                                  aria-hidden
                                />
                              ) : (
                                <Circle
                                  className="h-4 w-4 text-muted-foreground/40"
                                  aria-hidden
                                />
                              )}
                              <span className={cn(current && "font-semibold")}>
                                {t(`statusValues.${step}`)}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    )}

                    {isCancelled && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <XCircle className="h-4 w-4" aria-hidden />
                        {t("statusValues.CANCELLED")}
                      </div>
                    )}

                    <ul className="space-y-1 text-sm">
                      {booking.items.map((item) => (
                        <li
                          key={`${booking.id}-${item.name}-${item.price}`}
                          className="flex justify-between gap-3"
                        >
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(item.price, locale)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <p className="text-xs text-muted-foreground">
                      {booking.paymentMethod === "ONLINE"
                        ? t("paymentOnline", {
                            status: t(
                              `paymentStatus.${paymentStatus as "UNPAID" | "PENDING_ONLINE" | "PAID" | "WAIVED"}`
                            ),
                          })
                        : t("paymentCash")}
                    </p>

                    {!isCancelled && (
                      <p className="rounded-lg bg-background px-3 py-2 text-sm">
                        <span className="font-medium">{t("estimatedReady")}: </span>
                        {booking.estimatedReady}
                      </p>
                    )}

                    {booking.hasReport ? (
                      <a
                        href={
                          booking.downloadToken
                            ? `/api/reports/download?token=${encodeURIComponent(booking.downloadToken)}`
                            : `/api/reports/download?bookingId=${encodeURIComponent(booking.id)}`
                        }
                        className={buttonVariants({ className: "w-full" })}
                      >
                        <Download className="h-4 w-4" />
                        {t("downloadReport")}
                      </a>
                    ) : (
                      !isCancelled && (
                        <p className="text-sm text-muted-foreground">{t("reportPending")}</p>
                      )
                    )}

                    {booking.paymentMethod === "ONLINE" &&
                      !paidTxn &&
                      booking.paymentStatus === "PENDING_ONLINE" &&
                      isDemoPayment() &&
                      !isCancelled && (
                        <div className="space-y-3">
                          {payId !== booking.id ? (
                            <Button
                              type="button"
                              className="w-full"
                              onClick={() => setPayId(booking.id)}
                            >
                              {t("payNow")}
                            </Button>
                          ) : (
                            <DemoPaymentCheckout
                              referenceCode={booking.referenceCode}
                              phone={sessionPhone}
                              amount={booking.estimatedTotal}
                              locale={locale}
                              onPaid={(txn) => {
                                setLocalPaid((current) => ({
                                  ...current,
                                  [booking.id]: txn,
                                }));
                                setPayId(null);
                              }}
                              onSkip={() => setPayId(null)}
                            />
                          )}
                        </div>
                      )}

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <form action={resendAction} className="flex-1">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          className="w-full"
                          disabled={resendPending}
                        >
                          <MessageSquareText className="h-4 w-4" />
                          {resendPending ? tCommon("submitting") : t("resendSms")}
                        </Button>
                      </form>
                      <a
                        href={`tel:${siteConfig.contact.phones[0].replace(/\s/g, "")}`}
                        className={buttonVariants({
                          variant: "outline",
                          className: "flex-1",
                        })}
                      >
                        {tCommon("callUs")}
                      </a>
                    </div>

                    {booking.canCancel && (
                      <div className="space-y-3 border-t pt-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setRescheduleId(
                                rescheduleId === booking.id ? null : booking.id
                              )
                            }
                          >
                            {t("reschedule")}
                          </Button>
                          <form action={cancelAction}>
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <Button
                              type="submit"
                              variant="destructive"
                              size="sm"
                              disabled={cancelPending}
                            >
                              {cancelPending ? tCommon("submitting") : t("cancelBooking")}
                            </Button>
                          </form>
                        </div>

                        {rescheduleId === booking.id && (
                          <form
                            action={rescheduleAction}
                            className="grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-2"
                          >
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <div className="space-y-2">
                              <Label htmlFor={`date-${booking.id}`}>{t("newDate")}</Label>
                              <Input
                                id={`date-${booking.id}`}
                                name="preferredDate"
                                type="date"
                                required
                                min={todayDateInputValue()}
                                defaultValue={booking.preferredDate ?? undefined}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`time-${booking.id}`}>{t("newTime")}</Label>
                              <Select
                                name="preferredTime"
                                defaultValue={booking.preferredTime ?? undefined}
                                items={Object.fromEntries(
                                  TIME_SLOT_VALUES.map((slot) => [
                                    slot,
                                    labelTimeSlot(slot, locale),
                                  ]),
                                )}
                              >
                                <SelectTrigger
                                  id={`time-${booking.id}`}
                                  className="w-full bg-background"
                                >
                                  <SelectValue placeholder={t("newTime")} />
                                </SelectTrigger>
                                <SelectContent className="bg-background">
                                  {TIME_SLOT_VALUES.map((slot) => (
                                    <SelectItem key={slot} value={slot}>
                                      {labelTimeSlot(slot, locale)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              type="submit"
                              className="sm:col-span-2"
                              disabled={reschedulePending}
                            >
                              {reschedulePending
                                ? tCommon("submitting")
                                : t("confirmReschedule")}
                            </Button>
                          </form>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!otpSent ? (
        <form action={requestAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="flex justify-end">
            <DevAutofillButton onFill={() => setPhone(DEV_SAMPLE.phone)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={BD_PHONE_HINT}
              inputMode="tel"
              autoComplete="tel"
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">{t("phoneOnlyHelp")}</p>
          </div>
          <Button type="submit" className="w-full" disabled={requestPending}>
            {requestPending ? tCommon("submitting") : t("sendOtp")}
          </Button>
        </form>
      ) : (
        <form action={verifyAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="phone" value={phoneFrom(active) || phone} />
          <p className="rounded-lg bg-secondary/50 px-3 py-2 text-sm">
            {t("otpSentTo", { phone: phoneFrom(active) || phone })}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="otp">{t("otp")}</Label>
              <DevAutofillButton onFill={() => setOtp(DEV_SAMPLE.otp)} />
            </div>
            <Input
              id="otp"
              name="otp"
              inputMode="numeric"
              required
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="••••••"
              maxLength={6}
              autoComplete="one-time-code"
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              {isDevToolsEnabled() ? t("otpDevBypassHelp") : t("otpHelp")}
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={verifyPending}>
            {verifyPending ? tCommon("submitting") : t("verifyOtp")}
          </Button>
          <Button
            type="submit"
            formAction={requestAction}
            variant="ghost"
            className="w-full"
            disabled={requestPending}
          >
            {t("resendOtp")}
          </Button>
          <button
            type="button"
            className="w-full text-center text-xs text-muted-foreground underline"
            onClick={() => {
              setOtp("");
              window.location.reload();
            }}
          >
            {t("changePhone")}
          </button>
        </form>
      )}

      {active.status === "empty" && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {t("noHistory")}
        </p>
      )}

      {active.status === "error" && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
          {t(
            active.errorMessage as
              | "errorPhoneInvalid"
              | "errorOtpInvalid"
              | "errorOtpExpired"
              | "errorOtpLocked"
              | "errorOtpCooldown"
          )}
        </p>
      )}
    </div>
  );
}
