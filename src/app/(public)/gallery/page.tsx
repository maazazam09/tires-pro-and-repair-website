import Image from "next/image";
import { PageHeader } from "@/components/shared/PageHeader";
import { CTABanner } from "@/components/home/CTABanner";
import { getGalleryItems, getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { phoneToRaw } from "@/lib/phone";

export async function generateMetadata() {
  return buildMetadata("/gallery", {
    title: "Wheel Install Gallery | Tire Pro Chico",
    description: "See our latest custom wheel installs and tire work.",
  });
}

export default async function GalleryPage() {
  const [items, settings] = await Promise.all([getGalleryItems(), getSiteSettings()]);
  const phoneRaw = phoneToRaw(settings.phone);

  return (
    <>
      <PageHeader title="Install Gallery" subtitle="Custom wheels, tire installs, and builds from our Chico shop." />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          {items.length === 0 ? (
            <p className="text-center text-metallic">
              Gallery coming soon. Follow{" "}
              <a href={settings.instagramUrl} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                @tireproandrepair
              </a>{" "}
              on Instagram.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg bg-card">
                  <Image src={item.mediaUrl} alt={item.caption || "Install"} fill className="object-cover transition group-hover:scale-105" />
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-3">
                      <p className="text-xs text-white">{item.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-12 text-center">
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex">
              Follow @tireproandrepair
            </a>
          </div>
        </div>
      </section>
      <CTABanner phone={settings.phone} phoneRaw={phoneRaw} />
    </>
  );
}