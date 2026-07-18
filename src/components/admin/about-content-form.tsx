"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CmsAboutContent } from "@/lib/cms/types";
import { updateAboutContent } from "@/app/admin/(protected)/content/about/actions";
import type { EntityFormState } from "@/components/admin/entity-form-dialog";

const idle: EntityFormState = { status: "idle" };

export function AboutContentForm({ about }: { about: CmsAboutContent }) {
  const [state, action, pending] = useActionState(updateAboutContent, idle);

  useEffect(() => {
    if (state.status === "success") toast.success("About page saved.");
    if (state.status === "error" && state.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="missionTitleEn">Mission title (English)</Label>
              <Input
                id="missionTitleEn"
                name="missionTitleEn"
                required
                defaultValue={about.missionTitle.en}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="missionTitleBn">Mission title (Bangla)</Label>
              <Input
                id="missionTitleBn"
                name="missionTitleBn"
                defaultValue={about.missionTitle.bn}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="missionBodyEn">Mission body (English)</Label>
              <Textarea
                id="missionBodyEn"
                name="missionBodyEn"
                required
                rows={3}
                defaultValue={about.missionBody.en}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="missionBodyBn">Mission body (Bangla)</Label>
              <Textarea
                id="missionBodyBn"
                name="missionBodyBn"
                rows={3}
                defaultValue={about.missionBody.bn}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accreditationTitleEn">Accreditation title (English)</Label>
              <Input
                id="accreditationTitleEn"
                name="accreditationTitleEn"
                required
                defaultValue={about.accreditationTitle.en}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accreditationTitleBn">Accreditation title (Bangla)</Label>
              <Input
                id="accreditationTitleBn"
                name="accreditationTitleBn"
                defaultValue={about.accreditationTitle.bn}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="accreditationBodyEn">Accreditation body (English)</Label>
              <Textarea
                id="accreditationBodyEn"
                name="accreditationBodyEn"
                required
                rows={3}
                defaultValue={about.accreditationBody.en}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="accreditationBodyBn">Accreditation body (Bangla)</Label>
              <Textarea
                id="accreditationBodyBn"
                name="accreditationBodyBn"
                rows={3}
                defaultValue={about.accreditationBody.bn}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save about page"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
