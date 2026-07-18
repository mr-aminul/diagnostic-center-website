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
  createFaqItem,
  deleteFaqItem,
  updateFaqItem,
} from "@/app/admin/(protected)/content/faq/actions";

export interface AdminFaqItem {
  id: string;
  questionEn: string;
  questionBn: string | null;
  answerEn: string;
  answerBn: string | null;
  sortOrder: number;
}

export function FaqManager({ items }: { items: AdminFaqItem[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-3">
        <EntityFormDialog
          triggerLabel={
            <>
              <Plus className="h-4 w-4" /> Question
            </>
          }
          title="Add FAQ item"
          action={createFaqItem}
          triggerSize="default"
        >
          <FaqFields defaultSortOrder={items.length} />
        </EntityFormDialog>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Order</TableHead>
              <TableHead>Question</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <FaqRow key={item.id} item={item} />
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  No FAQ items yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FaqRow({ item }: { item: AdminFaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <ActionTableRow onActivate={() => setOpen(true)}>
      <TableCell className="text-muted-foreground">{item.sortOrder}</TableCell>
      <TableCell>
        <p className="font-medium">{item.questionEn}</p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.answerEn}</p>
      </TableCell>
      <TableCell data-row-action className="flex items-center justify-end gap-1">
        <EntityFormDialog
          open={open}
          onOpenChange={setOpen}
          triggerLabel="Edit"
          title="Edit FAQ item"
          action={updateFaqItem.bind(null, item.id)}
        >
          <FaqFields defaultValues={item} />
        </EntityFormDialog>
        <ConfirmDeleteButton action={deleteFaqItem.bind(null, item.id)} />
      </TableCell>
    </ActionTableRow>
  );
}

function FaqFields({
  defaultValues,
  defaultSortOrder = 0,
}: {
  defaultValues?: AdminFaqItem;
  defaultSortOrder?: number;
}) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="questionEn">Question (English)</Label>
        <Input
          id="questionEn"
          name="questionEn"
          required
          maxLength={300}
          defaultValue={defaultValues?.questionEn}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="questionBn">Question (Bangla)</Label>
        <Input
          id="questionBn"
          name="questionBn"
          maxLength={300}
          defaultValue={defaultValues?.questionBn ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="answerEn">Answer (English)</Label>
        <Textarea
          id="answerEn"
          name="answerEn"
          required
          rows={4}
          defaultValue={defaultValues?.answerEn}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="answerBn">Answer (Bangla)</Label>
        <Textarea
          id="answerBn"
          name="answerBn"
          rows={4}
          defaultValue={defaultValues?.answerBn ?? ""}
        />
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
