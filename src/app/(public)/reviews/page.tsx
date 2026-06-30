import { PageHeader } from "@/components/shared/PageHeader";
import { StarRating } from "@/components/shared/StarRating";
import { CTABanner } from "@/components/home/CTABanner";
import { getReviews, getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { phoneToRaw } from "@/lib/phone";

export async function generateMetadata() {
  return buildMetadata("/reviews", {
    title: "Customer Reviews | Tire Pro Chico",
    description: "Read what Chico drivers say about Tire Pro and Repair.",
  });
}

export default async function ReviewsPage() {
  const [reviews, settings] = await Promise.all([getReviews(), getSiteSettings()]);
  const phoneRaw = phoneToRaw(settings.phone);

  return (
    <>
      <PageHeader
        title="Customer Reviews"
        subtitle={`${settings.averageRating} stars from ${settings.reviewCount}+ reviews`}
      />
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div key={review.id} className="card">
              <StarRating rating={review.rating} />
              <p className="mt-4 text-metallic">&ldquo;{review.text}&rdquo;</p>
              <p className="mt-4 text-sm font-semibold text-foreground">
                {review.author} <span className="font-normal text-metallic">· {review.source}</span>
              </p>
            </div>
          ))}
        </div>
      </section>
      <CTABanner phone={settings.phone} phoneRaw={phoneRaw} />
    </>
  );
}
