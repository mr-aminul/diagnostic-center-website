"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CmsHomeCollectionContent, CmsStepKey } from "@/lib/cms/types";
import { updateHomeCollectionContent } from "@/app/admin/(protected)/content/home-collection/actions";
import type { EntityFormState } from "@/components/admin/entity-form-dialog";

const idle: EntityFormState = { status: "idle" };

const STEPS: Array<{ key: CmsStepKey; label: string; titleEn: string; titleBn: string; descEn: string; descBn: string }> = [
  {
    key: "book",
    label: "Step 1 — Book",
    titleEn: "stepBookTitleEn",
    titleBn: "stepBookTitleBn",
    descEn: "stepBookDescEn",
    descBn: "stepBookDescBn",
  },
  {
    key: "confirm",
    label: "Step 2 — Confirm",
    titleEn: "stepConfirmTitleEn",
    titleBn: "stepConfirmTitleBn",
    descEn: "stepConfirmDescEn",
    descBn: "stepConfirmDescBn",
  },
  {
    key: "collect",
    label: "Step 3 — Collect",
    titleEn: "stepCollectTitleEn",
    titleBn: "stepCollectTitleBn",
    descEn: "stepCollectDescEn",
    descBn: "stepCollectDescBn",
  },
  {
    key: "report",
    label: "Step 4 — Report",
    titleEn: "stepReportTitleEn",
    titleBn: "stepReportTitleBn",
    descEn: "stepReportDescEn",
    descBn: "stepReportDescBn",
  },
];

export function HomeCollectionContentForm({
  content,
}: {
  content: CmsHomeCollectionContent;
}) {
  const [state, action, pending] = useActionState(updateHomeCollectionContent, idle);

  useEffect(() => {
    if (state.status === "success") toast.success("Home collection page saved.");
    if (state.status === "error" && state.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Home collection page</h1>
        <p className="text-sm text-muted-foreground">
          Marketing copy for /home-collection. Toggle the page in Site settings → Features.
        </p>
      </div>

      <form action={action} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hero</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="titleEn">Title (English)</Label>
              <Input id="titleEn" name="titleEn" required defaultValue={content.title.en} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="titleBn">Title (Bangla)</Label>
              <Input id="titleBn" name="titleBn" defaultValue={content.title.bn} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="subtitleEn">Subtitle (English)</Label>
              <Textarea
                id="subtitleEn"
                name="subtitleEn"
                required
                rows={2}
                defaultValue={content.subtitle.en}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="subtitleBn">Subtitle (Bangla)</Label>
              <Textarea
                id="subtitleBn"
                name="subtitleBn"
                rows={2}
                defaultValue={content.subtitle.bn}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaEn">CTA button (English)</Label>
              <Input id="ctaEn" name="ctaEn" required defaultValue={content.cta.en} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaBn">CTA button (Bangla)</Label>
              <Input id="ctaBn" name="ctaBn" defaultValue={content.cta.bn} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="howItWorksTitleEn">How it works title (English)</Label>
              <Input
                id="howItWorksTitleEn"
                name="howItWorksTitleEn"
                required
                defaultValue={content.howItWorksTitle.en}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="howItWorksTitleBn">How it works title (Bangla)</Label>
              <Input
                id="howItWorksTitleBn"
                name="howItWorksTitleBn"
                defaultValue={content.howItWorksTitle.bn}
              />
            </div>
          </CardContent>
        </Card>

        {STEPS.map((step) => {
          const data = content.steps[step.key];
          return (
            <Card key={step.key}>
              <CardHeader>
                <CardTitle className="text-base">{step.label}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={step.titleEn}>Title (English)</Label>
                  <Input id={step.titleEn} name={step.titleEn} required defaultValue={data.title.en} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={step.titleBn}>Title (Bangla)</Label>
                  <Input id={step.titleBn} name={step.titleBn} defaultValue={data.title.bn} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={step.descEn}>Description (English)</Label>
                  <Textarea id={step.descEn} name={step.descEn} required rows={2} defaultValue={data.desc.en} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={step.descBn}>Description (Bangla)</Label>
                  <Textarea id={step.descBn} name={step.descBn} rows={2} defaultValue={data.desc.bn} />
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save home collection page"}
        </Button>
      </form>
    </div>
  );
}
