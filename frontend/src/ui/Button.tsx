import { clsx } from "clsx";

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  className,
  type
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const base = "rounded-xl px-4 py-2.5 text-sm font-extrabold transition disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-emerald-600 text-white hover:bg-emerald-700"
      : variant === "danger"
        ? "bg-rose-600 text-white hover:bg-rose-700"
        : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50";
  return (
    <button type={type ?? "button"} disabled={disabled} onClick={onClick} className={clsx(base, styles, className)}>
      {children}
    </button>
  );
}

