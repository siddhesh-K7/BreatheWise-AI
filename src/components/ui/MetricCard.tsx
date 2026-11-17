import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'highlight' | 'danger';
}

/**
 * High-contrast metric display card with accessible semantic markup.
 */
export function MetricCard({
  label,
  value,
  unit,
  subtext,
  icon,
  variant = 'default',
}: MetricCardProps) {
  const borderVariants = {
    default: 'border-slate-800 bg-slate-900/60',
    highlight: 'border-emerald-600/50 bg-emerald-950/30',
    danger: 'border-rose-600/50 bg-rose-950/30',
  };

  return (
    <div
      className={`p-4 rounded-xl border ${borderVariants[variant]} flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between text-slate-400 mb-2">
        <span className="text-sm font-medium">{label}</span>
        {icon && (
          <span className="text-emerald-400" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{value}</span>
          {unit && <span className="text-xs sm:text-sm text-slate-400 font-medium">{unit}</span>}
        </div>
        {subtext && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{subtext}</p>}
      </div>
    </div>
  );
}
