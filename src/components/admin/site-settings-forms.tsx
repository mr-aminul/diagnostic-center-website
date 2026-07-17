"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Palette, Phone, ToggleLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ColorField } from "@/components/admin/color-field";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import type { CmsSiteSettings } from "@/lib/cms/types";
import {
  updateBrandingSettings,
  updateContactSettings,
  updateFeatureSettings,
} from "@/app/admin/(protected)/settings/site-actions";
import type { EntityFormState } from "@/components/admin/entity-form-dialog";
import { cn } from "@/lib/utils";

const idle: EntityFormState = { status: "idle" };

type SettingsSection = "account" | "branding" | "contact" | "features";

const SECTIONS: {
  id: SettingsSection;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}[] = [
  {
    id: "account",
    label: "Account",
    description: "Password for your login",
    icon: KeyRound,
  },
  {
    id: "branding",
    label: "Branding",
    description: "Name, copy, and theme colors",
    icon: Palette,
    adminOnly: true,
  },
  {
    id: "contact",
    label: "Contact",
    description: "Phones, hours, social links, and SEO",
    icon: Phone,
    adminOnly: true,
  },
  {
    id: "features",
    label: "Features",
    description: "Site modules and payment provider",
    icon: ToggleLeft,
    adminOnly: true,
  },
];

function useActionToast(state: EntityFormState) {
  useEffect(() => {
    if (state.status === "success") toast.success("Saved.");
    if (state.status === "error" && state.error) toast.error(state.error);
  }, [state]);
}

function parseSection(value: string | null, isAdmin: boolean): SettingsSection {
  if (value === "account") return "account";
  if (isAdmin && (value === "branding" || value === "contact" || value === "features")) {
    return value;
  }
  return isAdmin ? "branding" : "account";
}

export function SiteSettingsForms({
  settings,
  isAdmin,
}: {
  settings: CmsSiteSettings;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sectionFromUrl = parseSection(searchParams.get("section"), isAdmin);
  const [section, setSection] = useState<SettingsSection>(sectionFromUrl);

  useEffect(() => {
    setSection(sectionFromUrl);
  }, [sectionFromUrl]);

  const visibleSections = SECTIONS.filter((item) => !item.adminOnly || isAdmin);

  function selectSection(next: SettingsSection) {
    setSection(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const active = visibleSections.find((item) => item.id === section) ?? visibleSections[0];

  return (
    <div className="space-y-6">
      <nav aria-label="Settings sections" className="border-b">
        <div className="-mb-px flex gap-1 overflow-x-auto">
          {visibleSections.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === active.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectSection(item.id)}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-opacity",
                    isActive ? "bg-foreground opacity-100" : "opacity-0",
                  )}
                />
              </button>
            );
          })}
        </div>
      </nav>

      <div className="max-w-3xl space-y-1">
        <h2 className="text-base font-medium">{active.label}</h2>
        <p className="text-sm text-muted-foreground">{active.description}</p>
      </div>

      <div className="max-w-3xl">
        {active.id === "account" ? <AccountPanel /> : null}
        {active.id === "branding" && isAdmin ? <BrandingForm settings={settings} /> : null}
        {active.id === "contact" && isAdmin ? <ContactForm settings={settings} /> : null}
        {active.id === "features" && isAdmin ? <FeaturesForm settings={settings} /> : null}
      </div>
    </div>
  );
}

function SettingsPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6">
      <div className="mb-4">
        <h3 className="text-sm font-medium">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FormActions({ pending, label }: { pending: boolean; label: string }) {
  return (
    <div className="flex items-center justify-end pt-1">
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : label}
      </Button>
    </div>
  );
}

function AccountPanel() {
  return (
    <SettingsPanel
      title="Change password"
      description="Use at least 8 characters. You’ll stay signed in after updating."
    >
      <ChangePasswordForm />
    </SettingsPanel>
  );
}

