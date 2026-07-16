import type { ReactNode } from "react";

export default function AdminPublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      {children}
    </div>
  );
}
