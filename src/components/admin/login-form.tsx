"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginFormState } from "@/app/admin/(public)/login/actions";
import { DEV_SAMPLE, demoDefault } from "@/lib/dev-tools";

const initialState: LoginFormState = { status: "idle" };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          autoFocus
          defaultValue={demoDefault(DEV_SAMPLE.adminPhone)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          defaultValue={demoDefault(DEV_SAMPLE.adminPassword)}
        />
      </div>
      {state.status === "error" && (
        <p className="text-sm text-destructive">Invalid phone number or password.</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
