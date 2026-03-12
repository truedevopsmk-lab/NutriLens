import clsx from "clsx";

type MacroBarProps = {
  label: string;
  current: number;
  goal: number;
  tone: "ember" | "citrus" | "pine" | "ocean";
};

const toneClasses = {
  ember: "bg-ember",
  citrus: "bg-citrus",
  pine: "bg-pine",
  ocean: "bg-ocean"
};

export function MacroBar({ current, goal, label, tone }: MacroBarProps) {
  const progress = Math.min((current / goal) * 100, 100);

  return (
    <div className="rounded-3xl bg-white/70 p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-ink/62">{current.toFixed(1)}g / {goal}g</span>
      </div>
      <div className="h-2 rounded-full bg-ink/8">
        <div
          className={clsx("h-2 rounded-full transition-all", toneClasses[tone])}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
