"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  inviteStaff,
  resetStaffPassword,
  setStaffActive,
  type StaffActionState,
} from "@/app/admin/(protected)/staff/actions";

const initialState: StaffActionState = { status: "idle" };

interface StaffRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  isActive: boolean;
}

export function StaffManager({ staff }: { staff: StaffRow[] }) {
  const [inviteState, inviteAction, invitePending] = useActionState(inviteStaff, initialState);
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPending, setResetPending] = useState(false);

  useEffect(() => {
    if (inviteState.status === "success") toast.success("Staff user invited.");
    if (inviteState.status === "error") toast.error(inviteState.error ?? "Invite failed.");
  }, [inviteState]);

  async function handleResetPassword(formData: FormData) {
    setResetPending(true);
    try {
      const next = await resetStaffPassword(initialState, formData);
      if (next.status === "success") {
        toast.success("Password updated.");
        setResetFor(null);
      } else {
        toast.error(next.error ?? "Reset failed.");
      }
    } finally {
      setResetPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <form action={inviteAction} className="grid max-w-2xl gap-4 rounded-lg border p-4 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-base font-semibold">Invite staff</h2>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            name="role"
            defaultValue="STAFF"
            items={{
              ADMIN: "Admin",
              STAFF: "Staff",
              TECHNICIAN: "Technician",
            }}
          >
            <SelectTrigger id="role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="TECHNICIAN">Technician</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="password">Temporary password</Label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>
        <Button type="submit" disabled={invitePending} className="sm:col-span-2">
          {invitePending ? "Saving…" : "Create staff user"}
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setResetFor(user.id === resetFor ? null : user.id)}
                  >
                    Reset password
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={user.isActive ? "destructive" : "outline"}
                    onClick={async () => {
                      const result = await setStaffActive(user.id, !user.isActive);
                      if (result.status === "error") toast.error(result.error);
                      else toast.success(user.isActive ? "Deactivated" : "Activated");
                    }}
                  >
                    {user.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {resetFor && (
        <form action={handleResetPassword} className="max-w-md space-y-3 rounded-lg border p-4">
          <input type="hidden" name="staffId" value={resetFor} />
          <Label htmlFor="reset-password">New password</Label>
          <Input id="reset-password" name="password" type="password" required minLength={8} />
          <Button type="submit" disabled={resetPending}>
            {resetPending ? "Saving…" : "Update password"}
          </Button>
        </form>
      )}
    </div>
  );
}
