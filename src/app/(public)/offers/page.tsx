import { PageHeader } from "@/components/shared/PageHeader";
import { CTABanner } from "@/components/home/CTABanner";
import { getCoupons, getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { phoneToRaw } from "@/lib/phone";

export async function generateMetadata() {
  return buildMetadata("/offers", {
    title: "Special Offers & Coupons | Tire Pro Chico",
    description: "Current tire and wheel deals at Tire Pro and Repair in Chico, CA.",
  });
}

export default async function OffersPage() {
  const [coupons, settings] = await Promise.all([getCoupons(), getSiteSettings()]);
  const phoneRaw = phoneToRaw(settings.phone);

  return (
    <>
      <PageHeader title="Special Offers" subtitle="Save on tires, wheels, and services — updated regularly." />
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-2">
          {coupons.length === 0 ? (
            <p className="text-metallic col-span-2 text-center">No active offers right now. Call for current deals!</p>
          ) : (
            coupons.map((coupon) => (
              <div key={coupon.id} className="card border-accent/30 border-dashed">
                <h2 className="font-display text-2xl font-bold uppercase text-accent">{coupon.title}</h2>
                {coupon.code && (
                  <p className="mt-2 font-mono text-lg text-foreground">Code: {coupon.code}</p>
                )}
                <p className="mt-3 text-metallic">{coupon.description}</p>
                {coupon.expiresAt && (
                  <p className="mt-4 text-xs text-metallic">
                    Expires: {coupon.expiresAt.toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </section>
      <CTABanner phone={settings.phone} phoneRaw={phoneRaw} />
    </>
  );
}
