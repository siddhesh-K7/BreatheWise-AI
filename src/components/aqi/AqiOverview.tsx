import React from 'react';
import { AqiReading, LocationQuery } from '@/domain/types';
import { TranslationDictionary } from '@/config/translations';
import { AqiBadge } from '@/components/ui/Badge';
import { Activity, Clock } from 'lucide-react';

interface AqiOverviewProps {
  location: LocationQuery;
  reading: AqiReading;
  t: TranslationDictionary;
}

/**
 * Visual breakdown of live air quality indices, pollutant telemetry, and hourly curves.
 */
export function AqiOverview({ location, reading, t }: AqiOverviewProps) {
  const pollutants = [
    { label: 'PM2.5', value: reading.pm25, unit: 'µg/m³', desc: 'Fine particulate' },
    { label: 'PM10', value: reading.pm10, unit: 'µg/m³', desc: 'Coarse dust' },
    { label: 'NO₂', value: reading.no2, unit: 'µg/m³', desc: 'Nitrogen dioxide' },
    { label: 'O₃', value: reading.o3, unit: 'µg/m³', desc: 'Surface ozone' },
    { label: 'SO₂', value: reading.so2, unit: 'µg/m³', desc: 'Sulphur dioxide' },
    { label: 'CO', value: reading.co, unit: 'µg/m³', desc: 'Carbon monoxide' },
  ];

  return (
    <section
      className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm"
      aria-labelledby="aqi-overview-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2
              id="aqi-overview-heading"
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
            >
              {location.cityName}
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>{t.liveTelemetry}</span>
            <span>•</span>
            <span>
              {new Date(reading.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span
              className="text-4xl sm:text-5xl font-black text-white tracking-tight"
              aria-label={`US AQI ${reading.usAqi}`}
            >
              {reading.usAqi}
            </span>
            <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">
              US AQI
            </span>
          </div>
          <AqiBadge category={reading.category} label={reading.categoryLabel} />
        </div>
      </div>

      {/* Pollutant Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {pollutants.map((p) => (
          <div key={p.label} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium block">{p.label}</span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-lg font-bold text-white">{p.value}</span>
              <span className="text-[10px] text-slate-400">{p.unit}</span>
            </div>
            <span className="text-[10px] text-slate-400 truncate block">{p.desc}</span>
          </div>
        ))}
      </div>

      {/* Hourly forecast curve preview */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-xs text-slate-400 font-medium">
          <Clock className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
          <span>24-Hour Diurnal Hourly Trend</span>
        </div>
        <div
          className="flex items-end gap-1.5 h-20 overflow-x-auto pb-2"
          role="region"
          aria-label="Hourly AQI Trend"
        >
          {reading.hourlyForecast.slice(0, 16).map((sample, idx) => {
            const heightPct = Math.min(100, Math.max(15, (sample.usAqi / 400) * 100));
            return (
              <div
                key={idx}
                className="flex-1 min-w-[28px] flex flex-col items-center justify-end h-full group"
                title={`${sample.time}: AQI ${sample.usAqi} (PM2.5: ${sample.pm25} µg/m³)`}
              >
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full bg-slate-700 hover:bg-emerald-500 rounded-t transition-all"
                />
                <span className="text-[9px] text-slate-400 mt-1 truncate">
                  {sample.time.split('T')[1]?.slice(0, 2) || `${idx}h`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
