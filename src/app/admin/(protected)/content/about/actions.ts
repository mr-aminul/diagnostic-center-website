"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { localizedFromForm } from "@/lib/cms/form";
import { getCmsSettings, upsertCmsSettings } from "@/lib/data/site-settings";
import type { EntityFormState } from "@/components/admin/entity-form-dialog";

export async function updateAboutContent(
  _previousState: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  await requireAdmin();
  const current = await getCmsSettings();

  const about = {
    missionTitle: localizedFromForm(formData, "missionTitleEn", "missionTitleBn"),
    missionBody: localizedFromForm(formData, "missionBodyEn", "missionBodyBn"),
    accreditationTitle: localizedFromForm(
      formData,
      "accreditationTitleEn",
      "accreditationTitleBn",
    ),
    accreditationBody: localizedFromForm(
      formData,
      "accreditationBodyEn",
      "accreditationBodyBn",
    ),
  };

  if (!about.missionTitle.en || !about.missionBody.en) {
    return { status: "error", error: "English mission title and body are required." };
  }

  await upsertCmsSettings({ ...current, about });
  updateTag("site-settings");
  revalidatePath("/admin/content/about");
  revalidatePath("/about");
  revalidatePath("/");
  return { status: "success" };
}
