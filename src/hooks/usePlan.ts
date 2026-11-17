'use client';

import { useState } from 'react';
import { AirWisePlan, LocationQuery, SupportedLanguage, UserProfile } from '@/domain/types';

interface UsePlanReturn {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  plan: AirWisePlan | null;
  isLoading: boolean;
  error: string | null;
  generatePlan: (loc: LocationQuery, lang: SupportedLanguage) => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
  hasChildren: true,
  hasElderly: false,
  respiratorySensitivity: false,
  commuteMode: 'car',
  dailyCommuteKm: 24,
  homeVentilation: 'standard',
  hasPurifier: false,
  cookingFuel: 'lpg-induction',
  workSetting: 'hybrid',
};

/**
 * Custom hook orchestrating profile inputs and action plan synthesis.
 */
export function usePlan(): UsePlanReturn {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [plan, setPlan] = useState<AirWisePlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePlan = async (loc: LocationQuery, lang: SupportedLanguage) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: loc,
          profile,
          language: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Plan generation failed');
      }

      setPlan(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan synthesis failed');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profile,
    setProfile,
    plan,
    isLoading,
    error,
    generatePlan,
  };
}
