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
    <section className="relative min-h-[70vh] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(26,26,26,0.94), rgba(26,26,26,0.62)), url('${hero.mediaUrl}')`,
        }}
      />
      <div className="relative mx-auto flex max-w-7xl flex-col justify-center px-4 py-20 md:min-h-[75vh] md:py-28">
        <p className="mb-4 text-sm font-bold uppercase tracking-widest text-accent">Chico&apos;s Tire &amp; Wheel Experts</p>
        <h1 className="font-display max-w-4xl text-4xl font-bold uppercase leading-tight text-white md:text-6xl">
          {hero.headline}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-metallic md:text-xl">{hero.subheadline}</p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <a href={`tel:${phoneRaw}`} className="btn-primary text-base">
            <Phone className="h-5 w-5" />
            {hero.ctaCallLabel}
          </a>
          <Link href={BOOKING_PATH} className="btn-secondary text-base">
            <Calendar className="h-5 w-5" />
            Booking
          </Link>
        </div>
      </div>
    </section>
  );
}