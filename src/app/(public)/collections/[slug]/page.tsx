import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { ShopClient } from "@/components/shop/ShopClient";
import { getCollectionByKey, getProductsByCategory, getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { phoneToRaw } from "@/lib/phone";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

function slugToCategory(slug: string) {
  if (slug === "tires") return "TIRE";
  if (slug === "wheels") return "WHEEL";
  return slug.toUpperCase();
}

export async function generateMetadata({ params }: CollectionPageProps) {
  const { slug } = await params;
  const section = await getCollectionByKey(slug);
  return buildMetadata(`/collections/${slug}`, {
    title: section?.title ?? slug,
    description: section?.description ?? `Browse ${slug} at Tire Pro and Repair in Chico, CA.`,
  });
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const section = await getCollectionByKey(slug);
  if (!section || !section.active) notFound();

  const category = slugToCategory(slug);
  const [products, settings] = await Promise.all([
    getProductsByCategory(category),
    getSiteSettings(),
  ]);
  const phoneRaw = phoneToRaw(settings.phone);

  return (
    <>
      <PageHeader title={section.title} subtitle={section.itemName} />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 border-l-4 border-accent bg-white px-5 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:px-6">
            <h2 className="font-display text-xl font-bold uppercase text-foreground sm:text-2xl">
              Every Brand. Every Size. Professionally Installed.
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-metallic sm:text-base">
              Looking for a specific tire or wheel? We can source almost any brand, size, or style and have it ready for
              professional installation at Tire Pro and Repair. Call us today to check availability.
            </p>
          </div>
          <ShopClient products={products} phoneRaw={phoneRaw} showFilters={false} />
        </div>
      </section>
    </>
  );
}
