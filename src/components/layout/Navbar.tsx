'use client';

import React from 'react';
import { SupportedLanguage } from '@/domain/types';
import { Wind } from 'lucide-react';

interface NavbarProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

/**
 * Main application navigation header with localized language controls.
 */
export function Navbar({ currentLanguage, onLanguageChange }: NavbarProps) {
  const languages: { code: SupportedLanguage; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'hi', label: 'हिन्दी' },
  ];

  return (
    <nav
      className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40"
      aria-label="Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-950/50">
            <Wind className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl text-white tracking-tight">
                AirWise
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300">
                Live Open-Meteo
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Urban Air Quality & Winter Smog Assistant
            </p>
          </div>
        </div>

        {/* Language selector */}
        <div
          className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800"
          role="group"
          aria-label="Language selection"
        >
          {languages.map((lang) => {
            const isActive = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[36px] ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                aria-pressed={isActive}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
