'use client';

import { Sparkles } from 'lucide-react';
import { LEVEL_COLORS, LEVEL_LABELS, LEVEL_RING } from '@/lib/utils';
import type { IntegrityLevel } from '@/lib/types';

interface Props {
  score: number;
  level: IntegrityLevel;
  verdict: string;
}

export function IntegrityVerdict({ score, level, verdict }: Props) {
  const color = LEVEL_RING[level];

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Integrity Assessment</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>Auto-generated</span>
        </div>
      </div>

      {/* Radial score + label */}
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
            <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="35" fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 2 * Math.PI * 35} ${2 * Math.PI * 35}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold tabular-nums ${LEVEL_COLORS[level]}`}>{score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>

        <div>
          <div className={`text-lg font-bold ${LEVEL_COLORS[level]}`}>
            {LEVEL_LABELS[level]}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Integrity level</div>
        </div>
      </div>

      {/* Verdict paragraph */}
      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
        {verdict}
      </p>
    </div>
  );
}
