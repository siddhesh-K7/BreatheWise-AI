import React from 'react';
import { TranslationDictionary } from '@/config/translations';
import { AlertOctagon, CheckSquare } from 'lucide-react';

interface HazardousBannerProps {
  aqi: number;
  t: TranslationDictionary;
}

/**
 * Emergency alert banner displayed when ambient AQI exceeds hazardous threshold (>300).
 */
export function HazardousBanner({ aqi, t }: HazardousBannerProps) {
  if (aqi <= 300) {
    return null;
  }

  const immediateActions = [
    'Cancel all outdoor sports, jogging, and community gatherings immediately.',
    'Run high-CADR HEPA air purifiers continuously on sealed indoor rooms.',
    'Seal door thresholds and exterior window gaps with damp microfiber towels.',
    'Mandatory certified N95/FFP2 respirator masking for any unavoidable outdoor transit.',
  ];

  return (
    <aside
      className="p-5 rounded-2xl border-2 border-rose-500 bg-rose-950/80 text-rose-100 shadow-xl shadow-rose-950/50 mb-8"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3.5">
        <AlertOctagon
          className="w-7 h-7 text-rose-400 shrink-0 mt-0.5 animate-bounce"
          aria-hidden="true"
        />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-bold tracking-tight text-white">{t.hazardousAlertTitle}</h2>
            <span className="px-2 py-0.5 rounded bg-rose-800 text-xs font-bold uppercase tracking-wider text-rose-100">
              AQI {aqi}
            </span>
          </div>
          <p className="text-sm text-rose-200/90 leading-relaxed mb-3">{t.hazardousAlertBody}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-rose-900/60 text-xs text-rose-100">
            {immediateActions.map((action, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
