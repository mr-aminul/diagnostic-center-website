import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BookingWorkspace({
  header,
  children,
  aside,
}: {
  header: ReactNode;
  children: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      {header}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">{children}</div>
        <aside className="space-y-4 lg:sticky lg:top-6">{aside}</aside>
      </div>
    </div>
  );
}

export function BookingSection({
  title,
  icon: Icon,
  titleAction,
  headerRight,
  children,
  className,
  compact = false,
}: {
  title: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Control placed immediately after the title (e.g. Add). */
  titleAction?: ReactNode;
  /** Actions aligned to the upper-right of the section (e.g. status + button). */
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-card",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          compact ? "mb-2" : "mb-3",
          headerRight ? "justify-between" : null,
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {Icon ? (
            <Icon
              className="h-3.5 w-3.5 shrink-0 text-primary"
              aria-hidden
            />
          ) : null}
          <h2 className="text-sm font-semibold">{title}</h2>
          {titleAction}
        </div>
        {headerRight ? (
          <div className="flex shrink-0 items-center gap-2">{headerRight}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}
