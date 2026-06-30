import { CollectionsAdminClient } from "@/app/admin/(panel)/collections/CollectionsAdminClient";
import { getCollectionSections } from "@/lib/data";

export default async function AdminCollectionsPage() {
  const sections = await getCollectionSections(false);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-white">Collections</h1>
      <CollectionsAdminClient sections={sections} />
    </div>
  );
}