import { requireAdmin } from "@/lib/auth";
import { getCmsSettings } from "@/lib/data/site-settings";
import { AboutContentForm } from "@/components/admin/about-content-form";

export default async function AdminAboutContentPage() {
  await requireAdmin();
  const settings = await getCmsSettings();
  return <AboutContentForm about={settings.about} />;
}
