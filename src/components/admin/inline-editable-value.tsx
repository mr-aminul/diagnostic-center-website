"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Always-visible field styled like Add-item rows (underline only, no boxed input). */
export const inlineUnderlineFieldClass =
  "w-full border-0 border-b border-transparent bg-transparent p-0 text-xs outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground hover:border-muted-foreground/40 focus:border-foreground";

export const inlineUnderlineSelectTriggerClass =
  "h-auto min-h-0 w-full min-w-0 gap-1 rounded-none border-0 border-b border-transparent bg-transparent px-0 py-0 text-xs shadow-none hover:border-muted-foreground/40 focus-visible:border-foreground focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent data-[size=default]:h-auto data-[size=sm]:h-auto data-[size=sm]:rounded-none [&_svg:not([class*='size-'])]:size-3";

export function InlineUnderlineInput({
  className,
  ref,
  ...props
}: ComponentProps<"input">) {
  return (
    <input ref={ref} className={cn(inlineUnderlineFieldClass, className)} {...props} />
  );
}

export function InlineEditableValue({
  display,
  draftSeed,
  label,
  title,
  suffix = "",
  onCommit,
  readOnly = false,
}: {
  display: string;
  draftSeed: string;
  label: string;
  title: string;
  suffix?: string;
  onCommit: (raw: string) => void;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  function startEditing() {
    if (readOnly) return;
    setDraft(draftSeed);
    setEditing(true);
  }

  function commit() {
    onCommit(draft);
    setEditing(false);
  }

  if (editing) {
    return (
      <span className="inline-flex w-full min-w-14 items-baseline justify-end gap-0.5 border-b border-foreground">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          aria-label={label}
          value={draft}
          onChange={(event) => setDraft(event.target.value.replace(/[^\d.]/g, ""))}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setEditing(false);
            }
          }}
          className="w-full min-w-0 border-0 bg-transparent p-0 text-right text-xs tabular-nums outline-none"
        />
        {suffix ? <span className="text-muted-foreground">{suffix}</span> : null}
      </span>
    );
  }

  if (readOnly) {
    return (
      <span
        aria-label={label}
        className="ml-auto block w-full min-w-14 text-right text-xs tabular-nums text-muted-foreground"
      >
        {display}
        {suffix}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      onClick={startEditing}
      className="ml-auto block w-full min-w-14 border-0 border-b border-transparent bg-transparent p-0 text-right text-xs tabular-nums text-muted-foreground outline-none transition-colors hover:border-muted-foreground/60 hover:text-foreground focus-visible:border-foreground focus-visible:text-foreground"
    >
      {display}
    </button>
  );
}
