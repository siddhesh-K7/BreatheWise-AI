'use client';

import React, { useEffect, useState } from 'react';
import { SupportedLanguage } from '@/domain/types';
import { getTranslation } from '@/config/translations';
import { useAqi } from '@/hooks/useAqi';
import { usePlan } from '@/hooks/usePlan';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PresetBar } from '@/components/layout/PresetBar';
import { HazardousBanner } from '@/components/aqi/HazardousBanner';
import { InversionCard } from '@/components/aqi/InversionCard';
import { AqiOverview } from '@/components/aqi/AqiOverview';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { PlanDisplay } from '@/components/plan/PlanDisplay';
import { WhatIfSimulator } from '@/components/simulator/WhatIfSimulator';
import { StreamingChat } from '@/components/chat/StreamingChat';
import { CommunityCard } from '@/components/community/CommunityCard';

/**
 * AirWise main dashboard coordinating telemetry, profile inputs, and AI guidance.
 */
export default function Home() {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const t = getTranslation(language);

  const {
    location,
    reading,
    weather,
    isLoading: aqiLoading,
    error: aqiError,
    selectPreset,
    requestGeolocation,
  } = useAqi();
  const { profile, setProfile, plan, isLoading: planLoading, generatePlan } = usePlan();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const handleGeneratePlan = () => {
    generatePlan(location, language);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar currentLanguage={language} onLanguageChange={setLanguage} />

      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      >
        {/* Hero Section */}
        <header className="space-y-3">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {t.appSubtitle}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
            Protect your household from winter particulate spikes. Real Open-Meteo telemetry meets
            Gemini AI action planning with deterministic health impact accounting.
          </p>
        </header>

        {/* Quick Presets & Location */}
        <PresetBar
          activeLocation={location}
          onSelectPreset={selectPreset}
          onRequestLocation={requestGeolocation}
          t={t}
        />

        {aqiError && (
          <div
            className="p-4 rounded-xl border border-rose-800 bg-rose-950/40 text-rose-300 text-xs"
            role="alert"
          >
            {aqiError}
          </div>
        )}

        {/* Hazardous Banner (AQI > 300) */}
        {reading && <HazardousBanner aqi={reading.usAqi} t={t} />}

        {/* Meteorological Inversion & Air Quality Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {reading ? (
              <AqiOverview location={location} reading={reading} t={t} />
            ) : (
              <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                <span>
                  {aqiLoading
                    ? 'Connecting to Open-Meteo Atmospheric Telemetry...'
                    : 'No telemetry available.'}
                </span>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {weather && <InversionCard weather={weather} t={t} />}
          </div>
        </div>

        {/* Profile Configuration & Generation */}
        <ProfileForm
          profile={profile}
          onChange={setProfile}
          onSubmit={handleGeneratePlan}
          isLoading={planLoading}
          t={t}
        />

        {/* Action Plan Display */}
        {plan && <PlanDisplay plan={plan} t={t} />}

        {/* What-If Exposure Simulator */}
        {reading && (
          <WhatIfSimulator
            currentPm25={reading.pm25}
            baseProfile={profile}
            initialImpact={
              plan?.quantifiedImpact || {
                pm25ReductionPercent: 30,
                pm25SavedMicrograms: 120,
                avoidedCigarettesPerDay: 2.5,
                avoidedCo2KgPerDay: 1.8,
              }
            }
            t={t}
          />
        )}

        {/* Community & Chat Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reading && <CommunityCard location={location} reading={reading} t={t} />}
          {reading && (
            <StreamingChat
              currentAqi={reading.usAqi}
              currentPm25={reading.pm25}
              cityName={location.cityName}
              language={language}
              t={t}
            />
          )}
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
