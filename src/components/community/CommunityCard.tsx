'use client';

import React, { useState } from 'react';
import { AqiReading, LocationQuery } from '@/domain/types';
import { TranslationDictionary } from '@/config/translations';
import { Button } from '@/components/ui/Button';
import { Check, Copy, School, Share2, Shield, Users } from 'lucide-react';

interface CommunityCardProps {
  location: LocationQuery;
  reading: AqiReading;
  t: TranslationDictionary;
}

/**
 * Shareable neighborhood advisory bulletin for families, schools, and Resident Welfare Associations (RWAs).
 * Operates without requiring user accounts or database persistence.
 */
export function CommunityCard({ location, reading, t }: CommunityCardProps) {
  const [copied, setCopied] = useState(false);

  const isSevere = reading.usAqi > 200;

  const handleCopySummary = async () => {
    const summaryText = `[AIRWISE COMMUNITY NOTICE - ${location.cityName.toUpperCase()}]
Date: ${new Date().toLocaleDateString()}
Current AQI: ${reading.usAqi} (${reading.categoryLabel})
PM2.5: ${reading.pm25} µg/m³
Immediate Directives:
1. Schools: ${isSevere ? 'Shift all physical sports and morning assembly indoors.' : 'Limit strenuous outdoor athletics.'}
2. RWAs: Strictly prohibit biomass/leaf burning; deploy water-misting on colony entry gates.
3. Families: Keep bedroom windows sealed; wear N95 masks during road transit.
Generated via AirWise: https://airwise-urban-air-quality-assistant.vercel.app`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  return (
    <section
      className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-6"
      aria-labelledby="community-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <div>
            <h2 id="community-heading" className="text-xl font-bold text-white tracking-tight">
              {t.communityTab}
            </h2>
            <p className="text-xs text-slate-400">
              Neighborhood bulletin for RWAs, families & institutions
            </p>
          </div>
        </div>

        <Button onClick={handleCopySummary} variant="secondary" size="sm" className="gap-2">
          {copied ? (
            <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          ) : (
            <Copy className="w-4 h-4" aria-hidden="true" />
          )}
          <span>{copied ? 'Copied to Clipboard!' : 'Share Notice'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* School Directive */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <School className="w-4 h-4" aria-hidden="true" />
            <span>School Administration</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isSevere
              ? 'Move morning assembly, physical training, and recess strictly indoors into filtered halls.'
              : 'Monitor outdoor exertion; permit low-intensity recess in afternoon sun.'}
          </p>
        </div>

        {/* RWA Directive */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <Shield className="w-4 h-4" aria-hidden="true" />
            <span>RWA / Colony Notice</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Enforce zero tolerance for garden waste or leaf burning. Coordinate water-sprinkling on
            internal colony roads to settle fine dust.
          </p>
        </div>

        {/* Community Care Directive */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <Share2 className="w-4 h-4" aria-hidden="true" />
            <span>Vulnerable Care</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Distribute certified N95 masks to security guards, sanitation workers, and delivery
            personnel facing prolonged outdoor exposure.
          </p>
        </div>
      </div>
    </section>
  );
}
