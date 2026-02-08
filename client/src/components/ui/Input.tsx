import React from "react";
import { cn } from "../../lib/cn";

export function Input({
  label,
  required,
  error,
  hint,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-slate-900">{label}</span>
          {required ? (
            <span className="text-red-500 text-sm font-bold" title="Required" aria-label="Required">
              *
            </span>
          ) : null}
        </div>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>

      <input
        className={cn(
          "w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition",
          "placeholder:text-slate-400",
          error
            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-100",
          className
        )}
        {...props}
      />

      {error ? (
        <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>
      ) : null}
    </label>
  );
}
