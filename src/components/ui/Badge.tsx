import React from 'react';
import { AqiCategory } from '@/domain/types';
import { AlertCircle, AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';

interface BadgeProps {
  category: AqiCategory;
  label: string;
}

/**
 * Accessible status badge combining color, categorical text, and an icon.
 * Guarantees zero reliance on color alone in accordance with WCAG 2.2 AA.
 */
export function AqiBadge({ category, label }: BadgeProps) {
  const configs: Record<
    AqiCategory,
    { bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    good: {
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-300',
      border: 'border-emerald-600',
      icon: <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />,
    },
    moderate: {
      bg: 'bg-amber-950/80',
      text: 'text-amber-300',
      border: 'border-amber-600',
      icon: <Info className="w-4 h-4 shrink-0" aria-hidden="true" />,
    },
    'unhealthy-sensitive': {
      bg: 'bg-orange-950/80',
      text: 'text-orange-300',
      border: 'border-orange-600',
      icon: <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />,
    },
    unhealthy: {
      bg: 'bg-red-950/80',
      text: 'text-red-300',
      border: 'border-red-600',
      icon: <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />,
    },
    'very-unhealthy': {
      bg: 'bg-purple-950/80',
      text: 'text-purple-300',
      border: 'border-purple-600',
      icon: <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />,
    },
    hazardous: {
      bg: 'bg-rose-950',
      text: 'text-rose-200 font-bold',
      border: 'border-rose-500',
      icon: <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />,
    },
  };

  const current = configs[category] || configs.moderate;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${current.bg} ${current.text} ${current.border}`}
      role="status"
    >
      {current.icon}
      <span>{label}</span>
    </span>
  );
}
