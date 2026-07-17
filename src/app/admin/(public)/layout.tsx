import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/admin/theme-toggle";

export default function AdminPublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
