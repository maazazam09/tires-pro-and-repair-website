import Link from "next/link";
import type { CollectionSection } from "@/generated/prisma/browser";

type CollectionsShowcaseProps = {
  sections: CollectionSection[];
};

export function CollectionsShowcase({ sections }: CollectionsShowcaseProps) {
  if (sections.length === 0) return null;

  return (
    <section className="border-t border-border bg-white py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-10 lg:grid-cols-2">
          {sections.map((section) => (
            <Link key={section.id} href={`/collections/${section.key}`} className="group">
              <article>
                <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground md:text-4xl">
                  {section.title}
                </h2>
                <div className="mt-5 overflow-hidden rounded-lg border border-border bg-[#F3F4F6]">
                  {section.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={section.imageUrl}
                      alt={section.itemName}
                      className="h-72 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-72 items-center justify-center text-sm font-semibold uppercase text-metallic">
                      No image
                    </div>
                  )}
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold uppercase text-foreground">
                  {section.itemName}
                </h3>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
