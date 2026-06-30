import { prisma } from "@/lib/prisma";
import { savePageSEO } from "@/lib/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminForm } from "@/components/admin/AdminForm";

export default async function AdminSEOPage() {
  const pages = await prisma.pageSEO.findMany({ orderBy: { path: "asc" } });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-white">SEO Settings</h1>
      <AdminForm action={savePageSEO} className="card mt-8 max-w-2xl space-y-4">
        <h2 className="font-semibold text-white">Add Page SEO</h2>
        <AdminField label="Path (e.g. /shop)" name="path" required />
        <AdminField label="Meta Title" name="metaTitle" required />
        <AdminField label="Meta Description" name="metaDescription" rows={2} required />
        <button type="submit" className="btn-primary">Add SEO Entry</button>
      </AdminForm>
      <div className="mt-10 space-y-4">
        {pages.map((p) => (
          <AdminForm key={p.id} action={savePageSEO} className="card space-y-3" formKey={p.id}>
            <input type="hidden" name="id" value={p.id} />
            <AdminField label="Path" name="path" defaultValue={p.path} />
            <AdminField label="Meta Title" name="metaTitle" defaultValue={p.metaTitle} />
            <AdminField label="Meta Description" name="metaDescription" defaultValue={p.metaDescription} rows={2} />
            <button type="submit" className="btn-primary text-xs">Save</button>
          </AdminForm>
        ))}
      </div>
    </div>
  );
}