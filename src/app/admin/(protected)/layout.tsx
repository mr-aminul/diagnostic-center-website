import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { siteConfig } from "@/config/site";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { logout } from "@/app/admin/(protected)/logout-action";

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-secondary/20 lg:block">
        <div className="border-b p-4">
          <p className="font-semibold">{siteConfig.shortName}</p>
          <p className="text-xs text-muted-foreground">Admin Console</p>
        </div>
        <SidebarNav role={session.role} />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b px-4">
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet>
              <SheetTrigger render={<Button variant="outline" size="icon" aria-label="Menu" />}>
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetTitle className="px-4 pt-4">{siteConfig.shortName} Admin</SheetTitle>
                <SidebarNav role={session.role} />
              </SheetContent>
            </Sheet>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right text-sm">
              <p className="font-medium">{session.name}</p>
              <p className="text-xs text-muted-foreground">{session.role}</p>
            </div>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Logout
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 bg-muted/20 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
