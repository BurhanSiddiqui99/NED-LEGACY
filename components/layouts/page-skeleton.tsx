import React from "react";

/** Instant placeholder rendered by each role's loading.tsx while a route chunk loads. */
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-28 sm:h-32 rounded-3xl lp-skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl lp-skeleton" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-72 rounded-3xl lp-skeleton" />
        <div className="h-72 rounded-3xl lp-skeleton" />
      </div>
    </div>
  );
}
