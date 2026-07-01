"use client";

import Link from "next/link";
import { Calendar, Phone } from "lucide-react";
import { BOOKING_PATH } from "@/lib/constants";

type StickyCTAProps = {
  phoneRaw: string;
};

export function StickyCTA({ phoneRaw }: StickyCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex gap-2 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <a href={`tel:${phoneRaw}`} className="btn-primary min-h-12 flex-1 text-sm">
        <Phone className="h-4 w-4 shrink-0" />
        Call Now
      </a>
      <Link href={BOOKING_PATH} className="btn-secondary min-h-12 flex-1 text-sm">
        <Calendar className="h-4 w-4 shrink-0" />
        Booking
      </Link>
    </div>
  );
}
