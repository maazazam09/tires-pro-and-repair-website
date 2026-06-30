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
      <section id="booking" className="scroll-mt-24 border-b border-[#e5e5e5] bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 max-w-2xl">
            <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-[#1A1A1A] md:text-4xl">Booking</h2>
            <p className="mt-3 text-[#444]">
              Send your details, service needed, and preferred visit slot. We&apos;ll reply to confirm whether that time is available.
            </p>
          </div>
          <ContactForm type="quote" variant="light" />
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2">
          <div className="space-y-6">
            <a href={`tel:${phoneRaw}`} className="card flex items-center gap-4 hover:border-accent/50">
              <Phone className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm text-metallic">Call Now</p>
                <p className="text-xl font-bold text-foreground">{settings.phone}</p>
              </div>
            </a>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-center gap-4 hover:border-accent/50"
            >
              <MapPin className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm text-metallic">Visit Us</p>
                <p className="text-lg font-bold text-foreground">{fullAddress}</p>
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
