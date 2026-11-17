'use client';

import React, { useState } from 'react';
import { AirWisePlan } from '@/domain/types';
import { TranslationDictionary } from '@/config/translations';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  HeartPulse,
  Leaf,
  Sparkles,
} from 'lucide-react';

interface PlanDisplayProps {
  plan: AirWisePlan;
  t: TranslationDictionary;
}

type TabType = 'routines' | 'hacks' | 'sustainable' | 'health';

/**
 * Interactive display rendering categorized action plans, routines, and indoor hacks.
 */
export function PlanDisplay({ plan, t }: PlanDisplayProps) {
  const [activeTab, setActiveTab] = useState<TabType>('routines');

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'routines',
      label: t.routinesTab,
      icon: <Clock className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'hacks',
      label: t.indoorHacksTab,
      icon: <DollarSign className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'sustainable',
      label: t.sustainableTab,
      icon: <Leaf className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'health',
      label: 'Health Guidance',
      icon: <HeartPulse className="w-4 h-4" aria-hidden="true" />,
    },
  ];

  return (
    <section
      className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-6"
      aria-labelledby="action-plan-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <h2 id="action-plan-heading" className="text-xl font-bold text-white tracking-tight">
              Personalized Smog Action Plan
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">{plan.summary}</p>
        </div>

        {plan.isFallback && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-700">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.fallbackBadge}</span>
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'routines' && <RoutinesPanel routines={plan.dailyRoutines} />}
      {activeTab === 'hacks' && <HacksPanel hacks={plan.indoorHacks} t={t} />}
      {activeTab === 'sustainable' && (
        <SustainablePanel alternatives={plan.sustainableAlternatives} />
      )}
      {activeTab === 'health' && (
        <HealthPanel guidance={plan.healthGuidance} advisory={plan.winterSmogAdvisory} />
      )}
    </section>
  );
}

function RoutinesPanel({ routines }: { routines: AirWisePlan['dailyRoutines'] }) {
  return (
    <div className="space-y-3" role="tabpanel">
      {routines.map((r, i) => (
        <div key={i} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 font-mono">{r.timeBlock}</span>
            <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
              {r.targetAqiCondition}
            </span>
          </div>
          <p className="text-sm font-semibold text-white">{r.action}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{r.rationale}</p>
          <div className="flex items-center gap-1.5 text-xs text-teal-300 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Impact: {r.emissionReduction}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function HacksPanel({ hacks, t }: { hacks: AirWisePlan['indoorHacks']; t: TranslationDictionary }) {
  const costLabels = {
    free: t.costFree,
    under_inr_500: t.costUnder500,
    over_inr_500: t.costOver500,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="tabpanel">
      {hacks.map((h, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-emerald-300">
                {costLabels[h.costTier]}
              </span>
              <span className="text-xs font-bold text-white">
                -{h.expectedReductionPercent}% PM2.5
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">{h.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{h.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SustainablePanel({
  alternatives,
}: {
  alternatives: AirWisePlan['sustainableAlternatives'];
}) {
  return (
    <div className="space-y-3" role="tabpanel">
      {alternatives.map((alt, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block mb-1">
              Category: {alt.category}
            </span>
            <p className="text-sm font-semibold text-white">{alt.sustainableChoice}</p>
            <p className="text-xs text-slate-400 mt-0.5">Current Practice: {alt.currentPractice}</p>
          </div>
          <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1.5 rounded-lg shrink-0">
            {alt.co2Impact}
          </span>
        </div>
      ))}
    </div>
  );
}

function HealthPanel({
  guidance,
  advisory,
}: {
  guidance: AirWisePlan['healthGuidance'];
  advisory: AirWisePlan['winterSmogAdvisory'];
}) {
  return (
    <div className="space-y-4" role="tabpanel">
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-200 text-xs space-y-1.5">
        <span className="font-bold uppercase tracking-wider block">Diwali & Stubble Advisory</span>
        <p className="leading-relaxed">{advisory.diwaliStubbleAlert}</p>
        <p className="leading-relaxed text-amber-300">{advisory.peakHoursWarning}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {guidance.map((g, i) => (
          <div key={i} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {g.group.replace('_', ' ')}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">{g.advisory}</p>
            <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
              {g.criticalRestrictions.map((r, ri) => (
                <li key={ri}>{r}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
