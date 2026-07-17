import { requireAdmin } from "@/lib/auth";
import { getCmsSettings } from "@/lib/data/site-settings";
import { HomeCollectionContentForm } from "@/components/admin/home-collection-content-form";

export default async function AdminHomeCollectionContentPage() {
  await requireAdmin();
  const settings = await getCmsSettings();
  return <HomeCollectionContentForm content={settings.homeCollection} />;
}
