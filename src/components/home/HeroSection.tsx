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
const brandedMobileHeroMediaUrl = "/assets/tire-pro-repair-hero-mobile.png";

export function HeroSection({ hero, phoneRaw }: HeroSectionProps) {
  const usesDefaultHero = defaultHeroMediaUrls.has(hero.mediaUrl);
  const heroMediaUrl = usesDefaultHero ? brandedHeroMediaUrl : hero.mediaUrl;
  const mobileHeroMediaUrl = usesDefaultHero ? brandedMobileHeroMediaUrl : heroMediaUrl;

  return (
    <section className="relative min-h-[65svh] overflow-hidden bg-[#111] md:min-h-[74vh]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{ backgroundImage: `url('${mobileHeroMediaUrl}')` }}
      />
      <div
        className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat md:block"
        style={{ backgroundImage: `url('${heroMediaUrl}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0b]/34 via-[#111]/18 to-[#111]/92 md:bg-gradient-to-r md:from-[#0b0b0b]/28 md:via-[#111]/36 md:to-[#111]/20" />
      <div className="absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/76 to-transparent md:h-28" />
      <div className="relative mx-auto flex min-h-[65svh] w-full max-w-[86rem] flex-col justify-end px-[max(1rem,env(safe-area-inset-left))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1.25rem))] pt-[clamp(10rem,32svh,16rem)] md:min-h-[74vh] md:px-8 md:pb-16 md:pt-80 lg:pb-20">
        <h1 className="sr-only">Tire Pro and Repair</h1>
        <p className="max-w-[min(92vw,25rem)] break-words font-display text-[clamp(1.18rem,5.5vw,1.65rem)] font-bold uppercase leading-[1.04] text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.75)] md:max-w-3xl md:text-4xl md:leading-tight">
          {hero.headline}
        </p>
        <p className="mt-2 max-w-[min(90vw,23rem)] break-words text-[clamp(0.92rem,3.8vw,1.08rem)] font-semibold leading-snug text-white/85 md:mt-4 md:max-w-2xl md:text-xl md:leading-normal">{hero.subheadline}</p>
        <div className="mt-5 flex w-[min(100%,22rem)] flex-col gap-3 md:mt-8 md:w-full md:max-w-none md:flex-row md:gap-4">
          <a href={`tel:${phoneRaw}`} className="btn-primary min-h-12 w-full text-[clamp(0.9rem,3.8vw,1rem)] md:min-h-11 md:w-auto md:text-base">
            <Phone className="h-5 w-5 shrink-0" />
            {hero.ctaCallLabel}
          </a>
          <Link href={BOOKING_PATH} className="btn-secondary min-h-12 w-full border-white/75 bg-white/10 text-[clamp(0.9rem,3.8vw,1rem)] text-white backdrop-blur-sm hover:border-white hover:bg-white/20 md:min-h-11 md:w-auto md:text-base">
            <Calendar className="h-5 w-5 shrink-0" />
            Booking
          </Link>
        </div>
      </div>
    </section>
  );
}
