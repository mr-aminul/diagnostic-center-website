"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActionTableRow } from "@/components/admin/admin-table-row";
import { EntityFormDialog } from "@/components/admin/entity-form-dialog";
import {
  inviteStaff,
  resetStaffPassword,
  updateStaff,
} from "@/app/admin/(protected)/staff/actions";
import {
  STAFF_DEPARTMENT_LABELS,
  STAFF_DEPARTMENTS,
  STAFF_ROLE_LABELS,
  STAFF_ROLES,
  type StaffDepartmentValue,
  type StaffRoleValue,
} from "@/lib/staff";

export interface AdminStaff {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  department: string;
  jobTitle: string | null;
  employeeCode: string | null;
  branchId: string | null;
  isActive: boolean;
  branch: { id: string; name: string } | null;
}

export interface AdminStaffBranchOption {
  id: string;
  name: string;
}

export function StaffManager({
  staff,
  branches,
  currentUserId,
}: {
  staff: AdminStaff[];
  branches: AdminStaffBranchOption[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Staff users</h1>
          <p className="text-sm text-muted-foreground">
            Invite colleagues, reset passwords, and manage access. Admins only.
          </p>
        </div>
        <EntityFormDialog
          triggerLabel={
            <>
              <Plus className="h-4 w-4" /> Staff
            </>
          }
          title="Invite staff"
          action={inviteStaff}
          submitLabel="Create staff user"
        >
          <StaffFields branches={branches} />
          <div className="space-y-2">
            <Label htmlFor="invite-password">Temporary password</Label>
            <Input id="invite-password" name="password" type="password" required minLength={8} />
          </div>
        </EntityFormDialog>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No staff users yet. Invite a colleague to get started.
                </TableCell>
              </TableRow>
            ) : (
              staff.map((user) => (
                <StaffRow
                  key={user.id}
                  user={user}
                  branches={branches}
                  isSelf={user.id === currentUserId}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StaffRow({
  user,
  branches,
  isSelf,
}: {
  user: AdminStaff;
  branches: AdminStaffBranchOption[];
  isSelf: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const departmentLabel =
    STAFF_DEPARTMENT_LABELS[user.department as StaffDepartmentValue] ?? user.department;
  const roleLabel = STAFF_ROLE_LABELS[user.role as StaffRoleValue] ?? user.role;

  return (
    <ActionTableRow onActivate={() => setEditOpen(true)}>
      <TableCell>
        <div className="font-medium">
          {user.name}
          {isSelf ? (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
          ) : null}
        </div>
        {user.jobTitle ? (
          <p className="text-xs text-muted-foreground">{user.jobTitle}</p>
        ) : null}
        {user.employeeCode ? (
          <p className="text-xs text-muted-foreground">{user.employeeCode}</p>
        ) : null}
      </TableCell>
      <TableCell className="text-muted-foreground">{departmentLabel}</TableCell>
      <TableCell className="text-muted-foreground">{user.branch?.name ?? "—"}</TableCell>
      <TableCell>{roleLabel}</TableCell>
      <TableCell>
        <Badge variant={user.isActive ? "default" : "secondary"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell data-row-action className="flex items-center justify-end gap-1">
        <EntityFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          triggerLabel="Edit"
          title={`Edit ${user.name}`}
          action={updateStaff.bind(null, user.id)}
        >
          <StaffFields defaultValues={user} branches={branches} isSelf={isSelf} />
        </EntityFormDialog>
        <EntityFormDialog
          open={resetOpen}
          onOpenChange={setResetOpen}
          triggerLabel="Reset"
          title={`Reset password — ${user.name}`}
          action={resetStaffPassword}
          submitLabel="Update password"
        >
          <input type="hidden" name="staffId" value={user.id} />
          <div className="space-y-2">
            <Label htmlFor={`reset-password-${user.id}`}>New password</Label>
            <Input
              id={`reset-password-${user.id}`}
              name="password"
              type="password"
              required
              minLength={8}
            />
          </div>
        </EntityFormDialog>
      </TableCell>
    </ActionTableRow>
  );
}

function StaffFields({
  defaultValues,
  branches,
  isSelf = false,
}: {
  defaultValues?: AdminStaff;
  branches: AdminStaffBranchOption[];
  isSelf?: boolean;
}) {
  const idPrefix = defaultValues ? `edit-${defaultValues.id}` : "invite";
  const canChangeStatus = Boolean(defaultValues) && !isSelf;
  const departmentItems = Object.fromEntries(
    STAFF_DEPARTMENTS.map((value) => [value, STAFF_DEPARTMENT_LABELS[value]])
  );
  const roleItems = Object.fromEntries(STAFF_ROLES.map((value) => [value, STAFF_ROLE_LABELS[value]]));
  const branchItems = {
    none: "Unassigned",
    ...Object.fromEntries(branches.map((branch) => [branch.id, branch.name])),
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          required
          maxLength={120}
          defaultValue={defaultValues?.name}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-jobTitle`}>Job title</Label>
        <Input
          id={`${idPrefix}-jobTitle`}
          name="jobTitle"
          maxLength={120}
          placeholder="e.g. Senior lab technician"
          defaultValue={defaultValues?.jobTitle ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-phone`}>Phone</Label>
        <Input
          id={`${idPrefix}-phone`}
          name="phone"
          required
          maxLength={20}
          defaultValue={defaultValues?.phone}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`}>Email</Label>
        <Input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          required
          maxLength={200}
          defaultValue={defaultValues?.email ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-employeeCode`}>Employee code</Label>
        <Input
          id={`${idPrefix}-employeeCode`}
          name="employeeCode"
          maxLength={40}
          placeholder="Optional"
          defaultValue={defaultValues?.employeeCode ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-department`}>Department</Label>
        <Select
          name="department"
          defaultValue={defaultValues?.department ?? "ADMINISTRATION"}
          items={departmentItems}
        >
          <SelectTrigger id={`${idPrefix}-department`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAFF_DEPARTMENTS.map((value) => (
              <SelectItem key={value} value={value}>
                {STAFF_DEPARTMENT_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-role`}>Role</Label>
        <Select
          name="role"
          defaultValue={defaultValues?.role ?? "STAFF"}
          items={roleItems}
        >
          <SelectTrigger id={`${idPrefix}-role`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAFF_ROLES.map((value) => (
              <SelectItem key={value} value={value}>
                {STAFF_ROLE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-branch`}>Primary branch</Label>
        <Select
          name="branchId"
          defaultValue={defaultValues?.branchId ?? "none"}
          items={branchItems}
        >
          <SelectTrigger id={`${idPrefix}-branch`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unassigned</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {defaultValues ? (
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-status`}>Status</Label>
          {canChangeStatus ? (
            <Select
              name="isActive"
              defaultValue={defaultValues.isActive ? "true" : "false"}
              items={{
                true: "Active",
                false: "Inactive",
              }}
            >
              <SelectTrigger id={`${idPrefix}-status`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <>
              <input type="hidden" name="isActive" value="true" />
              <Select disabled defaultValue="true" items={{ true: "Active" }}>
                <SelectTrigger id={`${idPrefix}-status`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                You cannot deactivate your own account.
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
