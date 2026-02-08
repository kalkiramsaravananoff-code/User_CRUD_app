import React from "react";
import { cn } from "../../lib/cn";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-semibold text-blue-900",
        className
      )}
    >
      {children}
    </span>
  );
}
