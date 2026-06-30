import { getServices } from "@/lib/data";
import { saveService, deleteService } from "@/lib/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";

export default async function AdminServicesPage() {
  const services = await getServices(false);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-white">Services</h1>
      <AdminForm action={saveService} className="card mt-8 max-w-2xl space-y-4">
        <h2 className="font-semibold text-white">Add Service</h2>
        <AdminField label="Title" name="title" required />
        <AdminField label="Slug" name="slug" required />
        <AdminField label="Summary" name="summary" required />
        <AdminField label="Content" name="content" rows={5} required />
        <AdminField label="Sort Order" name="sortOrder" type="number" defaultValue={0} />
        <button type="submit" className="btn-primary">Add Service</button>
      </AdminForm>
      <div className="mt-10 space-y-4">
        {services.map((s) => (
          <div key={s.id} className="card space-y-3">
            <AdminForm action={saveService} className="space-y-3" formKey={s.id}>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="sortOrder" value={s.sortOrder} />
              {s.active ? <input type="hidden" name="active" value="on" /> : null}
              <AdminField label="Title" name="title" defaultValue={s.title} />
              <AdminField label="Slug" name="slug" defaultValue={s.slug} />
              <AdminField label="Summary" name="summary" defaultValue={s.summary} />
              <AdminField label="Content" name="content" defaultValue={s.content} rows={4} />
              <button type="submit" className="btn-primary text-xs">Save</button>
            </AdminForm>
            <AdminDeleteButton action={deleteService} id={s.id} className="btn-secondary text-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}