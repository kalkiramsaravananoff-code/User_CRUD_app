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
      <div className="mb-2.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-900">{label}</span>
          {required ? (
            <span className="text-red-500 text-xs font-bold" title="Required" aria-label="Required">
              *
            </span>
          ) : null}
        </div>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>

      <input
        className={cn(
          "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition",
          "placeholder:text-slate-400 shadow-sm",
          "min-h-[44px]",
          error
            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          className
        )}
        {...props}
      />

      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-600 flex items-center gap-1">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 14.586 7.313 11.899a1 1 0 00-1.414 1.414l3.5 3.5a1 1 0 001.414 0l8.5-8.5z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      ) : null}
    </label>
  );
}
