"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactForm, type ContactFormState } from "@/app/[locale]/contact/actions";
import { BD_PHONE_HINT } from "@/lib/phone";
import { DEV_SAMPLE, demoDefault } from "@/lib/dev-tools";

const initialState: ContactFormState = { status: "idle" };

export function ContactForm() {
  const t = useTranslations("contact");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(t("formSuccess"));
    } else if (state.status === "error") {
      toast.error(t("formError"));
    }
  }, [state.status, t]);

  if (state.status === "success") {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-xl border bg-primary/5 p-8 text-center animate-in fade-in zoom-in-95"
        role="status"
      >
        <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden />
        <p className="font-semibold">{t("formSuccessTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("formSuccess")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("formName")}</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={100}
          defaultValue={demoDefault(DEV_SAMPLE.contactName)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{t("formPhone")}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          maxLength={20}
          placeholder={BD_PHONE_HINT}
          inputMode="tel"
          defaultValue={demoDefault(DEV_SAMPLE.phone)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">{t("formMessage")}</Label>
        <Textarea
          id="message"
          name="message"
          required
          rows={4}
          maxLength={1000}
          defaultValue={demoDefault(DEV_SAMPLE.contactMessage)}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? tCommon("submitting") : tCommon("submit")}
      </Button>
    </form>
  );
}
