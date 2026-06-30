"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";

type HeaderProps = {
  phone: string;
  phoneRaw: string;
  businessName: string;
  logoUrl?: string;
};

export function Header({ phone, phoneRaw, businessName, logoUrl }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#2A2A2A] bg-[#1A1A1A]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3 font-display text-lg font-bold uppercase tracking-wide text-white md:text-xl">
          {logoUrl ? (
            <img src={logoUrl} alt={businessName} className="h-10 w-10 rounded-full object-cover" />
          ) : null}
          <span>{businessName}</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-white/80 transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href={`tel:${phoneRaw}`} className="hidden items-center gap-2 text-sm font-semibold text-white md:flex">
            <Phone className="h-4 w-4 text-accent" />
            {phone}
          </a>
          <a href={`tel:${phoneRaw}`} className="btn-primary hidden text-xs sm:inline-flex">
            Call Now
          </a>
          <button
            type="button"
            className="rounded p-2 text-white lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-[#2A2A2A] px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/80"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <a href={`tel:${phoneRaw}`} className="btn-primary mt-2 w-full">
              Call {phone}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
