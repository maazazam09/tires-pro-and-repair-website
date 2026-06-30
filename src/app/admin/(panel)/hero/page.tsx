import { getHero } from "@/lib/data";
import { updateHero } from "@/lib/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminForm } from "@/components/admin/AdminForm";
import { ImageUpload } from "@/components/admin/ImageUpload";

export default async function AdminHeroPage() {
  const hero = await getHero();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-white">Hero Banner</h1>
      <AdminForm action={updateHero} className="mt-8 max-w-2xl space-y-4">
        <AdminField label="Headline" name="headline" defaultValue={hero.headline} required />
        <AdminField label="Subheadline" name="subheadline" defaultValue={hero.subheadline} required />
        <ImageUpload name="mediaUrl" defaultValue={hero.mediaUrl} label="Hero Image" />
        <AdminField label="Media Type" name="mediaType" defaultValue={hero.mediaType} />
        <AdminField label="Call Button Label" name="ctaCallLabel" defaultValue={hero.ctaCallLabel} />
        <AdminField label="Booking Button Label" name="ctaQuoteLabel" defaultValue={hero.ctaQuoteLabel} />
        <AdminField label="Booking Button Link" name="ctaQuoteLink" defaultValue={hero.ctaQuoteLink} />
        <button type="submit" className="btn-primary">Save Hero</button>
      </AdminForm>
    </div>
  );
}