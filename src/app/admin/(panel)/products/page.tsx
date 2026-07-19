import Link from "next/link";
import { getProductsForAdmin } from "@/lib/data";
import { saveProduct, deleteProduct } from "@/lib/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { TireProductFields } from "./TireProductFields";

export default async function AdminProductsPage() {
  const products = await getProductsForAdmin();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold uppercase text-white">Products</h1>
        <Link href="/admin/tire-fitments" className="btn-primary text-xs">Tire Fitment Manager</Link>
      </div>
      <AdminForm action={saveProduct} className="card mt-8 max-w-2xl space-y-4">
        <h2 className="font-semibold text-white">Add Product</h2>
        <AdminField label="Name" name="name" required />
        <AdminField label="Slug" name="slug" required />
        <AdminField label="Brand" name="brand" required />
        <AdminField label="Size" name="size" required />
        <div>
          <label className="mb-1 block text-sm text-metallic">Type</label>
          <select name="type" className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground">
            <option value="NEW">New</option>
            <option value="USED">Used</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-metallic">Category</label>
          <select name="category" className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground">
            <option value="TIRE">Tire</option>
            <option value="WHEEL">Wheel</option>
            <option value="PACKAGE">Package</option>
          </select>
        </div>
        <AdminField label="Price" name="price" type="number" required />
        <ImageUpload name="imageUrl" />
        <AdminField label="Description" name="description" rows={3} />
        <TireProductFields />
        <label className="flex items-center gap-2 text-sm text-metallic">
          <input type="checkbox" name="active" defaultChecked /> Active
          <input type="hidden" name="active" value="off" />
        </label>
        <button type="submit" className="btn-primary">Add Product</button>
      </AdminForm>
      <div className="mt-10 space-y-4">
        {products.map((p) => (
          <AdminForm key={p.id} action={saveProduct} className="card space-y-3" formKey={p.id}>
            <input type="hidden" name="id" value={p.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Name" name="name" defaultValue={p.name} />
              <AdminField label="Slug" name="slug" defaultValue={p.slug} />
              <AdminField label="Brand" name="brand" defaultValue={p.brand} />
              <AdminField label="Size" name="size" defaultValue={p.size} />
              <AdminField label="Type" name="type" defaultValue={p.type} />
              <AdminField label="Category" name="category" defaultValue={p.category} />
              <AdminField label="Price" name="price" type="number" defaultValue={p.price} />
            </div>
            <ImageUpload name="imageUrl" defaultValue={p.imageUrl} />
            {p.category === "TIRE" ? <TireProductFields tireDetail={p.tireDetail} /> : null}
            <label className="flex items-center gap-2 text-sm text-metallic">
              <input type="checkbox" name="active" defaultChecked={p.active} /> Active
              <input type="hidden" name="active" value="off" />
            </label>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary text-xs">Save</button>
              <AdminDeleteButton action={deleteProduct} id={p.id} className="btn-secondary text-xs" />
            </div>
          </AdminForm>
        ))}
      </div>
    </div>
  );
}
