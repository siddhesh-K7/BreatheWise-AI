'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GeocodingResult, LocationQuery } from '@/domain/types';
import { Loader2, MapPin, Search, X } from 'lucide-react';

interface CitySearchBarProps {
  onSelectLocation: (loc: LocationQuery) => void;
  placeholder?: string;
}

/**
 * Debounced autocomplete city search bar connecting to Open-Meteo Geocoding.
 */
export function CitySearchBar({
  onSelectLocation,
  placeholder = 'Search Indian city or town...',
}: CitySearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/geocoding?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setResults(data.data);
          setIsOpen(data.data.length > 0);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (r: GeocodingResult) => {
    onSelectLocation({
      cityName: r.name,
      stateName: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
    });
    setQuery(r.name);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full sm:w-72">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="text"
          role="combobox"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Search city or town"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="city-search-listbox"
          className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[36px]"
        />
        {isLoading ? (
          <Loader2
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400 animate-spin"
            aria-hidden="true"
          />
        ) : query ? (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            aria-label="Clear search query"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          id="city-search-listbox"
          role="listbox"
          aria-label="Geocoding search suggestions"
          className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden text-xs divide-y divide-slate-800"
        >
          {results.map((r) => (
            <li
              key={r.id}
              role="option"
              aria-selected="false"
              onClick={() => handleSelect(r)}
              className="p-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                <span className="font-medium text-white truncate">{r.name}</span>
                {r.admin1 && <span className="text-[10px] text-slate-400">({r.admin1})</span>}
              </div>
              <span className="text-[10px] font-mono text-emerald-400 shrink-0 ml-2">
                {r.countryCode}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
