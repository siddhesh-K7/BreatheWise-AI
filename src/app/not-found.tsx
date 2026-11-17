import React from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';

/**
 * Accessible 404 page for unmatched routes.
 */
export default function NotFound() {
  return (
    <main
      id="main-content"
      className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100"
    >
      <div className="max-w-md w-full p-8 rounded-2xl border border-slate-800 bg-slate-900/60 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-emerald-400">
          <Compass className="w-6 h-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">404 — Location Not Found</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          The requested air quality advisory page or route does not exist.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-500 min-h-[44px]"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
