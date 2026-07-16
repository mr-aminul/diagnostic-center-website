"use client";

import { MobileBottomNav } from "@/components/site/mobile-bottom-nav";
import { WhatsappButton } from "@/components/site/whatsapp-button";
import { Toaster } from "@/components/ui/sonner";

/** Persistent client chrome — stays mounted across soft navigations. */
export function SiteChrome() {
  return (
    <>
      <MobileBottomNav />
      <WhatsappButton />
      <Toaster />
    </>
  );
}
