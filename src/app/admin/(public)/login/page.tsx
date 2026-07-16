import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/admin/login-form";
import { siteConfig } from "@/config/site";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{siteConfig.shortName} Admin</CardTitle>
        <p className="text-sm text-muted-foreground">Sign in to manage bookings and content.</p>
      </CardHeader>
      <CardContent>
        <LoginForm next={params.next} />
      </CardContent>
    </Card>
  );
}
