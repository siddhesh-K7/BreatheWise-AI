import React from 'react';

/**
 * Accessible App Router loading skeleton displaying instant feedback during route transitions.
 */
export default function Loading() {
  return (
    <main
      id="main-content"
      className="min-h-screen p-6 max-w-7xl mx-auto space-y-6 animate-pulse"
      aria-busy="true"
    >
      <div className="h-16 bg-slate-900 rounded-2xl border border-slate-800" />
      <div className="h-72 bg-slate-900 rounded-2xl border border-slate-800" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-80 bg-slate-900 rounded-2xl border border-slate-800" />
        <div className="h-80 bg-slate-900 rounded-2xl border border-slate-800" />
      </div>
      <span className="sr-only">
        Loading air quality dashboard and live meteorological telemetry...
      </span>
    </main>
  );
}
