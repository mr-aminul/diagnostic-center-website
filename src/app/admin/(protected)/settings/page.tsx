import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { siteConfig } from "@/config/site";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding &amp; Site Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Center name, logo, brand colors, contact details, and feature toggles are defined in{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">src/config/site.ts</code>{" "}
            and require a redeploy to take effect. This keeps every center&apos;s branding in version
            control rather than a database.
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 pt-2">
            <dt className="font-medium text-foreground">Center name</dt>
            <dd>{siteConfig.name}</dd>
            <dt className="font-medium text-foreground">Primary color</dt>
            <dd className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 rounded-full border"
                style={{ backgroundColor: siteConfig.theme.primary }}
              />
              {siteConfig.theme.primary}
            </dd>
            <dt className="font-medium text-foreground">Support phone</dt>
            <dd>{siteConfig.contact.phones.join(", ")}</dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
