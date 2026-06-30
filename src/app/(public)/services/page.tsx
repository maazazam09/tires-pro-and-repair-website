import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { CTABanner } from "@/components/home/CTABanner";
import { getServices, getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { phoneToRaw } from "@/lib/phone";

export async function generateMetadata() {
  return buildMetadata("/services", {
    title: "Auto Services | Tire Pro and Repair Chico",
    description: "Tires, wheels, brakes, alignment, and suspension in Chico, CA.",
  });
}

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([getServices(), getSiteSettings()]);
  const phoneRaw = phoneToRaw(settings.phone);

  return (
    <>
      <PageHeader title="Our Services" subtitle="Expert tire and auto service with competitive Chico pricing." />
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link key={service.id} href={`/services/${service.slug}`} className="card group hover:border-accent/50">
              <Wrench className="mb-4 h-8 w-8 text-accent" />
              <h2 className="font-display text-xl font-bold uppercase text-foreground">{service.title}</h2>
              <p className="mt-2 text-sm text-metallic">{service.summary}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                Details <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <CTABanner phone={settings.phone} phoneRaw={phoneRaw} />
    </>
  );
}
