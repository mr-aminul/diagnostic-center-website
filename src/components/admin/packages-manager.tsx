"use client";

import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { EntityFormDialog } from "@/components/admin/entity-form-dialog";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { createPackage, deletePackage, updatePackage } from "@/app/admin/(protected)/packages/actions";
import { formatCurrency } from "@/lib/format";

export interface AdminPackage {
  id: string;
  name: string;
  nameBn: string | null;
  description: string | null;
  descriptionBn: string | null;
  imageUrl: string | null;
  price: number;
  originalPrice: number | null;
  isActive: boolean;
  tests: { test: { id: string; name: string } }[];
}

export interface AdminTestOption {
  id: string;
  name: string;
}

export function PackagesManager({
  packages,
  testOptions,
}: {
  packages: AdminPackage[];
  testOptions: AdminTestOption[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Packages</h1>
        <EntityFormDialog
          triggerLabel={
            <>
              <Plus className="h-4 w-4" /> Package
            </>
          }
          title="Add package"
          action={createPackage}
        >
          <PackageFields testOptions={testOptions} />
        </EntityFormDialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className="overflow-hidden rounded-lg border bg-background">
            {pkg.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview of external URLs
              <img src={pkg.imageUrl} alt="" className="aspect-square w-full object-cover" />
            ) : null}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{pkg.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {pkg.originalPrice != null && pkg.originalPrice > pkg.price ? (
                      <>
                        <span className="line-through">{formatCurrency(pkg.originalPrice)}</span>{" "}
                        <span className="font-medium text-foreground">{formatCurrency(pkg.price)}</span>
                      </>
                    ) : (
                      formatCurrency(pkg.price)
                    )}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{pkg.isActive ? "Active" : "Inactive"}</p>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {pkg.tests.map(({ test }) => (
                  <li key={test.id}>• {test.name}</li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between">
                <EntityFormDialog
                  triggerLabel="Edit"
                  title={`Edit ${pkg.name}`}
                  action={updatePackage.bind(null, pkg.id)}
                >
                  <PackageFields testOptions={testOptions} defaultValues={pkg} />
                </EntityFormDialog>
                <ConfirmDeleteButton action={deletePackage.bind(null, pkg.id)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PackageFields({
  testOptions,
  defaultValues,
}: {
  testOptions: AdminTestOption[];
  defaultValues?: AdminPackage;
}) {
  const selectedTestIds = new Set(defaultValues?.tests.map(({ test }) => test.id));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pkg-name">Name (English)</Label>
          <Input id="pkg-name" name="name" required maxLength={200} defaultValue={defaultValues?.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pkg-nameBn">Name (Bangla)</Label>
          <Input id="pkg-nameBn" name="nameBn" maxLength={200} defaultValue={defaultValues?.nameBn ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pkg-price">Sale price (BDT)</Label>
          <Input
            id="pkg-price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={defaultValues?.price}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pkg-originalPrice">Original price (BDT)</Label>
          <Input
            id="pkg-originalPrice"
            name="originalPrice"
            type="number"
            min={0}
            step="0.01"
            placeholder="Optional — must be higher"
            defaultValue={defaultValues?.originalPrice ?? ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pkg-imageUrl">Image URL (1:1 recommended)</Label>
        <Input
          id="pkg-imageUrl"
          name="imageUrl"
          type="url"
          placeholder="https://..."
          defaultValue={defaultValues?.imageUrl ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pkg-description">Description (English)</Label>
        <Textarea
          id="pkg-description"
          name="description"
          rows={2}
          defaultValue={defaultValues?.description ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pkg-descriptionBn">Description (Bangla)</Label>
        <Textarea
          id="pkg-descriptionBn"
          name="descriptionBn"
          rows={2}
          defaultValue={defaultValues?.descriptionBn ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label>Included Tests</Label>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
          {testOptions.map((test) => (
            <label key={test.id} className="flex items-center gap-2 text-sm">
              <Checkbox name="testIds" value={test.id} defaultChecked={selectedTestIds.has(test.id)} />
              {test.name}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
