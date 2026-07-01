type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16">
        <h1 className="section-title break-words">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl break-words text-base text-metallic sm:text-lg">{subtitle}</p>}
      </div>
    </section>
  );
}