import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { IntegrityLevel } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export const LEVEL_COLORS: Record<IntegrityLevel, string> = {
  organic: 'text-green-400',
  organic_with_assistance: 'text-yellow-400',
  suspicious: 'text-orange-400',
  highly_suspicious: 'text-red-400',
};

export const LEVEL_BG: Record<IntegrityLevel, string> = {
  organic: 'bg-green-500/10 border-green-500/30',
  organic_with_assistance: 'bg-yellow-500/10 border-yellow-500/30',
  suspicious: 'bg-orange-500/10 border-orange-500/30',
  highly_suspicious: 'bg-red-500/10 border-red-500/30',
};

export const LEVEL_RING: Record<IntegrityLevel, string> = {
  organic: '#22c55e',
  organic_with_assistance: '#eab308',
  suspicious: '#f97316',
  highly_suspicious: '#ef4444',
};

export const LEVEL_LABELS: Record<IntegrityLevel, string> = {
  organic: 'Organic',
  organic_with_assistance: 'Organic w/ Assistance',
  suspicious: 'Suspicious',
  highly_suspicious: 'Highly Suspicious',
};

export const LEVEL_EMOJI: Record<IntegrityLevel, string> = {
  organic: '🟢',
  organic_with_assistance: '🟡',
  suspicious: '🟠',
  highly_suspicious: '🔴',
};
