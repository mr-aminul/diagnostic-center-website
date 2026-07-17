"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchableDoctor {
  id: string;
  name: string;
  nameBn: string | null;
  specialty: string;
  specialtyBn: string | null;
  degrees: string | null;
  photoUrl: string | null;
}

function doctorInitial(name: string) {
  return name.replace(/^Dr\.?\s*|^ডা\.?\s*/i, "").charAt(0).toUpperCase() || "?";
}

function DoctorAvatar({
  doctor,
  size = "default",
}: {
  doctor: Pick<SearchableDoctor, "name" | "photoUrl">;
  size?: "default" | "sm";
}) {
  return (
    <Avatar size={size} className="shrink-0">
      {doctor.photoUrl ? (
        <AvatarImage src={doctor.photoUrl} alt={doctor.name} />
      ) : null}
      <AvatarFallback>{doctorInitial(doctor.name)}</AvatarFallback>
    </Avatar>
  );
}

function doctorMatchesQuery(doctor: SearchableDoctor, query: string) {
  const haystack = [
    doctor.name,
    doctor.nameBn,
    doctor.specialty,
    doctor.specialtyBn,
    doctor.degrees,
    doctor.id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

export function DoctorSearchCombobox({
  doctors,
  value,
  onValueChange,
  id,
}: {
  doctors: SearchableDoctor[];
  value: string;
  onValueChange: (doctorId: string) => void;
  id?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = doctors.find((doctor) => doctor.id === value);
  const inputValue = open ? query : (selected?.name ?? query);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return doctors;
    return doctors.filter((doctor) => doctorMatchesQuery(doctor, normalized));
  }, [doctors, query]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function selectDoctor(doctor: SearchableDoctor) {
    onValueChange(doctor.id);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        {selected && !open ? (
          <span className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2">
            <DoctorAvatar doctor={selected} size="sm" />
          </span>
        ) : null}
        <Input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? `${id ?? "doctor"}-listbox` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          value={inputValue}
          placeholder="Search doctor, specialty, or degrees…"
          className={cn(
            "pr-10",
            selected && !open && "pl-11",
          )}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setOpen(true);
            if (value) onValueChange("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setQuery("");
              event.currentTarget.blur();
            }
            if (event.key === "ArrowDown") {
              setOpen(true);
            }
            if (event.key === "Enter" && open && filtered.length === 1) {
              event.preventDefault();
              selectDoctor(filtered[0]);
            }
          }}
        />
        <ChevronsUpDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground opacity-50"
          aria-hidden
        />
      </div>

      {open ? (
        <div
          id={`${id ?? "doctor"}-listbox`}
          role="listbox"
          aria-label="Doctors"
          className="absolute top-[calc(100%+0.25rem)] right-0 left-0 z-50 max-h-60 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No doctors match “{query.trim()}”.
            </p>
          ) : (
            filtered.map((doctor) => {
              const isSelected = doctor.id === value;
              return (
                <button
                  key={doctor.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm text-foreground outline-none transition-colors",
                    "hover:bg-muted focus-visible:bg-muted",
                    isSelected && "bg-muted",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectDoctor(doctor)}
                >
                  <DoctorAvatar doctor={doctor} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">
                      {doctor.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {doctor.specialty}
                      {doctor.degrees ? ` · ${doctor.degrees}` : ""}
                    </span>
                  </span>
                  <Check
                    className={cn(
                      "size-4 shrink-0 text-foreground",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
