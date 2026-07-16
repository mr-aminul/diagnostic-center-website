"use client";

import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { EntityFormDialog } from "@/components/admin/entity-form-dialog";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { createBranch, deleteBranch, updateBranch } from "@/app/admin/(protected)/branches/actions";

export interface AdminBranch {
  id: string;
  name: string;
  nameBn: string | null;
  address: string;
  addressBn: string | null;
  phone: string;
  mapUrl: string | null;
  isMain: boolean;
}

export function BranchesManager({ branches }: { branches: AdminBranch[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Branches</h1>
        <EntityFormDialog
          triggerLabel={
            <>
              <Plus className="h-4 w-4" /> Branch
            </>
          }
          title="Add branch"
          action={createBranch}
        >
          <BranchFields />
        </EntityFormDialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-lg border bg-background p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{branch.name}</p>
              {branch.isMain && <Badge>Main</Badge>}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{branch.address}</p>
            <p className="mt-1 text-sm text-muted-foreground">{branch.phone}</p>
            <div className="mt-4 flex items-center justify-between">
              <EntityFormDialog
                triggerLabel="Edit"
                title={`Edit ${branch.name}`}
                action={updateBranch.bind(null, branch.id)}
              >
                <BranchFields defaultValues={branch} />
              </EntityFormDialog>
              <ConfirmDeleteButton action={deleteBranch.bind(null, branch.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BranchFields({ defaultValues }: { defaultValues?: AdminBranch }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="branch-name">Name (English)</Label>
        <Input id="branch-name" name="name" required maxLength={150} defaultValue={defaultValues?.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="branch-nameBn">Name (Bangla)</Label>
        <Input id="branch-nameBn" name="nameBn" maxLength={150} defaultValue={defaultValues?.nameBn ?? ""} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="address">Address (English)</Label>
        <Textarea id="address" name="address" required rows={2} defaultValue={defaultValues?.address} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="addressBn">Address (Bangla)</Label>
        <Textarea id="addressBn" name="addressBn" rows={2} defaultValue={defaultValues?.addressBn ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="branch-phone">Phone</Label>
        <Input id="branch-phone" name="phone" required maxLength={30} defaultValue={defaultValues?.phone} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mapUrl">Google Maps Embed URL</Label>
        <Input id="mapUrl" name="mapUrl" maxLength={500} defaultValue={defaultValues?.mapUrl ?? ""} />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <Checkbox name="isMain" value="on" defaultChecked={defaultValues?.isMain} />
        Set as main branch
      </label>
    </div>
  );
}
