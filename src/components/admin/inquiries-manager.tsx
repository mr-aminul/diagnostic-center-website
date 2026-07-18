"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Reply } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import {
  deleteInquiry,
  markInquiryRead,
  markInquiryUnread,
  replyToInquiry,
  type ReplyInquiryState,
} from "@/app/admin/(protected)/inquiries/actions";
import { formatDateTime } from "@/lib/format";

export interface AdminInquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  isRead: boolean;
  repliedAt: Date | string | null;
  replyBody: string | null;
  replyChannel: "EMAIL" | "SMS" | null;
  createdAt: Date | string;
}

const initialReplyState: ReplyInquiryState = { status: "idle" };

export function InquiriesManager({
  inquiries,
}: {
  inquiries: AdminInquiry[];
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-52" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.map((inquiry) => (
              <TableRow key={inquiry.id} className={inquiry.isRead ? "" : "bg-primary/5"}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDateTime(inquiry.createdAt)}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{inquiry.name}</p>
                  <p className="text-xs text-muted-foreground">{inquiry.phone}</p>
                  {inquiry.email ? (
                    <p className="text-xs text-muted-foreground">{inquiry.email}</p>
                  ) : null}
                </TableCell>
                <TableCell className="max-w-lg space-y-2 text-sm">
                  <p>{inquiry.message}</p>
                  {inquiry.repliedAt && inquiry.replyBody ? (
                    <div className="rounded-md border border-border/80 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      <p className="mb-1 font-medium text-foreground">
                        Replied via {inquiry.replyChannel === "SMS" ? "SMS" : "email"} ·{" "}
                        {formatDateTime(inquiry.repliedAt)}
                      </p>
                      <p className="whitespace-pre-wrap">{inquiry.replyBody}</p>
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <Badge variant={inquiry.isRead ? "secondary" : "default"}>
                      {inquiry.isRead ? "Read" : "New"}
                    </Badge>
                    {inquiry.repliedAt ? (
                      <Badge variant="outline">Replied</Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <ReplyInquiryButton inquiry={inquiry} />
                    <ToggleReadButton inquiry={inquiry} />
                    <ConfirmDeleteButton action={deleteInquiry.bind(null, inquiry.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {inquiries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No inquiries yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ReplyInquiryButton({ inquiry }: { inquiry: AdminInquiry }) {
  const [open, setOpen] = useState(false);
  const defaultChannel = inquiry.email ? "email" : "sms";
  const [channel, setChannel] = useState<"email" | "sms">(defaultChannel);
  const [state, formAction, isPending] = useActionState(replyToInquiry, initialReplyState);

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
      toast.success(
        state.channel === "email" ? "Reply emailed." : "Reply sent by SMS."
      );
    } else if (state.status === "error" && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setChannel(inquiry.email ? "email" : "sms");
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" size="sm" variant={inquiry.repliedAt ? "outline" : "default"} />
        }
      >
        <Reply className="h-3.5 w-3.5" />
        {inquiry.repliedAt ? "Reply again" : "Reply"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reply to {inquiry.name}</DialogTitle>
          <DialogDescription>
            Send a response by {inquiry.email ? "email or SMS" : "SMS"}. The inquiry will be
            marked as read.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="inquiryId" value={inquiry.id} />
          <input type="hidden" name="channel" value={channel} />

          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <p className="text-xs font-medium text-muted-foreground">Original message</p>
            <p className="mt-1 whitespace-pre-wrap">{inquiry.message}</p>
          </div>

          <div className="space-y-2">
            <Label>Send via</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={channel === "email" ? "default" : "outline"}
                disabled={!inquiry.email}
                onClick={() => setChannel("email")}
              >
                Email{inquiry.email ? ` · ${inquiry.email}` : " (not provided)"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={channel === "sms" ? "default" : "outline"}
                onClick={() => setChannel("sms")}
              >
                SMS · {inquiry.phone}
              </Button>
            </div>
          </div>

          {channel === "email" ? (
            <div className="space-y-2">
              <Label htmlFor={`subject-${inquiry.id}`}>Subject</Label>
              <Input
                id={`subject-${inquiry.id}`}
                name="subject"
                placeholder="Re: Your inquiry"
                maxLength={200}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={`body-${inquiry.id}`}>Your reply</Label>
            <Textarea
              id={`body-${inquiry.id}`}
              name="body"
              required
              maxLength={2000}
              placeholder={
                channel === "sms"
                  ? "Keep it short — SMS length is limited."
                  : "Write your response to the patient…"
              }
              className="min-h-32"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending…" : channel === "email" ? "Send email" : "Send SMS"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ToggleReadButton({ inquiry }: { inquiry: AdminInquiry }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = inquiry.isRead
            ? await markInquiryUnread(inquiry.id)
            : await markInquiryRead(inquiry.id);
          if (result.error) toast.error(result.error);
        });
      }}
    >
      {inquiry.isRead ? "Mark unread" : "Mark read"}
    </Button>
  );
}
