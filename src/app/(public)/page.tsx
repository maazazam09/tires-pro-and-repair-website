import { HeroSection } from "@/components/home/HeroSection";
import { CollectionsShowcase } from "@/components/home/CollectionsShowcase";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { GalleryTeaser } from "@/components/home/GalleryTeaser";
import { Testimonials } from "@/components/home/Testimonials";
import { CTABanner } from "@/components/home/CTABanner";
import { ContactForm } from "@/components/forms/ContactForm";
import { getCollectionSections, getGalleryItems, getHero, getReviews, getServices, getSiteSettings } from "@/lib/data";
import { getLocalBusinessJsonLd, buildMetadata } from "@/lib/seo";
import { phoneToRaw } from "@/lib/phone";

export async function generateMetadata() {
  return buildMetadata("/", {
    title: "Tire Pro and Repair | Tires & Wheels Chico CA",
    description: "Best prices on new & used tires, custom wheels, brakes & alignment in Chico, CA. Same-day service.",
  });
}

export default async function HomePage() {
  const [hero, collections, services, gallery, reviews, settings] = await Promise.all([
    getHero(),
    getCollectionSections(),
    getServices(),
    getGalleryItems(6),
    getReviews(),
    getSiteSettings(),
  ]);
  const phoneRaw = phoneToRaw(settings.phone);
  const jsonLd = await getLocalBusinessJsonLd();
  const homepageSections = collections.map((section) => ({
    ...section,
    imageUrl:
      section.key === "tires"
        ? "/uploads/mk9.jfif"
        : section.key === "wheels"
        ? "/assets/custom-wheels-showroom.png"
        : section.imageUrl,
  }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HeroSection hero={hero} phoneRaw={phoneRaw} />
      <CollectionsShowcase sections={homepageSections} />
      <ServicesGrid services={services} />
      <GalleryTeaser items={gallery} />
      <Testimonials reviews={reviews} />
      <section className="border-t border-[#e5e5e5] bg-white py-10 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display break-words text-2xl font-bold uppercase tracking-tight text-[#1A1A1A] sm:text-3xl md:text-4xl">Booking</h2>
            <p className="mt-3 text-sm text-[#444] sm:text-base">
              Tell us what service you need and request a visit slot. We&apos;ll reply to confirm whether that time is available.
            </p>
            <div className="mt-6 overflow-hidden rounded-lg border border-[#d6d6d6]">
              <iframe
                title="Tire Pro and Repair Location"
                src="https://maps.google.com/maps?q=821+Cherry+St+Chico+CA+95928&output=embed"
                className="h-64 w-full"
                loading="lazy"
              />
            </div>
          </div>
          <ContactForm type="quote" variant="light" />
        </div>
      </section>
      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Follow Our Latest Installs</h2>
          <p className="mt-2 text-metallic">@tireproandrepair on Instagram</p>
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-6 inline-flex"
          >
            View on Instagram
          </a>
        </div>
      </section>
      <CTABanner phone={settings.phone} phoneRaw={phoneRaw} />
    </>
  );
}
