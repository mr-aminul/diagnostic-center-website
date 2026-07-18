import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarCheck,
  CalendarClock,
  FileQuestion,
  FileText,
  Home,
  Inbox,
  Info,
  LayoutDashboard,
  MessageSquareQuote,
  PackageIcon,
  Settings,
  Stethoscope,
  TestTube,
  Users,
} from "lucide-react";

export type AdminPageMeta = {
  title: string;
  icon: LucideIcon;
};

/**
 * Resolve title + sidebar-matching icon for the admin top bar.
 */
export function getAdminPageMeta(pathname: string): AdminPageMeta {
  const path = pathname.replace(/\/$/, "") || "/admin";

  if (path === "/admin") return { title: "Dashboard", icon: LayoutDashboard };
  if (path === "/admin/bookings") {
    return { title: "Test bookings", icon: CalendarCheck };
  }
  if (path === "/admin/bookings/new") {
    return { title: "New booking", icon: CalendarCheck };
  }
  if (/^\/admin\/bookings\/[^/]+\/invoice$/.test(path)) {
    return { title: "Invoice", icon: FileText };
  }
  if (/^\/admin\/bookings\/[^/]+$/.test(path)) {
    return { title: "Booking", icon: CalendarCheck };
  }
  if (path === "/admin/bookings-v2") {
    return { title: "Test bookings", icon: CalendarCheck };
  }
  if (/^\/admin\/bookings-v2\/[^/]+$/.test(path)) {
    return { title: "Booking", icon: CalendarCheck };
  }
  if (path === "/admin/appointments") {
    return { title: "Doctor appointments", icon: CalendarClock };
  }
  if (path === "/admin/inquiries") {
    return { title: "Contact inquiries", icon: Inbox };
  }
  if (path === "/admin/tests") return { title: "Tests", icon: TestTube };
  if (path === "/admin/packages") return { title: "Packages", icon: PackageIcon };
  if (path === "/admin/doctors") return { title: "Doctors", icon: Stethoscope };
  if (path === "/admin/branches") return { title: "Branches", icon: Building2 };
  if (path === "/admin/content/about") return { title: "About page", icon: Info };
  if (path === "/admin/content/faq") return { title: "FAQ", icon: FileQuestion };
  if (path === "/admin/content/home-collection") {
    return { title: "Home collection", icon: Home };
  }
  if (path === "/admin/content/testimonials") {
    return { title: "Testimonials", icon: MessageSquareQuote };
  }
  if (path === "/admin/staff") return { title: "Staff", icon: Users };
  if (path === "/admin/settings") return { title: "Site settings", icon: Settings };

  return { title: "Admin", icon: LayoutDashboard };
}

export function getAdminPageTitle(pathname: string): string {
  return getAdminPageMeta(pathname).title;
}

/** Parent path for the back control, or null on the dashboard root. */
export function getAdminBackHref(pathname: string): string | null {
  const path = pathname.replace(/\/$/, "") || "/admin";
  if (path === "/admin") return null;

  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return null;

  parts.pop();
  const parent = `/${parts.join("/")}`;
  return parent === "/" ? "/admin" : parent;
}
