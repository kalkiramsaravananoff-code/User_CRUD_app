import React, { useEffect } from "react";

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
}: {
  open: boolean;
  title?: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-w-lg">
        {(title || description) && (
          <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
            {title ? (
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">{description}</p>
            ) : null}
          </div>
        )}
        <div className="px-4 py-4 sm:px-6 sm:py-6 overflow-y-auto max-h-[calc(100vh-180px)]">{children}</div>
      </div>
    </div>
  );
}
