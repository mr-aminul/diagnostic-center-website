import { Suspense } from "react";
import { SiteSettingsForms } from "@/components/admin/site-settings-forms";
import { getSession } from "@/lib/auth";
import { getCmsSettings } from "@/lib/data/site-settings";

export default async function AdminSettingsPage() {
  const [session, settings] = await Promise.all([getSession(), getCmsSettings()]);
  const isAdmin = session?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted/50" />}>
        <SiteSettingsForms settings={settings} isAdmin={isAdmin} />
      </Suspense>
    </div>
  );
}
