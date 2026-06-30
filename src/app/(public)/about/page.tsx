import { PageHeader } from "@/components/shared/PageHeader";
import { ShopHoursList } from "@/components/shared/ShopHoursList";
import { CTABanner } from "@/components/home/CTABanner";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { phoneToRaw } from "@/lib/phone";

export async function generateMetadata() {
  return buildMetadata("/about", {
    title: "About Us | Tire Pro and Repair Chico",
    description: "Local Chico tire shop with better prices than big chains and better service than anyone.",
  });
}

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const phoneRaw = phoneToRaw(settings.phone);
  const defaultAbout = `Tire Pro and Repair is Chico's go-to shop for new and used tires, custom wheels, and full automotive service. Located at ${settings.address}, we've built our reputation on honest pricing, fast turnaround, and installs that turn heads.

Whether you drive a daily commuter, a lifted truck, or a performance Mustang, our team delivers the right tires and wheels at the right price — with same-day service when you need it most.`;

  return (
    <>
      <PageHeader title="About Tire Pro and Repair" subtitle={settings.tagline} />
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 space-y-6 text-lg leading-relaxed text-metallic">
          <p className="whitespace-pre-line">{settings.aboutContent || defaultAbout}</p>
          <div className="grid gap-4 sm:grid-cols-3 pt-6">
            <div className="card text-center">
              <p className="font-display text-3xl font-bold text-accent">{settings.averageRating}</p>
              <p className="mt-1 text-sm text-metallic">Star Rating</p>
            </div>
            <div className="card text-center">
              <p className="font-display text-3xl font-bold text-accent">{settings.reviewCount}+</p>
              <p className="mt-1 text-sm text-metallic">Happy Customers</p>
            </div>
            <div className="card text-center">
              <p className="font-display text-3xl font-bold text-accent">7</p>
              <p className="mt-1 text-sm text-metallic">Days a Week</p>
            </div>
          </div>
          <div className="card pt-6">
            <h2 className="font-display text-xl font-bold uppercase text-foreground">Shop Hours</h2>
            <p className="mt-2 text-sm text-metallic">Open every day of the week.</p>
            <ShopHoursList
              hoursJson={settings.hoursJson}
              className="mt-4 space-y-2"
              itemClassName="flex justify-between gap-4 text-sm text-metallic"
            />
          </div>
        </div>
      </section>
      <CTABanner phone={settings.phone} phoneRaw={phoneRaw} />
    </>
  );
}