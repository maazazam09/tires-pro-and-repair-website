"use client";

import { useState } from "react";
import Link from "next/link";
import type { CollectionSection } from "@/generated/prisma/browser";
import { AdminField } from "@/components/admin/AdminField";
import { AdminForm } from "@/components/admin/AdminForm";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { saveCollectionSection } from "@/lib/actions";

const CATEGORY_HINTS: Record<string, string> = {
  tires: "TIRE",
  wheels: "WHEEL",
};

type CollectionsAdminClientProps = {
  sections: CollectionSection[];
};

export function CollectionsAdminClient({ sections }: CollectionsAdminClientProps) {
  const [activeKey, setActiveKey] = useState(sections[0]?.key ?? "tires");

  if (sections.length === 0) {
    return (
      <p className="mt-8 text-metallic">
        No collections found. Run the database seed to create Tires and Wheels collections.
      </p>
    );
  }

  return (
    <div>
      <div className="mt-8 flex gap-4 border-b border-border">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveKey(section.key)}
            className={`px-4 py-2 font-semibold uppercase transition-colors ${
              activeKey === section.key
                ? "border-b-2 border-accent text-white"
                : "text-metallic hover:text-white"
            }`}
          >
            {section.title}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-8">
        {sections.map((section) => {
          if (activeKey !== section.key) return null;
          const categoryHint = CATEGORY_HINTS[section.key] ?? section.key.toUpperCase();

          return (
            <div key={section.id}>
              <div className="mb-8">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase text-white">
                  Edit {section.title}
                </h2>
                <AdminForm action={saveCollectionSection} className="card space-y-4" formKey={section.id}>
                  <input type="hidden" name="originalKey" value={section.key} />
                  <AdminField label="Slug (URL)" name="key" defaultValue={section.key} required />
                  <AdminField label="Section Title" name="title" defaultValue={section.title} required />
                  <ImageUpload name="imageUrl" label="Collection Image" defaultValue={section.imageUrl} />
                  <AdminField label="Name Beneath Image" name="itemName" defaultValue={section.itemName} required />
                  <AdminField
                    label="Description"
                    name="description"
                    defaultValue={section.description}
                    rows={4}
                    required
                  />
                  <AdminField label="Sort Order" name="sortOrder" type="number" defaultValue={section.sortOrder} />
                  <label className="flex items-center gap-2 text-sm text-metallic">
                    <input type="checkbox" name="active" defaultChecked={section.active} /> Active
                  </label>
                  <button type="submit" className="btn-primary">
                    Save {section.title}
                  </button>
                </AdminForm>
              </div>

              <div className="card">
                <h3 className="mb-4 font-display text-xl font-bold uppercase text-white">
                  Products in {section.title}
                </h3>
                <p className="mb-4 text-metallic">
                  Manage products for this collection on the Products admin page. Set the Category to{" "}
                  <strong>{categoryHint}</strong> when adding or editing products.
                </p>
                <Link href="/admin/products" className="btn-primary inline-block">
                  Manage Products
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}