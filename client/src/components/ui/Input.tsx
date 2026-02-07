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
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{label}</span>
          {required ? (
            <span className="inline-flex items-center gap-0.5">
              <span className="sr-only">Required</span>
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 ring-1 ring-yellow-300 shadow-sm"
                title="Required"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="h-2 w-2 fill-current text-white" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
                  <path d="M12 .587l3.668 7.431L23.5 9.75l-5.75 5.605L19.334 24 12 20.01 4.666 24l1.584-8.645L.5 9.75l7.832-1.732L12 .587z" />
                </svg>
              </span>
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
