"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export type GenderValue = "MALE" | "FEMALE" | "OTHER";

const OPTIONS: { value: GenderValue; key: "male" | "female" | "other" }[] = [
  { value: "MALE", key: "male" },
  { value: "FEMALE", key: "female" },
  { value: "OTHER", key: "other" },
];

export function GenderRadioGroup({
  value,
  onValueChange,
  labels,
  idPrefix = "gender",
  className,
  required,
  disabled = false,
}: {
  value: GenderValue | "";
  onValueChange: (value: GenderValue) => void;
  labels: { male: string; female: string; other: string };
  idPrefix?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <RadioGroup
      value={value}
      required={required}
      aria-required={required}
      disabled={disabled}
      onValueChange={(next) => {
        if (disabled) return;
        if (next === "MALE" || next === "FEMALE" || next === "OTHER") {
          onValueChange(next);
        }
      }}
      className={cn("grid grid-cols-3 gap-1.5", className)}
    >
      {OPTIONS.map((option) => {
        const optionId = `${idPrefix}-${option.value.toLowerCase()}`;
        const selected = value === option.value;
        return (
          <Label
            key={option.value}
            htmlFor={optionId}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm font-normal transition-colors",
              disabled ? "cursor-default opacity-80" : "cursor-pointer",
              selected && "border-primary bg-primary/5",
            )}
          >
            <RadioGroupItem value={option.value} id={optionId} disabled={disabled} />
            {labels[option.key]}
          </Label>
        );
      })}
    </RadioGroup>
  );
}
