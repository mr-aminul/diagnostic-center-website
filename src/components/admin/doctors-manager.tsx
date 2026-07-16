"use client";

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
  isActive: boolean;
}

export function DoctorsManager({ doctors }: { doctors: AdminDoctor[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Doctors</h1>
        <EntityFormDialog
          triggerLabel={
            <>
              <Plus className="h-4 w-4" /> Doctor
            </>
          }
          title="Add doctor"
          action={createDoctor}
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
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell className="font-medium">{doctor.name}</TableCell>
                <TableCell className="text-muted-foreground">{doctor.specialty}</TableCell>
                <TableCell className="text-muted-foreground">{doctor.schedule ?? "—"}</TableCell>
                <TableCell className="flex items-center justify-end gap-1">
                  <EntityFormDialog
                    triggerLabel="Edit"
                    title={`Edit ${doctor.name}`}
                    action={updateDoctor.bind(null, doctor.id)}
                  >
                    <DoctorFields defaultValues={doctor} />
                  </EntityFormDialog>
                  <ConfirmDeleteButton action={deleteDoctor.bind(null, doctor.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
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
    </div>
  );
}
