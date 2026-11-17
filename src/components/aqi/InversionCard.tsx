import React from 'react';
import { FirmsFireSummary, WeatherContext } from '@/domain/types';
import { TranslationDictionary } from '@/config/translations';
import { CloudFog, Compass, Flame, Gauge, Thermometer } from 'lucide-react';

interface InversionCardProps {
  weather: WeatherContext;
  fireSummary?: FirmsFireSummary | null;
  t: TranslationDictionary;
}

/**
 * Visual breakdown of winter atmospheric boundary layer, temperature inversion, and upwind fire activity.
 */
export function InversionCard({ weather, fireSummary, t }: InversionCardProps) {
  const { isInversionActive, boundaryLayerMeters, windSpeedKmh, dispersionIndex, temperatureC } =
    weather;

  return (
    <section
      className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-4"
      aria-labelledby="inversion-heading"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CloudFog className="w-5 h-5 text-sky-400" aria-hidden="true" />
          <h2 id="inversion-heading" className="text-base font-semibold text-white">
            {t.winterSmogContext}
          </h2>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
            isInversionActive
              ? 'bg-rose-950 text-rose-300 border-rose-700'
              : 'bg-emerald-950 text-emerald-300 border-emerald-700'
          }`}
          role="status"
        >
          {isInversionActive ? 'Inversion Active' : 'Normal Dispersion'}
        </span>
      </div>

      {isInversionActive && (
        <p className="text-xs text-amber-300 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/60 leading-relaxed">
          {t.inversionWarning}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Gauge className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            <span>Boundary Layer</span>
          </div>
          <span className="text-base font-bold text-white">{boundaryLayerMeters} m</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Compass className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            <span>Surface Wind</span>
          </div>
          <span className="text-base font-bold text-white">{windSpeedKmh} km/h</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <CloudFog className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            <span>Dispersion Index</span>
          </div>
          <span className="text-base font-bold text-white">{dispersionIndex}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Thermometer className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            <span>Temperature</span>
          </div>
          <span className="text-base font-bold text-white">{temperatureC}°C</span>
        </div>
      </div>

      {fireSummary && (
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
          <Flame className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-orange-300">
              <span>Upwind Thermal Anomalies</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-950/80 border border-orange-800 text-orange-200">
                {fireSummary.isSeasonalBaseline ? 'Seasonal Baseline' : 'Live NASA FIRMS'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
              {fireSummary.advisoryText}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
