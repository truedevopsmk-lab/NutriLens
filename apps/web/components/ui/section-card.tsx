type SectionCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
};

export function SectionCard({ action, children, description, title }: SectionCardProps) {
  return (
    <section className="glass-panel rounded-panel p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-ink/66">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
