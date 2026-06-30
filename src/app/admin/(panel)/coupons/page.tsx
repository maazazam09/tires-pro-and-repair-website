import { getCoupons } from "@/lib/data";
import { saveCoupon, deleteCoupon } from "@/lib/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";

export default async function AdminCouponsPage() {
  const coupons = await getCoupons(false);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-white">Coupons</h1>
      <AdminForm action={saveCoupon} className="card mt-8 max-w-2xl space-y-4">
        <h2 className="font-semibold text-white">Add Coupon</h2>
        <AdminField label="Title" name="title" required />
        <AdminField label="Code" name="code" />
        <AdminField label="Description" name="description" rows={3} required />
        <AdminField label="Expires At" name="expiresAt" type="date" />
        <button type="submit" className="btn-primary">Add Coupon</button>
      </AdminForm>
      <div className="mt-10 space-y-4">
        {coupons.map((c) => (
          <div key={c.id} className="card flex justify-between">
            <div>
              <p className="font-semibold text-accent">{c.title}</p>
              <p className="text-sm text-metallic">{c.description}</p>
            </div>
            <AdminDeleteButton action={deleteCoupon} id={c.id} className="btn-secondary text-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}