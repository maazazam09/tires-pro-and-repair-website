import { getReviews } from "@/lib/data";
import { saveReview, deleteReview } from "@/lib/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";

export default async function AdminReviewsPage() {
  const reviews = await getReviews(false);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-white">Reviews</h1>
      <AdminForm action={saveReview} className="card mt-8 max-w-2xl space-y-4">
        <h2 className="font-semibold text-white">Add Review</h2>
        <AdminField label="Author" name="author" required />
        <AdminField label="Rating (1-5)" name="rating" type="number" defaultValue={5} required />
        <AdminField label="Review Text" name="text" rows={3} required />
        <AdminField label="Source" name="source" defaultValue="Google" />
        <button type="submit" className="btn-primary">Add Review</button>
      </AdminForm>
      <div className="mt-10 space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="card flex justify-between gap-4">
            <div>
              <p className="font-semibold text-white">{r.author} · {r.rating}★</p>
              <p className="mt-1 text-sm text-metallic">{r.text}</p>
            </div>
            <AdminDeleteButton action={deleteReview} id={r.id} className="btn-secondary text-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}