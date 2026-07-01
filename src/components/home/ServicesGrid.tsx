import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import type { Service } from "@/generated/prisma/browser";

export function ServicesGrid({ services }: { services: Service[] }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="section-title">Our Services</h2>
            <p className="mt-2 text-sm text-metallic sm:text-base">Everything you need to get back on the road — fast.</p>
          </div>
          <Link href="/services" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent hover:underline sm:min-h-0 md:flex">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="card group transition hover:border-accent/50 hover:bg-card/80"
            >
              <Wrench className="mb-4 h-8 w-8 text-accent" />
              <h3 className="font-display break-words text-lg font-bold uppercase text-foreground sm:text-xl">{service.title}</h3>
              <p className="mt-2 break-words text-sm text-metallic">{service.summary}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                Learn More <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
