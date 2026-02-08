import React from "react";
import { cn } from "../../lib/cn";

export function Card({
  title,
  subtitle,
  right,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-md",
        className
      )}
    >
      {(title || right) && (
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-xl font-bold text-slate-900">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
            ) : null}
          </div>
          {right && (
            <div className="w-full sm:w-auto">
              {right}
            </div>
          )}
        </div>
      )}
      <div className="px-5 py-6">{children}</div>
    </div>
  );
}
