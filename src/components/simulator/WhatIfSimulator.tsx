'use client';

import React, { useState } from 'react';
import { QuantifiedImpact, UserProfile } from '@/domain/types';
import { TranslationDictionary } from '@/config/translations';
import { simulateWhatIf } from '@/services/impact-calculator';
import { Cigarette, Flame, Gauge, Sliders, Trees } from 'lucide-react';

interface WhatIfSimulatorProps {
  currentPm25: number;
  baseProfile: UserProfile;
  initialImpact: QuantifiedImpact;
  t: TranslationDictionary;
}

/**
 * Interactive client-side What-If Simulator demonstrating instant quantified health and emission outcomes.
 */
export function WhatIfSimulator({
  currentPm25,
  baseProfile,
  initialImpact,
  t,
}: WhatIfSimulatorProps) {
  const [purifierToggle, setPurifierToggle] = useState(baseProfile.hasPurifier);
  const [metroToggle, setMetroToggle] = useState(baseProfile.commuteMode === 'metro');
  const [sealedToggle, setSealedToggle] = useState(baseProfile.homeVentilation === 'tight-sealed');
  const [cleanCookingToggle, setCleanCookingToggle] = useState(
    baseProfile.cookingFuel === 'lpg-induction'
  );

  const simulatedImpact = simulateWhatIf(currentPm25, baseProfile, {
    hasPurifier: purifierToggle,
    commuteMode: metroToggle ? 'metro' : baseProfile.commuteMode,
    homeVentilation: sealedToggle ? 'tight-sealed' : baseProfile.homeVentilation,
    cookingFuel: cleanCookingToggle ? 'lpg-induction' : 'biomass-firewood',
  });

  return (
    <section
      className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-6"
      aria-labelledby="simulator-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <h2 id="simulator-heading" className="text-xl font-bold text-white tracking-tight">
            {t.whatIfTab}
          </h2>
        </div>
        <span className="text-xs text-slate-400">Instant client-side model • Zero latency</span>
      </div>

      {/* Simulator Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SimulatorToggle
          label="HEPA Air Purifier"
          active={purifierToggle}
          onToggle={() => setPurifierToggle(!purifierToggle)}
          desc="80% particulate filtration"
        />
        <SimulatorToggle
          label="Shift to Metro Rail"
          active={metroToggle}
          onToggle={() => setMetroToggle(!metroToggle)}
          desc="Avoid road exhaust & save CO2"
        />
        <SimulatorToggle
          label="Weatherize & Seal"
          active={sealedToggle}
          onToggle={() => setSealedToggle(!sealedToggle)}
          desc="Prevent indoor infiltration"
        />
        <SimulatorToggle
          label="Induction Cooking"
          active={cleanCookingToggle}
          onToggle={() => setCleanCookingToggle(!cleanCookingToggle)}
          desc="Eliminate cooking smoke"
        />
      </div>

      {/* Real-time Dynamic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl border border-emerald-600/40 bg-emerald-950/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">{t.cigarettesAvoided}</span>
            <Cigarette className="w-4 h-4 text-amber-400" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {simulatedImpact.avoidedCigarettesPerDay}
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              (
              {simulatedImpact.avoidedCigarettesPerDay >= initialImpact.avoidedCigarettesPerDay
                ? '+'
                : ''}
              {(
                simulatedImpact.avoidedCigarettesPerDay - initialImpact.avoidedCigarettesPerDay
              ).toFixed(1)}{' '}
              delta)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Based on Berkeley Earth 22 µg/m³ equivalent
          </p>
        </div>

        <div className="p-4 rounded-xl border border-sky-600/40 bg-sky-950/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">{t.pm25Avoided}</span>
            <Gauge className="w-4 h-4 text-sky-400" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {simulatedImpact.pm25ReductionPercent}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {simulatedImpact.pm25SavedMicrograms} µg saved
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Time-weighted indoor/commute exposure</p>
        </div>

        <div className="p-4 rounded-xl border border-teal-600/40 bg-teal-950/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">{t.co2Saved}</span>
            <Trees className="w-4 h-4 text-teal-400" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {simulatedImpact.avoidedCo2KgPerDay}
            </span>
            <span className="text-xs text-slate-400 font-medium">kg CO₂ / day</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Sourced from CPCB urban transit coefficients
          </p>
        </div>
      </div>
    </section>
  );
}

function SimulatorToggle({
  label,
  active,
  onToggle,
  desc,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`p-3.5 rounded-xl border text-left transition-colors min-h-[44px] flex flex-col justify-between ${
        active
          ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-sm'
          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
      }`}
      aria-pressed={active}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-sm font-semibold text-white">{label}</span>
        <Flame
          className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-600'}`}
          aria-hidden="true"
        />
      </div>
      <span className="text-[11px] text-slate-400">{desc}</span>
    </button>
  );
}
