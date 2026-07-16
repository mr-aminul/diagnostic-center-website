"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  LayoutDashboard,
  Settings,
  Stethoscope,
  TestTube,
  PackageIcon,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/tests", label: "Tests", icon: TestTube, catalog: true },
  { href: "/admin/packages", label: "Packages", icon: PackageIcon, catalog: true },
  ...(siteConfig.features.doctorsPage
    ? [{ href: "/admin/doctors", label: "Doctors", icon: Stethoscope, catalog: true }]
    : []),
  ...(siteConfig.features.multiBranch
    ? [{ href: "/admin/branches", label: "Branches", icon: Building2, catalog: true }]
    : []),
  { href: "/admin/staff", label: "Staff", icon: Users, adminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({ role }: { role?: "ADMIN" | "STAFF" | "TECHNICIAN" }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.filter((item) => {
        if ("adminOnly" in item && item.adminOnly) return role === "ADMIN";
        if ("catalog" in item && item.catalog) return role !== "TECHNICIAN";
        return true;
      }).map((item) => {
          const isActive =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}
