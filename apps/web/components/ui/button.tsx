import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
};

export function Button({
  children,
  className,
  loading,
  size = "md",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" ? "px-4 py-2 text-sm" : "px-5 py-3 text-sm",
        variant === "primary" && "bg-ink text-white hover:bg-ink/88",
        variant === "secondary" && "bg-white text-ink hover:bg-white/82",
        variant === "ghost" && "bg-transparent text-ink hover:bg-white/58",
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "Working..." : children}
    </button>
  );
}
