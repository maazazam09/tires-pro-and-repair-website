"use client";

import Link from "next/link";
import { Calendar, Phone } from "lucide-react";
import type { Hero } from "@/generated/prisma/browser";
import { BOOKING_PATH } from "@/lib/constants";

type HeroSectionProps = {
  hero: Hero;
  phoneRaw: string;
};

const defaultHeroMediaUrls = new Set(["/uploads/hero.png", "/images/hero-wheel.jpg", "/assets/tire-pro-repair-hero.png"]);
const brandedHeroMediaUrl = "/assets/tire-pro-repair-hero-branded.png";

export function HeroSection({ hero, phoneRaw }: HeroSectionProps) {
  const heroMediaUrl = defaultHeroMediaUrls.has(hero.mediaUrl) ? brandedHeroMediaUrl : hero.mediaUrl;

  return (
    <section className="relative min-h-[68vh] overflow-hidden bg-[#111] sm:min-h-[74vh]">
      <div
        className="absolute inset-0 bg-cover bg-[68%_center] bg-no-repeat sm:bg-center"
        style={{ backgroundImage: `url('${heroMediaUrl}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0b]/62 via-[#111]/38 to-[#111]/90 sm:bg-gradient-to-r sm:from-[#0b0b0b]/28 sm:via-[#111]/36 sm:to-[#111]/20" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0b0b0b] to-transparent" />
      <div className="relative mx-auto flex min-h-[68vh] w-full max-w-[86rem] flex-col justify-end px-4 pb-10 pt-72 sm:min-h-[74vh] sm:px-6 sm:pb-16 sm:pt-80 md:px-8 lg:pb-20">
        <h1 className="sr-only">Tire Pro and Repair</h1>
        <p className="max-w-3xl break-words font-display text-xl font-bold uppercase leading-tight text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.75)] sm:text-2xl md:text-4xl">
          {hero.headline}
        </p>
        <p className="mt-3 max-w-2xl break-words text-base font-semibold text-white/85 sm:mt-4 sm:text-lg md:text-xl">{hero.subheadline}</p>
        <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:mt-8 sm:max-w-none sm:flex-row sm:gap-4">
          <a href={`tel:${phoneRaw}`} className="btn-primary w-full text-base sm:w-auto">
            <Phone className="h-5 w-5 shrink-0" />
            {hero.ctaCallLabel}
          </a>
          <Link href={BOOKING_PATH} className="btn-secondary w-full border-white/75 bg-white/10 text-base text-white backdrop-blur-sm hover:border-white hover:bg-white/20 sm:w-auto">
            <Calendar className="h-5 w-5 shrink-0" />
            Booking
          </Link>
        </div>
      </div>
    </section>
  );
}
