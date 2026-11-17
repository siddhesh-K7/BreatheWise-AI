'use client';

import React from 'react';
import { AqiCrossCheck } from '@/domain/types';
import { AlertTriangle, CheckCircle2, Info, Radio } from 'lucide-react';

interface StationCrossCheckCardProps {
  crossCheck: AqiCrossCheck | null;
}

/**
 * Visual side-by-side comparison between gridded Open-Meteo model and physical WAQI ground station.
 */
export function StationCrossCheckCard({ crossCheck }: StationCrossCheckCardProps) {
  if (!crossCheck) {
    return null;
  }

  const { modelAqi, stationReading, disagreementDetected, deviation, effectiveSafetyAqi } =
    crossCheck;

  return (
    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Multi-Source Cross-Check
          </h2>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
          Model vs Physical Station
        </span>
      </div>

      {stationReading.isAvailable ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Open-Meteo (Gridded)</span>
              <span className="text-xl font-black text-emerald-400">{modelAqi}</span>
              <span className="text-[10px] text-slate-500 block">US AQI Model</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block truncate">
                {stationReading.stationName || 'WAQI Station'}
              </span>
              <span className="text-xl font-black text-teal-400">
                {stationReading.stationAqi ?? '--'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {stationReading.distanceKm !== undefined
                  ? `${stationReading.distanceKm} km away`
                  : 'Ground Station'}
              </span>
            </div>
          </div>

          {disagreementDetected ? (
            <div
              className="p-2.5 rounded-xl border border-amber-800/80 bg-amber-950/40 text-amber-200 text-xs flex items-start gap-2"
              role="alert"
            >
              <AlertTriangle
                className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <span className="font-semibold block">
                  Data sources disagree ({deviation} AQI points)
                </span>
                <span className="text-[11px] text-amber-300/90 block">
                  Safety guidance elevated to AQI {effectiveSafetyAqi} to prioritize vulnerable
                  respiratory health.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Sensors agree within tolerance (deviation: {deviation} AQI).</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {stationReading.statusReason ||
              'WAQI station cross-check token not configured in vault. Operating in Open-Meteo primary mode.'}
          </span>
        </div>
      )}
    </div>
  );
}
