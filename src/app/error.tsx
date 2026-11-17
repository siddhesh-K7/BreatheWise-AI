'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global App Router error boundary handling unexpected runtime exceptions gracefully.
 */
export default function ErrorBoundary({ error, reset }: ErrorProps) {
  return (
    <main
      id="main-content"
      className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100"
    >
      <div className="max-w-md w-full p-8 rounded-2xl border border-rose-800/80 bg-rose-950/40 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-rose-900/60 border border-rose-700 mx-auto flex items-center justify-center text-rose-400">
          <AlertTriangle className="w-6 h-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Application Encountered a Boundary Exception
        </h1>
        <p className="text-xs text-slate-300 leading-relaxed">
          {error.message ||
            'An unexpected runtime error occurred while processing air quality telemetry.'}
        </p>
        <div className="pt-2">
          <Button onClick={reset} variant="primary" className="gap-2 w-full">
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Attempt Recovery</span>
          </Button>
        </div>
      </div>
    </main>
  );
}
