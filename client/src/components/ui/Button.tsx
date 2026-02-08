import React from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

export function Button({
  variant = "primary",
  size = "md",
  loading,
  leftIcon,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition " +
    "disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 " +
    "active:scale-95 touch-manipulation font-medium";

  const sizes: Record<Size, string> = {
    sm: "h-9 px-3.5 text-xs sm:text-sm min-h-[36px]",
    md: "h-11 px-4 text-sm min-h-[44px]",
  };

  const styles: Record<Variant, string> = {
    primary:
      "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-200 active:from-blue-700 active:to-blue-800 shadow-sm",
    secondary:
      "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-200 active:bg-slate-100 border border-slate-200",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-200 active:bg-red-700 shadow-sm",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200 active:bg-slate-50",
  };

  return (
    <button
      className={cn(base, sizes[size], styles[variant], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
      ) : (
        leftIcon
      )}
      {children}
    </button>
  );
}
