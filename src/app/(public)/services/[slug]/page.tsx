import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { CTABanner } from "@/components/home/CTABanner";
import { getServiceBySlug, getSiteSettings } from "@/lib/data";
import { BOOKING_PATH } from "@/lib/constants";
import { phoneToRaw } from "@/lib/phone";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  return {
    title: `${service.title} | Tire Pro Chico`,
    description: service.summary,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const [service, settings] = await Promise.all([getServiceBySlug(slug), getSiteSettings()]);
  if (!service || !service.active) notFound();
  const phoneRaw = phoneToRaw(settings.phone);
  const serviceContent = service.content?.trim()
    ? service.content
    : service.slug === "wheels"
    ? "Upgrade your ride with custom wheels and rims. We carry performance, truck, and luxury styles with expert mounting and balancing. Our team will help you select the right wheel width, bolt pattern, and finish for your vehicle, then install and balance them precisely so your car rides smoothly and looks sharp."
    : "";

  return (
    <>
      <PageHeader title={service.title} subtitle={service.summary} />
      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-3xl px-4">
          <p className="break-words text-base leading-relaxed text-metallic whitespace-pre-line sm:text-lg">{serviceContent}</p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
            <a href={`tel:${phoneRaw}`} className="btn-primary w-full sm:w-auto">Call for Pricing</a>
            <Link href={BOOKING_PATH} className="btn-secondary w-full sm:w-auto">Booking</Link>
          </div>
        </div>
      </section>
      <CTABanner phone={settings.phone} phoneRaw={phoneRaw} />
    </>
  );
}
