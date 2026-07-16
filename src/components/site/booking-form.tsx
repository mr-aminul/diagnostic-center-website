"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Search, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import { createBooking, type BookingFormState } from "@/app/[locale]/book/actions";
import { formatCurrency } from "@/lib/format";
import { BD_PHONE_HINT } from "@/lib/phone";
import {
  TIME_SLOT_VALUES,
  labelTimeSlot,
  todayDateInputValue,
} from "@/lib/time-slots";
import { isDemoPayment } from "@/lib/payment";
import { DemoPaymentCheckout } from "@/components/site/demo-payment-checkout";
import { DevAutofillButton } from "@/components/site/dev-autofill-button";
import { DEV_SAMPLE } from "@/lib/dev-tools";
import { siteConfig, type Locale } from "@/config/site";
import { cn } from "@/lib/utils";

interface PickableItem {
  type: "test" | "package";
  id: string;
  name: string;
  nameBn: string | null;
  price: number;
  preparation?: string | null;
  preparationBn?: string | null;
}

interface BranchOption {
  id: string;
  name: string;
  nameBn: string | null;
}

const initialState: BookingFormState = { status: "idle" };

export function BookingForm({
  tests,
  packages,
  branches,
  locale,
  defaultCollectionType,
  defaultPackageId,
  defaultTestId,
  defaultDoctorId,
  defaultDoctorName,
}: {
  tests: PickableItem[];
  packages: PickableItem[];
  branches: BranchOption[];
  locale: Locale;
  defaultCollectionType: "IN_CENTER" | "HOME";
  defaultPackageId?: string;
  defaultTestId?: string;
  defaultDoctorId?: string;
  defaultDoctorName?: string;
}) {
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");

  const [state, formAction, isPending] = useActionState(createBooking, initialState);
  const [collectionType, setCollectionType] = useState<"IN_CENTER" | "HOME">(
    defaultCollectionType
  );
  const [search, setSearch] = useState("");
  const [showBrowse, setShowBrowse] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "ONLINE">("CASH");
  const [copied, setCopied] = useState(false);
  const [showDemoPay, setShowDemoPay] = useState(true);
  const [paidTxn, setPaidTxn] = useState<string | null>(null);
  const [selected, setSelected] = useState<PickableItem[]>(() => {
    const items: PickableItem[] = [];
    if (defaultPackageId) {
      const pkg = packages.find((item) => item.id === defaultPackageId);
      if (pkg) items.push(pkg);
    }
    if (defaultTestId) {
      const test = tests.find((item) => item.id === defaultTestId);
      if (test) items.push(test);
    }
    return items;
  });

  const allItems = useMemo(() => [...packages, ...tests], [packages, tests]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const query = search.trim().toLowerCase();
    return allItems
      .filter((item) => !selected.some((s) => s.id === item.id && s.type === item.type))
      .filter((item) => `${item.name} ${item.nameBn ?? ""}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [allItems, search, selected]);

  const browseItems = useMemo(() => {
    return allItems
      .filter((item) => !selected.some((s) => s.id === item.id && s.type === item.type))
      .slice(0, 24);
  }, [allItems, selected]);

  const total = selected.reduce((sum, item) => sum + item.price, 0);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.status === "success") {
      setSelected([]);
      setSearch("");
    }
  }

  function addItem(item: PickableItem) {
    setSelected((current) => [...current, item]);
    setSearch("");
  }

  function removeItem(item: PickableItem) {
    setSelected((current) =>
      current.filter((s) => !(s.id === item.id && s.type === item.type))
    );
  }

  function itemLabel(item: PickableItem) {
    return locale === "bn" && item.nameBn ? item.nameBn : item.name;
  }

  async function copyReference() {
    if (!state.referenceCode) return;
    try {
      await navigator.clipboard.writeText(state.referenceCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (state.status === "success" && state.referenceCode) {
    const whatsappText = encodeURIComponent(
      `My booking reference at ${siteConfig.shortName} is ${state.referenceCode}`
    );
    const whatsappHref = `https://wa.me/${siteConfig.contact.whatsapp.replace(/[^\d]/g, "")}?text=${whatsappText}`;

    return (
      <Card className="mx-auto max-w-lg animate-in fade-in zoom-in-95 duration-500">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">{t("successTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("successBody")}</p>
          <p className="mt-4 rounded-lg border-2 border-dashed border-primary bg-primary/5 py-4 text-3xl font-bold tracking-wider text-primary">
            {state.referenceCode}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyReference}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t("copied") : t("copyCode")}
            </Button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("shareWhatsapp")}
            </a>
            <Link href="/patient-portal" className={buttonVariants({ size: "sm" })}>
              {t("goToTrack")}
            </Link>
          </div>

          <ol className="mt-6 space-y-2 text-left text-sm text-muted-foreground">
            <li>1. {t("nextStepSms")}</li>
            <li>2. {t("nextStepVisit")}</li>
            <li>3. {t("nextStepTrack")}</li>
          </ol>

          {typeof state.estimatedTotal === "number" && (
            <p className="mt-4 text-sm">
              {t("amountDue")}:{" "}
              <span className="font-semibold text-primary">
                {formatCurrency(state.estimatedTotal, locale)}
              </span>
              {" — "}
              {paidTxn
                ? t("paymentCompleted")
                : state.paymentMethod === "ONLINE"
                  ? t("paymentPendingOnline")
                  : t("payAtCenter")}
            </p>
          )}

          {state.paymentMethod === "ONLINE" &&
            isDemoPayment() &&
            showDemoPay &&
            !paidTxn &&
            typeof state.estimatedTotal === "number" &&
            state.patientPhone && (
              <div className="mt-6 text-left">
                <DemoPaymentCheckout
                  referenceCode={state.referenceCode}
                  phone={state.patientPhone}
                  amount={state.estimatedTotal}
                  locale={locale}
                  onPaid={(txn) => setPaidTxn(txn)}
                  onSkip={() => setShowDemoPay(false)}
                />
              </div>
            )}

          {paidTxn && (
            <p className="mt-4 rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">
              {t("demoPaidNote", { txn: paidTxn })}
            </p>
          )}

          {state.preparations && state.preparations.length > 0 && (
            <div className="mt-4 rounded-lg border bg-secondary/40 p-4 text-left text-sm">
              <p className="font-semibold text-foreground">{t("prepTitle")}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                {state.preparations.map((prep) => (
                  <li key={prep}>{prep}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 text-sm text-muted-foreground">{t("successHelp")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-8" data-dev-form="booking">
      <div className="flex justify-end">
        <DevAutofillButton
          onFill={() => {
            const pick = tests[0] ?? packages[0];
            if (pick) setSelected([pick]);
            setCollectionType("IN_CENTER");
            setPaymentMethod("CASH");
            queueMicrotask(() => {
              const form = document.querySelector<HTMLFormElement>('[data-dev-form="booking"]');
              if (!form) return;
              setField(form, "patientName", DEV_SAMPLE.patientName);
              setField(form, "phone", DEV_SAMPLE.phone);
              setField(form, "age", DEV_SAMPLE.age);
              setField(form, "notes", DEV_SAMPLE.notes);
              setField(form, "preferredDate", todayDateInputValue());
            });
          }}
        />
      </div>
      <input type="hidden" name="collectionType" value={collectionType} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      {defaultDoctorId && <input type="hidden" name="doctorId" value={defaultDoctorId} />}
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(selected.map((item) => ({ type: item.type, id: item.id })))}
      />

      {defaultDoctorName && (
        <p className="rounded-lg border bg-secondary/40 px-4 py-3 text-sm">
          {t("doctorNote", { name: defaultDoctorName })}
        </p>
      )}

      <section>
        <Label className="mb-3 block">{t("collectionType")}</Label>
        <RadioGroup
          value={collectionType}
          onValueChange={(value) => setCollectionType(value as "IN_CENTER" | "HOME")}
          className="grid gap-3 sm:grid-cols-2"
        >
          <Label
            htmlFor="collection-in-center"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
          >
            <RadioGroupItem value="IN_CENTER" id="collection-in-center" />
            {t("collectionInCenter")}
          </Label>
          <Label
            htmlFor="collection-home"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
          >
            <RadioGroupItem value="HOME" id="collection-home" />
            {t("collectionHome")}
          </Label>
        </RadioGroup>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <Label htmlFor="test-search">{t("selectTests")}</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowBrowse((value) => !value)}
          >
            {showBrowse ? t("hideBrowse") : t("browseAll")}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="test-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchTests")}
            aria-label={t("searchTests")}
            className="pl-9"
            autoComplete="off"
          />
          {searchResults.length > 0 && (
            <div
              role="listbox"
              className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95"
            >
              {searchResults.map((item) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  key={`${item.type}-${item.id}`}
                  onClick={() => addItem(item)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span>
                    <Badge variant="outline" className="mr-2 text-[10px]">
                      {item.type === "package" ? t("typePackage") : t("typeTest")}
                    </Badge>
                    {itemLabel(item)}
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(item.price, locale)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {showBrowse && (
          <div className="mt-3 grid max-h-72 gap-2 overflow-auto rounded-lg border p-3 sm:grid-cols-2">
            {browseItems.map((item) => (
              <button
                type="button"
                key={`browse-${item.type}-${item.id}`}
                onClick={() => addItem(item)}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="line-clamp-1">{itemLabel(item)}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatCurrency(item.price, locale)}
                </span>
              </button>
            ))}
          </div>
        )}

        {selected.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {t("selectedItems")}
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.map((item) => (
                <Badge
                  key={`${item.type}-${item.id}`}
                  variant="secondary"
                  className="gap-1.5 py-1.5"
                >
                  {itemLabel(item)}
                  <span className="text-muted-foreground">
                    {formatCurrency(item.price, locale)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    aria-label={t("removeItem")}
                    className="ml-1 rounded-full hover:bg-background/60"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="patientName">{t("patientName")}</Label>
          <Input id="patientName" name="patientName" required maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t("patientPhone")}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            maxLength={20}
            placeholder={BD_PHONE_HINT}
            inputMode="tel"
          />
          <p className="text-xs text-muted-foreground">{t("phoneHelp")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">
            {t("patientAge")}{" "}
            <span className="font-normal text-muted-foreground">({tCommon("optional")})</span>
          </Label>
          <Input id="age" name="age" type="number" min={0} max={130} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">
            {t("patientGender")}{" "}
            <span className="font-normal text-muted-foreground">({tCommon("optional")})</span>
          </Label>
          <Select
            name="gender"
            items={{
              MALE: t("genderMale"),
              FEMALE: t("genderFemale"),
              OTHER: t("genderOther"),
            }}
          >
            <SelectTrigger id="gender" className="w-full">
              <SelectValue placeholder={t("selectOptional")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">{t("genderMale")}</SelectItem>
              <SelectItem value="FEMALE">{t("genderFemale")}</SelectItem>
              <SelectItem value="OTHER">{t("genderOther")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {branches.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor="branchId">{t("branch")}</Label>
            <Select
              name="branchId"
              defaultValue={branches[0]?.id}
              items={Object.fromEntries(
                branches.map((branch) => [
                  branch.id,
                  locale === "bn" && branch.nameBn ? branch.nameBn : branch.name,
                ]),
              )}
            >
              <SelectTrigger id="branchId" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {locale === "bn" && branch.nameBn ? branch.nameBn : branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {branches.length === 1 && (
          <input type="hidden" name="branchId" value={branches[0].id} />
        )}

        <div className="space-y-2">
          <Label htmlFor="preferredDate">
            {t("preferredDate")}{" "}
            <span className="font-normal text-muted-foreground">({tCommon("optional")})</span>
          </Label>
          <Input
            id="preferredDate"
            name="preferredDate"
            type="date"
            min={todayDateInputValue()}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredTime">
            {t("preferredTime")}{" "}
            <span className="font-normal text-muted-foreground">({tCommon("optional")})</span>
          </Label>
          <Select
            name="preferredTime"
            items={Object.fromEntries(
              TIME_SLOT_VALUES.map((slot) => [slot, labelTimeSlot(slot, locale)]),
            )}
          >
            <SelectTrigger id="preferredTime" className="w-full">
              <SelectValue placeholder={t("selectOptional")} />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOT_VALUES.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {labelTimeSlot(slot, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {collectionType === "HOME" && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">{t("address")}</Label>
            <Textarea id="address" name="address" required rows={3} maxLength={300} />
            <p className="text-xs text-muted-foreground">{t("addressHelp")}</p>
          </div>
        )}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">
            {t("notes")}{" "}
            <span className="font-normal text-muted-foreground">({tCommon("optional")})</span>
          </Label>
          <Textarea id="notes" name="notes" rows={2} maxLength={500} />
        </div>
      </section>

      <section>
        <Label className="mb-3 block">{t("paymentMethod")}</Label>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as "CASH" | "ONLINE")}
          className={cn(
            "grid gap-3",
            siteConfig.features.onlinePayment ? "sm:grid-cols-2" : "grid-cols-1"
          )}
        >
          <Label
            htmlFor="pay-cash"
            className="flex flex-col gap-1 rounded-lg border p-4 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
          >
            <span className="flex items-center gap-3">
              <RadioGroupItem value="CASH" id="pay-cash" />
              {t("payCash")}
            </span>
            <span className="pl-7 text-xs text-muted-foreground">{t("payCashHelp")}</span>
          </Label>
          {siteConfig.features.onlinePayment && (
            <Label
              htmlFor="pay-online"
              className="flex flex-col gap-1 rounded-lg border p-4 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
            >
              <span className="flex items-center gap-3">
                <RadioGroupItem value="ONLINE" id="pay-online" />
                {t("payOnline")}
              </span>
              <span className="pl-7 text-xs text-muted-foreground">{t("payOnlineHelp")}</span>
            </Label>
          )}
        </RadioGroup>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {t("estimatedTotal")}
          </p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(total, locale)}</p>
          <p className="text-xs text-muted-foreground">{t("payAtCenter")}</p>
        </div>
        <Button type="submit" size="lg" disabled={isPending || selected.length === 0}>
          {isPending ? tCommon("submitting") : t("submit")}
        </Button>
      </section>

      {state.status === "error" && state.errorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {t(
            state.errorMessage as
              | "errorEmptyTests"
              | "errorAddressRequired"
              | "errorPastDate"
              | "errorPhoneInvalid"
              | "errorSlotFull"
              | "generic"
          )}
        </p>
      )}
    </form>
  );
}

function setField(form: HTMLFormElement, name: string, value: string) {
  const element = form.elements.namedItem(name);
  if (
    !(
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    )
  ) {
    return;
  }
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}
