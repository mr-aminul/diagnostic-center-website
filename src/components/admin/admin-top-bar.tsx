"use client";

import {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CalendarCheck,
  CalendarClock,
  ChevronDown,
  Inbox,
  LogOut,
  Menu,
  Search,
  Settings,
} from "lucide-react";
import { logout } from "@/app/admin/(protected)/logout-action";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { ThemeToggle } from "@/components/admin/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getAdminBackHref, getAdminPageMeta } from "@/lib/admin-page-title";
import type { AdminNotification, AdminSearchHit } from "@/lib/admin-search";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 250;

const KIND_META: Record<
  AdminSearchHit["kind"],
  { label: string; icon: typeof CalendarCheck }
> = {
  booking: { label: "Booking", icon: CalendarCheck },
  appointment: { label: "Appointment", icon: CalendarClock },
  inquiry: { label: "Inquiry", icon: Inbox },
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function AdminTopBar({
  name,
  role,
  siteShortName,
}: {
  name: string;
  role: "ADMIN" | "STAFF" | "TECHNICIAN";
  siteShortName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { title, icon: TitleIcon } = getAdminPageMeta(pathname);
  const backHref = getAdminBackHref(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" size="icon" aria-label="Menu" />}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground">
              <div className="flex items-start justify-between gap-2 border-b px-4 pt-4 pb-3">
                <SheetTitle className="text-left">{siteShortName} Admin</SheetTitle>
                <ThemeToggle size="icon-sm" />
              </div>
              <SidebarNav role={role} />
            </SheetContent>
          </Sheet>
        </div>

        {backHref ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Go back"
            onClick={() => router.push(backHref)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : null}

        <h1 className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight sm:text-lg">
          <TitleIcon className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
          <span className="truncate">{title}</span>
        </h1>
      </div>

      <div className="mx-auto hidden min-w-0 max-w-md flex-1 md:block">
        <AdminGlobalSearch />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="md:hidden">
          <AdminGlobalSearch compact />
        </div>
        <AdminNotifications />
        <div className="ml-3">
          <AdminProfileMenu name={name} role={role} />
        </div>
      </div>
    </header>
  );
}

function AdminGlobalSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const listboxId = useId();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<AdminSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const trimmed = deferredQuery.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as { hits: AdminSearchHit[] };
        setHits(data.hits);
        setActiveIndex(0);
        setOpen(true);
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setHits([]);
        }
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [deferredQuery]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function goTo(hit: AdminSearchHit) {
    setOpen(false);
    setQuery("");
    router.push(hit.href);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (hits[activeIndex]) goTo(hits[activeIndex]!);
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={rootRef} className={cn("relative", compact ? "w-9" : "w-full")}>
      <form onSubmit={onSubmit} className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (!showPanel || hits.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => (index + 1) % hits.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => (index - 1 + hits.length) % hits.length);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={
            compact ? "Search…" : "Search bookings, patients, inquiries…"
          }
          className={cn(
            "h-9 bg-muted/40 pl-9",
            compact
              ? "w-9 px-0 text-transparent caret-transparent focus:w-56 focus:px-3 focus:pl-9 focus:text-foreground focus:caret-auto"
              : "w-full",
          )}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
        />
      </form>

      {showPanel ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-[calc(100%+0.35rem)] right-0 left-0 z-50 max-h-80 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          {loading && hits.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">Searching…</p>
          ) : hits.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">No matches</p>
          ) : (
            hits.map((hit, index) => {
              const meta = KIND_META[hit.kind];
              const Icon = meta.icon;
              return (
                <button
                  key={`${hit.kind}-${hit.id}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm",
                    index === activeIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted",
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goTo(hit)}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{hit.title}</span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {meta.label}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {hit.subtitle}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

function AdminNotifications() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications: AdminNotification[];
        unreadCount: number;
      };
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void load();
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="relative"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
          />
        }
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <PopoverHeader className="border-b px-3 py-2.5">
          <PopoverTitle>Notifications</PopoverTitle>
          <PopoverDescription>Unread contact inquiries</PopoverDescription>
        </PopoverHeader>
        <div className="max-h-80 overflow-y-auto p-1">
          {loading && notifications.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              No new notifications
            </p>
          ) : (
            notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full flex-col gap-0.5 rounded-md px-2 py-2 text-left hover:bg-muted"
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
              >
                <span className="text-sm font-medium">{item.title}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {item.body}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="border-t p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              setOpen(false);
              router.push("/admin/inquiries");
            }}
          >
            View all inquiries
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AdminProfileMenu({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-9 gap-2 px-2 pr-2.5",
        )}
        aria-label="Account menu"
      >
        <Avatar size="sm">
          <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex flex-col items-start text-left">
          <span className="max-w-[7rem] truncate text-sm font-medium leading-none sm:max-w-[9rem]">
            {name}
          </span>
          <span className="mt-0.5 max-w-[7rem] truncate text-[11px] leading-none text-muted-foreground sm:max-w-[9rem]">
            {role}
          </span>
        </span>
        <ChevronDown className="size-3.5 opacity-60" data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              router.push("/admin/settings");
            }}
          >
            <Settings />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              startTransition(() => {
                void logout();
              });
            }}
          >
            <LogOut />
            Logout
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
