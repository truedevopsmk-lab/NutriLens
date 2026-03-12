type SummaryCardProps = {
  label: string;
  value: string;
  accent: "ember" | "pine" | "ocean";
  loading?: boolean;
};

const accentMap = {
  ember: "from-ember/20 to-ember/5 text-ember",
  pine: "from-pine/20 to-pine/5 text-pine",
  ocean: "from-ocean/20 to-ocean/5 text-ocean"
};

export function SummaryCard({ accent, label, loading, value }: SummaryCardProps) {
  return (
    <article className={`rounded-panel bg-gradient-to-br p-[1px] ${accentMap[accent]}`}>
      <div className="h-full rounded-[calc(1.5rem-1px)] bg-white/88 p-4">
        <p className="text-sm text-ink/62">{label}</p>
        <p className="mt-4 text-3xl font-semibold">{loading ? "..." : value}</p>
      </div>
    </article>
  );
}
