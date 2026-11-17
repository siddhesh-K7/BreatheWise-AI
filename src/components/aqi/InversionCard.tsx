import React from 'react';
import { WeatherContext } from '@/domain/types';
import { TranslationDictionary } from '@/config/translations';
import { CloudFog, Compass, Gauge, Thermometer } from 'lucide-react';

interface InversionCardProps {
  weather: WeatherContext;
  t: TranslationDictionary;
}

/**
 * Visual breakdown of winter atmospheric boundary layer and temperature inversion dynamics.
 */
export function InversionCard({ weather, t }: InversionCardProps) {
  const { isInversionActive, boundaryLayerMeters, windSpeedKmh, dispersionIndex, temperatureC } =
    weather;

  return (
    <section
      className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm"
      aria-labelledby="inversion-heading"
    >
      <div className="flex items-center justify-between mb-4">
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
        <p className="text-xs text-amber-300 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/60 mb-4 leading-relaxed">
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
    </section>
  );
}
