import { PageHeader } from "@/components/shared/PageHeader";
import { ShopClient } from "@/components/shop/ShopClient";
import { CTABanner } from "@/components/home/CTABanner";
import { getProducts, getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { phoneToRaw } from "@/lib/phone";

export async function generateMetadata() {
  return buildMetadata("/shop", {
    title: "Shop Tires & Wheels | Tire Pro Chico CA",
    description: "Browse new and used tires, custom wheels and packages. Call us for availability.",
  });
}

export default async function ShopPage() {
  const [products, settings] = await Promise.all([getProducts(), getSiteSettings()]);
  const phoneRaw = phoneToRaw(settings.phone);

  return (
    <>
      <PageHeader
        title="Shop Tires & Wheels"
        subtitle="Filter by brand, size, and type. Call or book a call to purchase."
      />
      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <ShopClient products={products} phoneRaw={phoneRaw} />
        </div>
      </section>
      <CTABanner phone={settings.phone} phoneRaw={phoneRaw} />
    </>
  );
}
