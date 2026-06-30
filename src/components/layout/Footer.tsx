import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { ShopHoursList } from "@/components/shared/ShopHoursList";

type FooterProps = {
  businessName: string;
  phone: string;
  phoneRaw: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  hoursJson: string;
  instagramUrl: string;
  facebookUrl: string;
};

export function Footer({
  businessName,
  phone,
  phoneRaw,
  address,
  city,
  state,
  zip,
  hoursJson,
  instagramUrl,
  facebookUrl,
}: FooterProps) {
  const fullAddress = `${address}, ${city}, ${state} ${zip}`;

  return (
    <footer className="mt-auto border-t border-[#2A2A2A] bg-[#1A1A1A]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-display text-lg font-bold uppercase text-white">{businessName}</h3>
          <p className="mt-3 text-sm text-white/75">
            Best prices on new &amp; used tires, custom wheels, and full auto service in Chico, CA.
          </p>
          <div className="mt-4 flex gap-3">
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-white/75 hover:text-accent">
                Instagram
              </a>
            )}
            {facebookUrl && (
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-white/75 hover:text-accent">
                Facebook
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase text-white">Quick Links</h4>
          <ul className="mt-3 space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/75 hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase text-white">Hours</h4>
          <ShopHoursList
            hoursJson={hoursJson}
            className="mt-3 space-y-1"
            itemClassName="flex justify-between gap-4 text-sm text-white/75"
          />
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase text-white">Contact</h4>
          <div className="mt-3 space-y-3 text-sm text-white/75">
            <a href={`tel:${phoneRaw}`} className="flex items-center gap-2 hover:text-white">
              <Phone className="h-4 w-4 text-accent" />
              {phone}
            </a>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                {fullAddress}
              </a>
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-[#2A2A2A] px-4 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {businessName}. All rights reserved.
      </div>
    </footer>
  );
}
