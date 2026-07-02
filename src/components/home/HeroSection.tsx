"use client";

import Link from "next/link";
import { Calendar, Phone } from "lucide-react";
import type { Hero } from "@/generated/prisma/browser";
import { BOOKING_PATH } from "@/lib/constants";

type HeroSectionProps = {
  hero: Hero;
  phoneRaw: string;
};

export function HeroSection({ hero, phoneRaw }: HeroSectionProps) {
  return (
    <section className="relative min-h-[60vh] overflow-hidden sm:min-h-[70vh]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${hero.mediaUrl}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A]/92 to-[#1A1A1A]/78 sm:bg-gradient-to-r sm:from-[#1A1A1A]/94 sm:to-[#1A1A1A]/62" />
      <div className="relative mx-auto flex max-w-7xl flex-col justify-center px-4 py-12 sm:min-h-[70vh] sm:py-20 md:min-h-[75vh] md:py-28">
        <h1 className="font-display max-w-4xl break-words text-3xl font-bold uppercase leading-tight text-white sm:text-4xl md:text-6xl">
          {hero.headline}
        </h1>
        <p className="mt-3 max-w-2xl break-words text-base text-metallic sm:mt-4 sm:text-lg md:text-xl">{hero.subheadline}</p>
        <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:mt-8 sm:max-w-none sm:flex-row sm:gap-4">
          <a href={`tel:${phoneRaw}`} className="btn-primary w-full text-base sm:w-auto">
            <Phone className="h-5 w-5 shrink-0" />
            {hero.ctaCallLabel}
          </a>
          <Link href={BOOKING_PATH} className="btn-secondary w-full text-base sm:w-auto">
            <Calendar className="h-5 w-5 shrink-0" />
            Booking
          </Link>
        </div>
      </div>
    </section>
  );
}
