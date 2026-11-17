import React from 'react';
import { TranslationDictionary } from '@/config/translations';
import { ShieldCheck, HeartHandshake } from 'lucide-react';

interface FooterProps {
  t: TranslationDictionary;
}

/**
 * Accessible footer with health disclaimer, zero-PII privacy guarantee, and methodology link.
 */
export function Footer({ t }: FooterProps) {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 mt-16 py-10 px-4 sm:px-6 lg:px-8 text-slate-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex items-start gap-3">
          <HeartHandshake className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-slate-200 text-sm mb-1">
              {t.medicalDisclaimerTitle}
            </h2>
            <p className="leading-relaxed text-slate-400">{t.medicalDisclaimerBody}</p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 space-y-1">
          <p>
            Atmospheric telemetry powered by{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 underline hover:text-white"
            >
              Open-Meteo (CC BY 4.0)
            </a>
            , ground station cross-check feed via{' '}
            <a
              href="https://waqi.info/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 underline hover:text-white"
            >
              World Air Quality Index (WAQI / aqicn.org)
            </a>
            , and active thermal anomaly detection courtesy of{' '}
            <a
              href="https://firms.modaps.eosdis.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 underline hover:text-white"
            >
              NASA FIRMS VIIRS
            </a>
            .
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>
              Privacy Guard: Zero PII persisted. GPS coordinates rounded to 2 decimal places.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/SabarishR08/airwise-urban-air-quality-assistant"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
            >
              GitHub Source
            </a>
            <span>•</span>
            <span>Hack2skill PromptWars Challenge 6</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
