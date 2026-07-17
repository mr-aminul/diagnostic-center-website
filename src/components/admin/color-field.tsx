"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const HEX_COLOR = /^#([0-9A-Fa-f]{6})$/;

function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (HEX_COLOR.test(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return null;
}

export function ColorField({
  id,
  name,
  label,
  defaultValue,
  className,
  compact = false,
}: {
  id?: string;
  name: string;
  label: string;
  defaultValue: string;
  className?: string;
  compact?: boolean;
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const pickerId = `${fieldId}-picker`;
  const initial = normalizeHex(defaultValue) ?? "#000000";
  const [hex, setHex] = useState(initial);
  const preview = normalizeHex(hex) ?? initial;

  return (
    <div className={cn(compact ? "space-y-1.5" : "space-y-2", className)}>
      <Label htmlFor={fieldId} className={compact ? "text-xs" : undefined}>
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <label
          htmlFor={pickerId}
          className={cn(
            "relative shrink-0 cursor-pointer overflow-hidden border border-input bg-background shadow-sm transition-colors",
            "hover:border-ring focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
            compact ? "h-9 w-9 rounded-md" : "h-11 w-11 rounded-lg",
          )}
          title="Pick a color"
        >
          <span
            aria-hidden
            className="absolute inset-0"
            style={{ backgroundColor: preview }}
          />
          <input
            id={pickerId}
            type="color"
            value={preview}
            onChange={(event) => setHex(event.target.value.toLowerCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`${label} picker`}
          />
        </label>
        <Input
          id={fieldId}
          name={name}
          required
          value={hex}
          onChange={(event) => {
            const next = event.target.value;
            const normalized = normalizeHex(next);
            setHex(normalized ?? next);
          }}
          onBlur={() => {
            const normalized = normalizeHex(hex);
            if (normalized) setHex(normalized);
          }}
          pattern="^#[0-9A-Fa-f]{6}$"
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          className={cn(
            "font-mono uppercase tracking-wide",
            compact && "h-9",
          )}
          aria-describedby={`${fieldId}-hint`}
        />
      </div>
      <p id={`${fieldId}-hint`} className="sr-only">
        Enter a hex color like #047857, or use the color swatch
      </p>
    </div>
  );
}
