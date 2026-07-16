"use client";

import { isDevToolsEnabled } from "@/lib/dev-tools";
import { cn } from "@/lib/utils";

/**
 * Tiny development-only control. Invisible in production builds.
 * Prefer `onFill` for controlled React state; otherwise uses `fields` + the parent <form>.
 */
export function DevAutofillButton({
  onFill,
  fields,
  className,
  label = "fill",
}: {
  onFill?: () => void;
  fields?: Record<string, string>;
  className?: string;
  label?: string;
}) {
  if (!isDevToolsEnabled()) return null;

  return (
    <button
      type="button"
      tabIndex={-1}
      className={cn(
        "inline-flex text-[10px] font-normal uppercase tracking-wide text-muted-foreground/40 transition-colors hover:text-muted-foreground/70",
        className
      )}
      onClick={(event) => {
        event.preventDefault();
        if (onFill) {
          onFill();
          return;
        }
        if (!fields) return;
        const form = event.currentTarget.closest("form");
        if (!form) return;
        for (const [name, value] of Object.entries(fields)) {
          const element = form.elements.namedItem(name);
          if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement
          ) {
            setNativeValue(element, value);
          }
        }
      }}
    >
      {label}
    </button>
  );
}

function setNativeValue(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string
) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}
