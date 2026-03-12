type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
};

export function Input({ helperText, label, ...props }: InputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink/80">{label}</span>
      <input
        className="w-full rounded-3xl border border-ink/10 bg-white/82 px-4 py-3 text-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/14"
        {...props}
      />
      {helperText ? <span className="mt-2 block text-xs text-ink/58">{helperText}</span> : null}
    </label>
  );
}
