import type { ReactNode } from "react";
import { AdminThemeProvider } from "@/components/admin/admin-theme-provider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminThemeProvider>{children}</AdminThemeProvider>;
}
