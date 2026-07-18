"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { createCategory, createTest, deleteTest, updateTest } from "@/app/admin/(protected)/tests/actions";
import { formatCurrency } from "@/lib/format";

export interface AdminTest {
  id: string;
  name: string;
  nameBn: string | null;
  price: number;
  sampleType: string | null;
  preparation: string | null;
  preparationBn: string | null;
  turnaroundTime: string | null;
  isActive: boolean;
  categoryId: string;
  category: { id: string; name: string };
}

export interface AdminCategory {
  id: string;
  name: string;
  nameBn: string | null;
}

export function TestsManager({
  tests,
  categories,
}: {
  tests: AdminTest[];
  categories: AdminCategory[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex gap-2">
          <EntityFormDialog
            triggerLabel={
              <>
                <Plus className="h-4 w-4" /> Category
              </>
            }
            title="Add category"
            action={createCategory}
            triggerSize="default"
          >
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name (English)</Label>
              <Input id="cat-name" name="name" required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-nameBn">Name (Bangla)</Label>
              <Input id="cat-nameBn" name="nameBn" maxLength={100} />
            </div>
          </EntityFormDialog>

          <EntityFormDialog
            triggerLabel={
              <>
                <Plus className="h-4 w-4" /> Test
              </>
            }
            title="Add test"
            action={createTest}
            triggerSize="default"
          >
            <TestFields categories={categories} />
          </EntityFormDialog>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.map((test) => (
              <TestRow key={test.id} test={test} categories={categories} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TestRow({
  test,
  categories,
}: {
  test: AdminTest;
  categories: AdminCategory[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <ActionTableRow onActivate={() => setOpen(true)}>
      <TableCell className="font-medium">{test.name}</TableCell>
      <TableCell className="text-muted-foreground">{test.category.name}</TableCell>
      <TableCell className="text-right">{formatCurrency(test.price)}</TableCell>
      <TableCell className="text-muted-foreground">
        {test.isActive ? "Active" : "Inactive"}
      </TableCell>
      <TableCell data-row-action className="flex items-center justify-end gap-1">
        <EntityFormDialog
          open={open}
          onOpenChange={setOpen}
          triggerLabel="Edit"
          title={`Edit ${test.name}`}
          action={updateTest.bind(null, test.id)}
        >
          <TestFields categories={categories} defaultValues={test} />
        </EntityFormDialog>
        <ConfirmDeleteButton action={deleteTest.bind(null, test.id)} />
      </TableCell>
    </ActionTableRow>
  );
}

function TestFields({
  categories,
  defaultValues,
}: {
  categories: AdminCategory[];
  defaultValues?: AdminTest;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name (English)</Label>
          <Input id="name" name="name" required maxLength={200} defaultValue={defaultValues?.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameBn">Name (Bangla)</Label>
          <Input id="nameBn" name="nameBn" maxLength={200} defaultValue={defaultValues?.nameBn ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <Select
            name="categoryId"
            defaultValue={defaultValues?.categoryId ?? categories[0]?.id}
            items={Object.fromEntries(
              categories.map((category) => [category.id, category.name]),
            )}
          >
            <SelectTrigger id="categoryId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price (BDT)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={defaultValues?.price}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sampleType">Sample Type</Label>
          <Input id="sampleType" name="sampleType" maxLength={100} defaultValue={defaultValues?.sampleType ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="turnaroundTime">Turnaround Time</Label>
          <Input
            id="turnaroundTime"
            name="turnaroundTime"
            maxLength={100}
            defaultValue={defaultValues?.turnaroundTime ?? ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="preparation">Preparation Notes (English)</Label>
        <Textarea id="preparation" name="preparation" rows={2} defaultValue={defaultValues?.preparation ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="preparationBn">Preparation Notes (Bangla)</Label>
        <Textarea
          id="preparationBn"
          name="preparationBn"
          rows={2}
          defaultValue={defaultValues?.preparationBn ?? ""}
        />
      </div>
    </>
  );
}
