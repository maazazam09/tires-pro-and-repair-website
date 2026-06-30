import { StarRating } from "@/components/shared/StarRating";
import type { Review } from "@/generated/prisma/browser";

export function Testimonials({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="section-title mb-10">What Chico Drivers Say</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {reviews.slice(0, 4).map((review) => (
            <div key={review.id} className="card">
              <StarRating rating={review.rating} />
              <p className="mt-4 text-sm text-metallic">&ldquo;{review.text}&rdquo;</p>
              <p className="mt-4 text-sm font-semibold text-foreground">
                {review.author}
                <span className="ml-2 font-normal text-metallic">· {review.source}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
