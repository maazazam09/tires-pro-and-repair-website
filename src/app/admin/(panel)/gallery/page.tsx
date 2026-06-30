import { getGalleryItems } from "@/lib/data";
import { saveGalleryItem, deleteGalleryItem } from "@/lib/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { ImageUpload } from "@/components/admin/ImageUpload";

export default async function AdminGalleryPage() {
  const items = await getGalleryItems();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-white">Gallery</h1>
      <AdminForm action={saveGalleryItem} className="card mt-8 max-w-2xl space-y-4">
        <h2 className="font-semibold text-white">Add Image</h2>
        <ImageUpload name="mediaUrl" label="Image" />
        <AdminField label="Caption" name="caption" />
        <AdminField label="Sort Order" name="sortOrder" type="number" defaultValue={0} />
        <input type="hidden" name="mediaType" value="image" />
        <label className="flex items-center gap-2 text-sm text-metallic">
          <input type="checkbox" name="featured" /> Featured
        </label>
        <button type="submit" className="btn-primary">Add to Gallery</button>
      </AdminForm>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="card space-y-3">
            {item.mediaUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.mediaUrl} alt={item.caption} className="h-32 w-full rounded object-cover" />
            )}
            <AdminDeleteButton action={deleteGalleryItem} id={item.id} className="btn-secondary w-full text-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}