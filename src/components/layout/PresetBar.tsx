'use client';

import React from 'react';
import { METRO_PRESETS } from '@/config/constants';
import { LocationQuery } from '@/domain/types';
import { TranslationDictionary } from '@/config/translations';
import { Button } from '@/components/ui/Button';
import { MapPin, Navigation } from 'lucide-react';

interface PresetBarProps {
  activeLocation: LocationQuery;
  onSelectPreset: (presetId: string) => void;
  onRequestLocation: () => void;
  t: TranslationDictionary;
}

/**
 * Metropolitan preset selector and geolocation consent trigger.
 */
export function PresetBar({
  activeLocation,
  onSelectPreset,
  onRequestLocation,
  t,
}: PresetBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0"
        role="group"
        aria-label="Metropolitan presets"
      >
        <span className="text-xs font-semibold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
          <span>{t.presetsTitle}:</span>
        </span>
        {METRO_PRESETS.map((p) => {
          const isActive = activeLocation.cityName === p.cityName;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPreset(p.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors shrink-0 min-h-[36px] ${
                isActive
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              aria-pressed={isActive}
            >
              {p.cityName}
            </button>
          );
        })}
      </div>

      <Button onClick={onRequestLocation} variant="outline" size="sm" className="gap-2 shrink-0">
        <Navigation className="w-4 h-4 text-emerald-400" aria-hidden="true" />
        <span>{t.locateMe}</span>
      </Button>
    </div>
  );
}
