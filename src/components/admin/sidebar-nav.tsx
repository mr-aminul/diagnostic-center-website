"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  CalendarClock,
  FileQuestion,
  Home,
  Inbox,
  LayoutDashboard,
  MessageSquareQuote,
  PackageIcon,
  Settings,
  Stethoscope,
  TestTube,
  Users,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  catalog?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/bookings", label: "Test bookings", icon: CalendarCheck },
      { href: "/admin/appointments", label: "Doctor appointments", icon: CalendarClock },
      { href: "/admin/inquiries", label: "Contact inquiries", icon: Inbox },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/tests", label: "Tests", icon: TestTube, catalog: true },
      { href: "/admin/packages", label: "Packages", icon: PackageIcon, catalog: true },
      { href: "/admin/doctors", label: "Doctors", icon: Stethoscope, catalog: true },
      { href: "/admin/branches", label: "Branches", icon: Building2, catalog: true },
    ],
  },
  {
    label: "Website content",
    items: [
      { href: "/admin/content/about", label: "About page", icon: Info, adminOnly: true },
      { href: "/admin/content/faq", label: "FAQ", icon: FileQuestion, adminOnly: true },
      {
        href: "/admin/content/home-collection",
        label: "Home collection",
        icon: Home,
        adminOnly: true,
      },
      {
        href: "/admin/content/testimonials",
        label: "Testimonials",
        icon: MessageSquareQuote,
        adminOnly: true,
      },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/staff", label: "Staff", icon: Users, adminOnly: true },
      { href: "/admin/settings", label: "Site settings", icon: Settings },
    ],
  },
];

export function SidebarNav({ role }: { role?: "ADMIN" | "STAFF" | "TECHNICIAN" }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5 p-3">
      {NAV_SECTIONS.map((section) => {
        const items = section.items.filter((item) => {
          if (item.adminOnly) return role === "ADMIN";
          if (item.catalog) return role !== "TECHNICIAN";
          return true;
        });
        if (items.length === 0) return null;

        return (
          <div key={section.label}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {items.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
