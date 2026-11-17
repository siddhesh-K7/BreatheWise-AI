'use client';

import React from 'react';
import { UserProfile } from '@/domain/types';
import { TranslationDictionary } from '@/config/translations';
import { Button } from '@/components/ui/Button';
import { Home, ShieldCheck, Sparkles, Users } from 'lucide-react';

interface ProfileFormProps {
  profile: UserProfile;
  onChange: (updated: UserProfile) => void;
  onSubmit: () => void;
  isLoading: boolean;
  t: TranslationDictionary;
}

/**
 * Accessible household demographic and lifestyle questionnaire.
 */
export function ProfileForm({ profile, onChange, onSubmit, isLoading, t }: ProfileFormProps) {
  const handleToggle = (key: keyof UserProfile) => {
    onChange({ ...profile, [key]: !profile[key] });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-6"
      aria-label="Household Profile Configuration"
    >
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
        <Users className="w-5 h-5 text-emerald-400" aria-hidden="true" />
        <h2 className="text-lg font-bold text-white tracking-tight">{t.profileTitle}</h2>
      </div>

      {/* Household Vulnerabilities */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
          Vulnerability & Exposure Toggles
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer hover:border-slate-700 min-h-[44px]">
            <input
              type="checkbox"
              checked={profile.hasChildren}
              onChange={() => handleToggle('hasChildren')}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700"
            />
            <span className="text-sm text-slate-200">Children under 12</span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer hover:border-slate-700 min-h-[44px]">
            <input
              type="checkbox"
              checked={profile.hasElderly}
              onChange={() => handleToggle('hasElderly')}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700"
            />
            <span className="text-sm text-slate-200">Elderly (65+)</span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer hover:border-slate-700 min-h-[44px]">
            <input
              type="checkbox"
              checked={profile.respiratorySensitivity}
              onChange={() => handleToggle('respiratorySensitivity')}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700"
            />
            <span className="text-sm text-slate-200">Respiratory Sensitivity</span>
          </label>
        </div>
      </div>

      {/* Commute and Housing Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="commute-select"
            className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2"
          >
            Primary Commute Mode
          </label>
          <select
            id="commute-select"
            value={profile.commuteMode}
            onChange={(e) =>
              onChange({ ...profile, commuteMode: e.target.value as UserProfile['commuteMode'] })
            }
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
          >
            <option value="metro">Electric Metro Rail</option>
            <option value="bus">Public Bus Transit</option>
            <option value="car">Personal Car (Solo)</option>
            <option value="two-wheeler">Two-Wheeler (Motorcycle/Scooter)</option>
            <option value="active">Active (Cycling/Walking)</option>
            <option value="wfh">Work from Home (WFH)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="commute-km"
            className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2"
          >
            Round-Trip Commute ({profile.dailyCommuteKm} km)
          </label>
          <input
            id="commute-km"
            type="range"
            min="0"
            max="100"
            step="2"
            value={profile.dailyCommuteKm}
            onChange={(e) => onChange({ ...profile, dailyCommuteKm: Number(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer min-h-[44px]"
          />
        </div>
      </div>

      {/* Ventilation, Purifier & Fuel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="ventilation-select"
            className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2"
          >
            Home Ventilation
          </label>
          <select
            id="ventilation-select"
            value={profile.homeVentilation}
            onChange={(e) =>
              onChange({
                ...profile,
                homeVentilation: e.target.value as UserProfile['homeVentilation'],
              })
            }
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
          >
            <option value="tight-sealed">Tight Sealed (AC / Weatherized)</option>
            <option value="standard">Standard Windows / Masonry</option>
            <option value="high-leakage">Drafty / High Leakage</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="fuel-select"
            className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2"
          >
            Cooking Fuel
          </label>
          <select
            id="fuel-select"
            value={profile.cookingFuel}
            onChange={(e) =>
              onChange({ ...profile, cookingFuel: e.target.value as UserProfile['cookingFuel'] })
            }
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
          >
            <option value="lpg-induction">LPG / Electric Induction</option>
            <option value="biomass-firewood">Solid Biomass / Firewood</option>
            <option value="mixed">Mixed Household Fuels</option>
          </select>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Air Purifier
          </span>
          <button
            type="button"
            onClick={() => handleToggle('hasPurifier')}
            className={`w-full flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
              profile.hasPurifier
                ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
            aria-pressed={profile.hasPurifier}
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>{profile.hasPurifier ? 'HEPA Purifier Active' : 'No Purifier'}</span>
          </button>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span>Health toggles remain strictly in client memory.</span>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
          <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
          <span>{isLoading ? t.generatingPlanBtn : t.generatePlanBtn}</span>
        </Button>
      </div>
    </form>
  );
}
