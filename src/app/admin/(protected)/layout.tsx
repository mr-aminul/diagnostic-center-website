import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth";
import { getResolvedSiteConfig } from "@/lib/data/site-settings";
import { AdminTopBar } from "@/components/admin/admin-top-bar";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { ThemeToggle } from "@/components/admin/theme-toggle";

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const [session, site] = await Promise.all([requireSession(), getResolvedSiteConfig()]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground print:hidden lg:block">
        <div className="flex items-start justify-between gap-2 border-b p-4">
          <div className="min-w-0">
            <p className="font-semibold">{site.shortName}</p>
            <p className="text-xs text-muted-foreground">Admin Console</p>
          </div>
          <ThemeToggle size="icon-sm" />
        </div>
        <SidebarNav role={session.role} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar
          name={session.name}
          role={session.role}
          siteShortName={site.shortName}
        />
        <main className="flex-1 bg-muted/20 p-4 sm:p-6 print:bg-white print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
