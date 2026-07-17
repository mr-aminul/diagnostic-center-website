"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { checkboxOn, csvLines, localizedFromForm } from "@/lib/cms/form";
import { getCmsSettings, upsertCmsSettings } from "@/lib/data/site-settings";
import type { EntityFormState } from "@/components/admin/entity-form-dialog";

function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

function revalidateSite() {
  updateTag("site-settings");
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/content/about");
  revalidatePath("/admin/content/home-collection");
}

export async function updateBrandingSettings(
  _previousState: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  await requireAdmin();
  const current = await getCmsSettings();

  const parsed = z
    .object({
      name: z.string().trim().min(1).max(120),
      shortName: z.string().trim().min(1).max(60),
      primary: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex color like #047857."),
      secondary: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex color like #ecfdf5."),
      accent: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex color like #059669."),
      radius: z.string().trim().min(1).max(20),
      logoSrc: z.string().trim().min(1).max(200),
    })
    .safeParse({
      name: formData.get("name"),
      shortName: formData.get("shortName"),
      primary: formData.get("primary"),
      secondary: formData.get("secondary"),
      accent: formData.get("accent"),
      radius: formData.get("radius"),
      logoSrc: formData.get("logoSrc"),
    });

  if (!parsed.success) return { status: "error", error: firstZodError(parsed.error) };

  const tagline = localizedFromForm(formData, "taglineEn", "taglineBn");
  const description = localizedFromForm(formData, "descriptionEn", "descriptionBn");
  if (!tagline.en || !description.en) {
    return { status: "error", error: "English tagline and description are required." };
  }

  await upsertCmsSettings({
    ...current,
    branding: {
      ...current.branding,
      name: parsed.data.name,
      shortName: parsed.data.shortName,
      tagline,
      description,
      logo: { ...current.branding.logo, src: parsed.data.logoSrc },
      theme: {
        primary: parsed.data.primary,
        secondary: parsed.data.secondary,
        accent: parsed.data.accent,
        radius: parsed.data.radius,
      },
    },
  });

  revalidateSite();
  return { status: "success" };
}

export async function updateContactSettings(
  _previousState: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  await requireAdmin();
  const current = await getCmsSettings();

  const phones = csvLines(String(formData.get("phones") ?? ""));
  const email = String(formData.get("email") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const hours = localizedFromForm(formData, "hoursEn", "hoursBn");
  const facebook = String(formData.get("facebook") ?? "").trim() || undefined;
  const youtube = String(formData.get("youtube") ?? "").trim() || undefined;
  const linkedin = String(formData.get("linkedin") ?? "").trim() || undefined;
  const keywords = csvLines(String(formData.get("keywords") ?? ""));

  if (phones.length === 0 || !email || !whatsapp || !hours.en) {
    return { status: "error", error: "Phones, WhatsApp, email, and English hours are required." };
  }

  await upsertCmsSettings({
    ...current,
    contact: {
      phones,
      whatsapp,
      email,
      hours,
      social: { facebook, youtube, linkedin },
    },
    seo: { keywords: keywords.length > 0 ? keywords : current.seo.keywords },
  });

  revalidateSite();
  return { status: "success" };
}

export async function updateFeatureSettings(
  _previousState: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  await requireAdmin();
  const current = await getCmsSettings();
  const provider = String(formData.get("paymentProvider") ?? "demo");
  if (provider !== "demo" && provider !== "live") {
    return { status: "error", error: "Invalid payment provider." };
  }

  await upsertCmsSettings({
    ...current,
    features: {
      homeCollection: checkboxOn(formData, "homeCollection"),
      multiBranch: checkboxOn(formData, "multiBranch"),
      onlinePayment: checkboxOn(formData, "onlinePayment"),
      testimonials: checkboxOn(formData, "testimonials"),
      doctorsPage: checkboxOn(formData, "doctorsPage"),
    },
    payment: { provider },
  });

  revalidateSite();
  return { status: "success" };
}
