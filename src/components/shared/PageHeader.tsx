type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-lg text-metallic">{subtitle}</p>}
      </div>
    </section>
  );
}