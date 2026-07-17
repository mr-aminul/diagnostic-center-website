"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "a, button, input, select, textarea, label, [role='button'], [data-row-action]"
    )
  );
}

export function LinkTableRow({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  function go() {
    router.push(href);
  }

  function onClick(event: MouseEvent<HTMLTableRowElement>) {
    if (isInteractiveTarget(event.target)) return;
    go();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (isInteractiveTarget(event.target)) return;
    event.preventDefault();
    go();
  }

  return (
    <TableRow
      role="link"
      tabIndex={0}
      className={cn("cursor-pointer", className)}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {children}
    </TableRow>
  );
}

export function ActionTableRow({
  className,
  onActivate,
  children,
}: {
  className?: string;
  onActivate: () => void;
  children: ReactNode;
}) {
  function onClick(event: MouseEvent<HTMLTableRowElement>) {
    if (isInteractiveTarget(event.target)) return;
    onActivate();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (isInteractiveTarget(event.target)) return;
    event.preventDefault();
    onActivate();
  }

  return (
    <TableRow
      tabIndex={0}
      className={cn("cursor-pointer", className)}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {children}
    </TableRow>
  );
}
