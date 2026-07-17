"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { localizedFromForm } from "@/lib/cms/form";
import { getCmsSettings, upsertCmsSettings } from "@/lib/data/site-settings";
import type { EntityFormState } from "@/components/admin/entity-form-dialog";

const STEP_KEYS = ["book", "confirm", "collect", "report"] as const;

export async function updateHomeCollectionContent(
  _previousState: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  await requireAdmin();
  const current = await getCmsSettings();

  const homeCollection = {
    title: localizedFromForm(formData, "titleEn", "titleBn"),
    subtitle: localizedFromForm(formData, "subtitleEn", "subtitleBn"),
    howItWorksTitle: localizedFromForm(formData, "howItWorksTitleEn", "howItWorksTitleBn"),
    cta: localizedFromForm(formData, "ctaEn", "ctaBn"),
    steps: {
      book: {
        title: localizedFromForm(formData, "stepBookTitleEn", "stepBookTitleBn"),
        desc: localizedFromForm(formData, "stepBookDescEn", "stepBookDescBn"),
      },
      confirm: {
        title: localizedFromForm(formData, "stepConfirmTitleEn", "stepConfirmTitleBn"),
        desc: localizedFromForm(formData, "stepConfirmDescEn", "stepConfirmDescBn"),
      },
      collect: {
        title: localizedFromForm(formData, "stepCollectTitleEn", "stepCollectTitleBn"),
        desc: localizedFromForm(formData, "stepCollectDescEn", "stepCollectDescBn"),
      },
      report: {
        title: localizedFromForm(formData, "stepReportTitleEn", "stepReportTitleBn"),
        desc: localizedFromForm(formData, "stepReportDescEn", "stepReportDescBn"),
      },
    },
  };

  if (!homeCollection.title.en || !homeCollection.subtitle.en) {
    return { status: "error", error: "English title and subtitle are required." };
  }

  for (const key of STEP_KEYS) {
    if (!homeCollection.steps[key].title.en || !homeCollection.steps[key].desc.en) {
      return { status: "error", error: `English content for step "${key}" is required.` };
    }
  }

  await upsertCmsSettings({ ...current, homeCollection });
  updateTag("site-settings");
  revalidatePath("/admin/content/home-collection");
  revalidatePath("/home-collection");
  return { status: "success" };
}
