"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, CreditCard, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  confirmDemoPayment,
  type DemoPaymentState,
} from "@/app/[locale]/pay/actions";
import { formatCurrency } from "@/lib/format";
import { BD_PHONE_HINT } from "@/lib/phone";
import type { Locale } from "@/config/site";
import { cn } from "@/lib/utils";
import { DEV_SAMPLE, demoDefault, isDevToolsEnabled } from "@/lib/dev-tools";

type PayMethod = "bkash" | "nagad" | "card";
type Step = "method" | "details" | "processing" | "done";

const initialState: DemoPaymentState = { status: "idle" };

const METHODS: {
  id: PayMethod;
  color: string;
  icon: typeof Smartphone;
}[] = [
  { id: "bkash", color: "bg-[#E2136E]/10 text-[#E2136E] border-[#E2136E]/30", icon: Smartphone },
  { id: "nagad", color: "bg-[#F68712]/10 text-[#F68712] border-[#F68712]/30", icon: Smartphone },
  { id: "card", color: "bg-slate-100 text-slate-700 border-slate-300", icon: CreditCard },
];

export function DemoPaymentCheckout({
  referenceCode,
  phone,
  amount,
  locale,
  onPaid,
  onSkip,
}: {
  referenceCode: string;
  phone: string;
  amount: number;
  locale: Locale;
  onPaid?: (transactionId: string) => void;
  onSkip?: () => void;
}) {
  const t = useTranslations("payment");
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [walletPhone, setWalletPhone] = useState(
    () => phone || (isDevToolsEnabled() ? DEV_SAMPLE.phone : ""),
  );
  const [pin, setPin] = useState(() =>
    isDevToolsEnabled() ? DEV_SAMPLE.walletPin : "",
  );
  const [state, formAction, isPending] = useActionState(confirmDemoPayment, initialState);

  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.status === "success" && state.transactionId) {
      setStep("done");
      onPaid?.(state.transactionId);
    } else if (state.status === "error") {
      setStep("details");
    }
  }

  function chooseMethod(next: PayMethod) {
    setMethod(next);
    setStep("details");
  }

  if (step === "done" && state.transactionId) {
    return (
      <Card className="animate-in fade-in zoom-in-95 border-primary/30">
        <CardContent className="space-y-4 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-6 w-6" />
          </div>
          <Badge variant="secondary">{t("demoBadge")}</Badge>
          <h3 className="text-lg font-semibold">{t("successTitle")}</h3>
          <p className="text-sm text-muted-foreground">{t("successBody")}</p>
          <p className="rounded-lg bg-secondary/50 px-3 py-2 font-mono text-sm">
            {state.transactionId}
          </p>
          <p className="text-sm font-medium text-primary">
            {formatCurrency(amount, locale)} · {t(`methods.${method ?? "bkash"}`)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      <div className="border-b bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900">
        {t("demoBanner")}
      </div>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground">{t("checkoutTitle")}</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(amount, locale)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("forBooking")} {referenceCode}
            </p>
          </div>
          <Badge variant="outline">{t("demoBadge")}</Badge>
        </div>

        {step === "method" && (
          <div className="space-y-3">
            <p className="text-sm font-medium">{t("chooseMethod")}</p>
            <div className="grid gap-2">
              {METHODS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => chooseMethod(item.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted/50",
                      item.color
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    <span className="font-medium">{t(`methods.${item.id}`)}</span>
                  </button>
                );
              })}
            </div>
            {onSkip && (
              <Button type="button" variant="ghost" className="w-full" onClick={onSkip}>
                {t("payLater")}
              </Button>
            )}
          </div>
        )}

        {step === "details" && method && (
          <form
            action={(formData) => {
              setStep("processing");
              formAction(formData);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="referenceCode" value={referenceCode} />
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="method" value={method} />

            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => setStep("method")}
            >
              {t("changeMethod")}
            </button>

            <p className="text-sm font-medium">{t(`methods.${method}`)}</p>

            {method !== "card" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="walletPhone">{t("walletPhone")}</Label>
                  <Input
                    id="walletPhone"
                    value={walletPhone}
                    onChange={(event) => setWalletPhone(event.target.value)}
                    placeholder={BD_PHONE_HINT}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin">{t("walletPin")}</Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(event) => setPin(event.target.value)}
                    placeholder="••••"
                    required
                    minLength={4}
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">{t("demoPinHelp")}</p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">{t("cardNumber")}</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="4111 1111 1111 1111"
                    required
                    inputMode="numeric"
                    defaultValue={demoDefault(DEV_SAMPLE.cardNumber)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">{t("cardExpiry")}</Label>
                    <Input
                      id="expiry"
                      name="expiry"
                      placeholder="MM/YY"
                      required
                      defaultValue={demoDefault(DEV_SAMPLE.cardExpiry)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">{t("cardCvc")}</Label>
                    <Input
                      id="cvc"
                      name="cvc"
                      placeholder="123"
                      required
                      maxLength={4}
                      defaultValue={demoDefault(DEV_SAMPLE.cardCvc)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t("demoCardHelp")}</p>
              </>
            )}

            {state.status === "error" && state.errorMessage && (
              <p className="text-sm text-destructive" role="alert">
                {state.errorMessage}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {t("confirmPay", { amount: formatCurrency(amount, locale) })}
            </Button>
          </form>
        )}

        {(step === "processing" || isPending) && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            <p className="font-medium">{t("processing")}</p>
            <p className="text-sm text-muted-foreground">{t("processingHelp")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
