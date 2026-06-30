import Link from "next/link";
import { Calendar, Phone } from "lucide-react";
import { BOOKING_PATH } from "@/lib/constants";

type CTABannerProps = {
  phone: string;
  phoneRaw: string;
};

export function CTABanner({ phone, phoneRaw }: CTABannerProps) {
  return (
    <section className="bg-accent py-12">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <h2 className="font-display text-3xl font-bold uppercase text-white md:text-4xl">
          Get Back on the Road Today
        </h2>
        <p className="mt-3 text-white/90">Same-day service - Best prices in Chico - Direct scheduling</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href={`tel:${phoneRaw}`} className="inline-flex items-center gap-2 rounded-md bg-white px-8 py-3 text-sm font-bold uppercase text-accent transition hover:bg-gray-100">
            <Phone className="h-5 w-5" />
            {phone}
          </a>
          <Link href={BOOKING_PATH} className="btn-secondary border-white text-white hover:border-white hover:bg-white/10">
            <Calendar className="h-5 w-5" />
            Booking
          </Link>
        </div>
      </div>
    </section>
  );
}
