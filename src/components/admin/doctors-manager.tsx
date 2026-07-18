"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActionTableRow } from "@/components/admin/admin-table-row";
import { EntityFormDialog } from "@/components/admin/entity-form-dialog";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { createDoctor, deleteDoctor, updateDoctor } from "@/app/admin/(protected)/doctors/actions";

export interface AdminDoctor {
  id: string;
  name: string;
  nameBn: string | null;
  specialty: string;
  specialtyBn: string | null;
  degrees: string | null;
  schedule: string | null;
  scheduleBn: string | null;
  minutesPerPatient: number;
  photoUrl: string | null;
  isActive: boolean;
}

export function DoctorsManager({ doctors }: { doctors: AdminDoctor[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <EntityFormDialog
          triggerLabel={
            <>
              <Plus className="h-4 w-4" /> Doctor
            </>
          }
          title="Add doctor"
          action={createDoctor}
          triggerSize="default"
        >
          <DoctorFields />
        </EntityFormDialog>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Specialty</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Min / patient</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor) => (
              <DoctorRow key={doctor.id} doctor={doctor} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function DoctorRow({ doctor }: { doctor: AdminDoctor }) {
  const [open, setOpen] = useState(false);

  return (
    <ActionTableRow onActivate={() => setOpen(true)}>
      <TableCell className="font-medium">{doctor.name}</TableCell>
      <TableCell className="text-muted-foreground">{doctor.specialty}</TableCell>
      <TableCell className="text-muted-foreground">{doctor.schedule ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground">{doctor.minutesPerPatient} min</TableCell>
      <TableCell data-row-action className="flex items-center justify-end gap-1">
        <EntityFormDialog
          open={open}
          onOpenChange={setOpen}
          triggerLabel="Edit"
          title={`Edit ${doctor.name}`}
          action={updateDoctor.bind(null, doctor.id)}
        >
          <DoctorFields defaultValues={doctor} />
        </EntityFormDialog>
        <ConfirmDeleteButton action={deleteDoctor.bind(null, doctor.id)} />
      </TableCell>
    </ActionTableRow>
  );
}

function DoctorFields({ defaultValues }: { defaultValues?: AdminDoctor }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="doc-name">Name (English)</Label>
        <Input id="doc-name" name="name" required maxLength={150} defaultValue={defaultValues?.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="doc-nameBn">Name (Bangla)</Label>
        <Input id="doc-nameBn" name="nameBn" maxLength={150} defaultValue={defaultValues?.nameBn ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="specialty">Specialty (English)</Label>
        <Input id="specialty" name="specialty" required maxLength={150} defaultValue={defaultValues?.specialty} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="specialtyBn">Specialty (Bangla)</Label>
        <Input
          id="specialtyBn"
          name="specialtyBn"
          maxLength={150}
          defaultValue={defaultValues?.specialtyBn ?? ""}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="degrees">Degrees</Label>
        <Input id="degrees" name="degrees" maxLength={200} defaultValue={defaultValues?.degrees ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="schedule">Schedule (English)</Label>
        <Input id="schedule" name="schedule" maxLength={200} defaultValue={defaultValues?.schedule ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="scheduleBn">Schedule (Bangla)</Label>
        <Input id="scheduleBn" name="scheduleBn" maxLength={200} defaultValue={defaultValues?.scheduleBn ?? ""} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="minutesPerPatient">Minutes per patient (estimated)</Label>
        <Input
          id="minutesPerPatient"
          name="minutesPerPatient"
          type="number"
          min={1}
          max={120}
          step={1}
          required
          defaultValue={defaultValues?.minutesPerPatient ?? 15}
        />
        <p className="text-xs text-muted-foreground">
          Used to space serial estimated times (e.g. 5, 10, or 15 minutes).
        </p>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="photoUrl">Photo URL</Label>
        <Input
          id="photoUrl"
          name="photoUrl"
          type="url"
          maxLength={500}
          placeholder="https://..."
          defaultValue={defaultValues?.photoUrl ?? ""}
        />
      </div>
    </div>
  );
}
