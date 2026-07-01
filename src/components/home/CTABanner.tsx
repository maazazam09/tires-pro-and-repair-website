import Link from "next/link";
import { Calendar, Phone } from "lucide-react";
import { BOOKING_PATH } from "@/lib/constants";

type CTABannerProps = {
  phone: string;
  phoneRaw: string;
};

export function CTABanner({ phone, phoneRaw }: CTABannerProps) {
  return (
    <section className="bg-accent py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <h2 className="font-display break-words text-2xl font-bold uppercase text-white sm:text-3xl md:text-4xl">
          Get Back on the Road Today
        </h2>
        <p className="mt-3 text-sm text-white/90 sm:text-base">Same-day service - Best prices in Chico - Direct scheduling</p>
        <div className="mt-6 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
          <a href={`tel:${phoneRaw}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-bold uppercase text-accent transition hover:bg-gray-100 sm:w-auto sm:px-8">
            <Phone className="h-5 w-5 shrink-0" />
            {phone}
          </a>
          <Link href={BOOKING_PATH} className="btn-secondary w-full border-white text-white hover:border-white hover:bg-white/10 sm:w-auto">
            <Calendar className="h-5 w-5" />
            Booking
          </Link>
        </div>
      </div>
    </section>
  );
}
