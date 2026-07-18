"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  createTestimonial,
  deleteTestimonial,
  updateTestimonial,
} from "@/app/admin/(protected)/content/testimonials/actions";

export interface AdminTestimonial {
  id: string;
  nameEn: string;
  nameBn: string | null;
  roleEn: string;
  roleBn: string | null;
  quoteEn: string;
  quoteBn: string | null;
  sortOrder: number;
}

export function TestimonialsManager({ items }: { items: AdminTestimonial[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-3">
        <EntityFormDialog
          triggerLabel={
            <>
              <Plus className="h-4 w-4" /> Testimonial
            </>
          }
          title="Add testimonial"
          action={createTestimonial}
          triggerSize="default"
        >
          <TestimonialFields defaultSortOrder={items.length} />
        </EntityFormDialog>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Order</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Quote</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TestimonialRow key={item.id} item={item} />
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No testimonials yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TestimonialRow({ item }: { item: AdminTestimonial }) {
  const [open, setOpen] = useState(false);

  return (
    <ActionTableRow onActivate={() => setOpen(true)}>
      <TableCell className="text-muted-foreground">{item.sortOrder}</TableCell>
      <TableCell>
        <p className="font-medium">{item.nameEn}</p>
        <p className="text-xs text-muted-foreground">{item.roleEn}</p>
      </TableCell>
      <TableCell className="max-w-md text-sm text-muted-foreground">{item.quoteEn}</TableCell>
      <TableCell data-row-action className="flex items-center justify-end gap-1">
        <EntityFormDialog
          open={open}
          onOpenChange={setOpen}
          triggerLabel="Edit"
          title={`Edit ${item.nameEn}`}
          action={updateTestimonial.bind(null, item.id)}
        >
          <TestimonialFields defaultValues={item} />
        </EntityFormDialog>
        <ConfirmDeleteButton action={deleteTestimonial.bind(null, item.id)} />
      </TableCell>
    </ActionTableRow>
  );
}

function TestimonialFields({
  defaultValues,
  defaultSortOrder = 0,
}: {
  defaultValues?: AdminTestimonial;
  defaultSortOrder?: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="nameEn">Name (English)</Label>
        <Input id="nameEn" name="nameEn" required defaultValue={defaultValues?.nameEn} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nameBn">Name (Bangla)</Label>
        <Input id="nameBn" name="nameBn" defaultValue={defaultValues?.nameBn ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="roleEn">Role (English)</Label>
        <Input id="roleEn" name="roleEn" required defaultValue={defaultValues?.roleEn} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="roleBn">Role (Bangla)</Label>
        <Input id="roleBn" name="roleBn" defaultValue={defaultValues?.roleBn ?? ""} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="quoteEn">Quote (English)</Label>
        <Textarea id="quoteEn" name="quoteEn" required rows={3} defaultValue={defaultValues?.quoteEn} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="quoteBn">Quote (Bangla)</Label>
        <Textarea id="quoteBn" name="quoteBn" rows={3} defaultValue={defaultValues?.quoteBn ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sortOrder">Sort order</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={defaultValues?.sortOrder ?? defaultSortOrder}
        />
      </div>
    </div>
  );
}
