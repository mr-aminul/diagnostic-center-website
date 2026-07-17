import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/admin/login-form";
import { siteConfig } from "@/config/site";
import { isDevToolsEnabled } from "@/lib/dev-tools";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const demoCredentials = isDevToolsEnabled()
    ? {
        phone: process.env.SEED_ADMIN_PHONE,
        password: process.env.SEED_ADMIN_PASSWORD,
      }
    : undefined;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{siteConfig.shortName} Admin</CardTitle>
        <p className="text-sm text-muted-foreground">Sign in to manage bookings and content.</p>
      </CardHeader>
      <CardContent>
        <LoginForm next={params.next} demoCredentials={demoCredentials} />
      </CardContent>
    </Card>
  );
}
