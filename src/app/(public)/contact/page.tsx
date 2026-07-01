import { Phone, MapPin, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ContactForm } from "@/components/forms/ContactForm";
import { getSiteSettings } from "@/lib/data";
import { ShopHoursList } from "@/components/shared/ShopHoursList";
import { buildMetadata } from "@/lib/seo";
import { phoneToRaw } from "@/lib/phone";

export async function generateMetadata() {
  return buildMetadata("/contact", {
    title: "Contact & Location | Tire Pro Chico CA",
    description: "Visit us at 821 Cherry St, Chico CA. Call (530) 717-1765 or request a booking.",
  });
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const phoneRaw = phoneToRaw(settings.phone);
  const fullAddress = `${settings.address}, ${settings.city}, ${settings.state} ${settings.zip}`;

  return (
    <>
      <PageHeader title="Contact Us" subtitle="Call, visit, or send us a message — we respond fast." />
      <section id="booking" className="scroll-mt-24 border-b border-[#e5e5e5] bg-white py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 max-w-2xl sm:mb-8">
            <h2 className="font-display break-words text-2xl font-bold uppercase tracking-tight text-[#1A1A1A] sm:text-3xl md:text-4xl">Booking</h2>
            <p className="mt-3 text-sm text-[#444] sm:text-base">
              Send your details, service needed, and preferred visit slot. We&apos;ll reply to confirm whether that time is available.
            </p>
          </div>
          <ContactForm type="quote" variant="light" />
        </div>
      </section>
      <section className="py-10 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:gap-10 lg:grid-cols-2">
          <div className="space-y-4 sm:space-y-6">
            <a href={`tel:${phoneRaw}`} className="card flex min-h-11 items-center gap-4 hover:border-accent/50">
              <Phone className="h-8 w-8 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="text-sm text-metallic">Call Now</p>
                <p className="break-words text-lg font-bold text-foreground sm:text-xl">{settings.phone}</p>
              </div>
            </a>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex min-h-11 items-start gap-4 hover:border-accent/50"
            >
              <MapPin className="h-8 w-8 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="text-sm text-metallic">Visit Us</p>
                <p className="break-words text-base font-bold text-foreground sm:text-lg">{fullAddress}</p>
              </div>
            </a>
            <div className="card">
              <div className="flex items-center gap-4 mb-4">
                <Clock className="h-8 w-8 text-accent" />
                <p className="text-lg font-bold text-foreground">Hours</p>
              </div>
              <ShopHoursList
                hoursJson={settings.hoursJson}
                className="space-y-2"
                itemClassName="flex justify-between text-sm text-metallic"
              />
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <iframe
                title="Map"
                src="https://maps.google.com/maps?q=821+Cherry+St+Chico+CA+95928&output=embed"
                className="h-72 w-full"
                loading="lazy"
              />
            </div>
          </div>
          <ContactForm type="contact" />
        </div>
      </section>
    </>
  );
}