function BrandingForm({ settings }: { settings: CmsSiteSettings }) {
  const [state, action, pending] = useActionState(updateBrandingSettings, idle);
  useActionToast(state);
  const { branding } = settings;

  return (
    <form action={action} className="space-y-4">
      <SettingsPanel
        title="Identity"
        description="Center name and logo shown across the public site."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Center name</Label>
            <Input id="name" name="name" required defaultValue={branding.name} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortName">Short name</Label>
            <Input
              id="shortName"
              name="shortName"
              required
              defaultValue={branding.shortName}
              maxLength={60}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="logoSrc">Logo path</Label>
            <Input id="logoSrc" name="logoSrc" required defaultValue={branding.logo.src} />
            <p className="text-xs text-muted-foreground">Public path, e.g. /logo.png</p>
          </div>
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Messaging"
        description="Tagline and description for the home page and SEO defaults."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="taglineEn">Tagline (English)</Label>
            <Input id="taglineEn" name="taglineEn" required defaultValue={branding.tagline.en} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taglineBn">Tagline (Bangla)</Label>
            <Input id="taglineBn" name="taglineBn" defaultValue={branding.tagline.bn} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descriptionEn">Description (English)</Label>
            <Textarea
              id="descriptionEn"
              name="descriptionEn"
              required
              rows={3}
              defaultValue={branding.description.en}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descriptionBn">Description (Bangla)</Label>
            <Textarea
              id="descriptionBn"
              name="descriptionBn"
              rows={3}
              defaultValue={branding.description.bn}
            />
          </div>
        </div>
      </SettingsPanel>

      <SettingsPanel title="Theme" description="Colors and corner radius for the public site.">
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            id="primary"
            name="primary"
            label="Primary color"
            defaultValue={branding.theme.primary}
          />
          <ColorField
            id="secondary"
            name="secondary"
            label="Secondary color"
            defaultValue={branding.theme.secondary}
          />
          <ColorField
            id="accent"
            name="accent"
            label="Accent color"
            defaultValue={branding.theme.accent}
          />
          <div className="space-y-2">
            <Label htmlFor="radius">Border radius</Label>
            <Input id="radius" name="radius" required defaultValue={branding.theme.radius} />
            <p className="text-xs text-muted-foreground">CSS length, e.g. 0.625rem</p>
          </div>
        </div>
      </SettingsPanel>

      <FormActions pending={pending} label="Save branding" />
    </form>
  );
}

function ContactForm({ settings }: { settings: CmsSiteSettings }) {
  const [state, action, pending] = useActionState(updateContactSettings, idle);
  useActionToast(state);
  const { contact, seo } = settings;

  return (
    <form action={action} className="space-y-4">
      <SettingsPanel
        title="Reach us"
        description="Shown in the header, footer, and contact page."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="phones">Phones</Label>
            <Textarea
              id="phones"
              name="phones"
              required
              rows={2}
              defaultValue={contact.phones.join("\n")}
              placeholder="One number per line"
            />
            <p className="text-xs text-muted-foreground">Comma or new line separated.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" required defaultValue={contact.whatsapp} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required defaultValue={contact.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hoursEn">Hours (English)</Label>
            <Input id="hoursEn" name="hoursEn" required defaultValue={contact.hours.en} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hoursBn">Hours (Bangla)</Label>
            <Input id="hoursBn" name="hoursBn" defaultValue={contact.hours.bn} />
          </div>
        </div>
      </SettingsPanel>

      <SettingsPanel title="Social links" description="Leave a field blank to hide that network.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook URL</Label>
            <Input id="facebook" name="facebook" defaultValue={contact.social.facebook ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtube">YouTube URL</Label>
            <Input id="youtube" name="youtube" defaultValue={contact.social.youtube ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input id="linkedin" name="linkedin" defaultValue={contact.social.linkedin ?? ""} />
          </div>
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Search engines"
        description="Extra keywords for meta tags. Page titles still come from each page."
      >
        <div className="space-y-2">
          <Label htmlFor="keywords">SEO keywords</Label>
          <Textarea
            id="keywords"
            name="keywords"
            rows={2}
            defaultValue={seo.keywords.join(", ")}
            placeholder="diagnostic, pathology, ultrasound"
          />
          <p className="text-xs text-muted-foreground">Comma separated.</p>
        </div>
      </SettingsPanel>

      <FormActions pending={pending} label="Save contact" />
    </form>
  );
}

const FEATURE_TOGGLES = [
  {
    key: "homeCollection" as const,
    label: "Home sample collection",
    description: "Public home-collection page and booking option.",
  },
  {
    key: "multiBranch" as const,
    label: "Multi-branch mode",
    description: "Let patients pick a branch when booking.",
  },
  {
    key: "onlinePayment" as const,
    label: "Online payment",
    description: "Offer pay-now checkout on bookings.",
  },
  {
    key: "testimonials" as const,
    label: "Testimonials",
    description: "Show the testimonials section on the home page.",
  },
  {
    key: "doctorsPage" as const,
    label: "Doctors & appointments",
    description: "Doctors directory and appointment booking.",
  },
];

function FeaturesForm({ settings }: { settings: CmsSiteSettings }) {
  const [state, action, pending] = useActionState(updateFeatureSettings, idle);
  useActionToast(state);
  const { features, payment } = settings;

  return (
    <form action={action} className="space-y-4">
      <SettingsPanel
        title="Site modules"
        description="Turn pages and flows on or off without removing content."
      >
        <ul className="divide-y rounded-lg border">
          {FEATURE_TOGGLES.map((item) => (
            <li key={item.key}>
              <label className="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                <Checkbox
                  name={item.key}
                  value="on"
                  defaultChecked={features[item.key]}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </SettingsPanel>

      <SettingsPanel
        title="Payment"
        description="Provider used when online payment is enabled."
      >
        <div className="max-w-xs space-y-2">
          <Label htmlFor="paymentProvider">Payment provider</Label>
          <select
            id="paymentProvider"
            name="paymentProvider"
            defaultValue={payment.provider}
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="demo">Demo checkout</option>
            <option value="live">Live gateway</option>
          </select>
        </div>
      </SettingsPanel>

      <FormActions pending={pending} label="Save features" />
    </form>
  );
}
