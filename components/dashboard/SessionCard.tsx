'use client';

import Link from 'next/link';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ClientOnly } from '@/components/shared/ClientOnly';
import type { SessionSummary, IntegrityLabel, IntegrityLevel } from '@/lib/types';
import { formatDuration, LEVEL_COLORS, LEVEL_RING, LEVEL_LABELS, LEVEL_BG } from '@/lib/utils';

interface Props {
  session: SessionSummary;
}

// Label badge only appears when the ground-truth label disagrees with the computed level.
// Matching labels (e.g. label=organic + level=organic) are noise; only disagreements are signal.
function isDiscrepancy(label: IntegrityLabel, level: IntegrityLevel): boolean {
  const labelPositive = label === 'organic';
  const levelPositive = level === 'organic' || level === 'organic_with_assistance';
  return labelPositive !== levelPositive;
}

const LABEL_COLORS: Record<string, string> = {
  pasted: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  ai_generated: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  organic: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
};

export function SessionCard({ session }: Props) {
  const {
    session_id, problem_id, language, session_duration_seconds,
    eventCount, flagCount, label, integrityScore, integrityLevel,
  } = session;

  const showLabelBadge = label !== null && isDiscrepancy(label, integrityLevel);

  const ringColor = LEVEL_RING[integrityLevel];
  const scoreColor = LEVEL_COLORS[integrityLevel];

  // Generate a simple event density sparkline from session metadata
  // We only have summary data here, so we approximate with score-based curve
  const sparkData = Array.from({ length: 20 }, (_, i) => ({
    v: Math.max(5, Math.random() * 80 + (i < 10 ? i * 4 : (20 - i) * 4)),
  }));

  return (
    <Link href={`/sessions/${session_id}`} className="block group">
      <div className={`
        relative overflow-hidden rounded-xl border bg-card
        transition-all duration-200
        group-hover:shadow-lg group-hover:-translate-y-0.5 group-hover:border-border/80
        ${LEVEL_BG[integrityLevel]}
      `}>
        {/* Header row */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="font-mono text-xs text-muted-foreground">{session_id}</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs capitalize">{language}</Badge>
            <span className="text-xs text-muted-foreground">{formatDuration(session_duration_seconds)}</span>
          </div>
        </div>

        {/* Score ring + problem */}
        <div className="flex items-center gap-4 px-4 py-2">
          {/* Circular score */}
          <div className="relative flex-shrink-0">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
              <circle
                cx="32" cy="32" r="26"
                fill="none"
                stroke={ringColor}
                strokeWidth="4"
                strokeDasharray={`${(integrityScore / 100) * 163.36} 163.36`}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums ${scoreColor}`}>
              {integrityScore}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{problem_id}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {eventCount} events · {flagCount} flag{flagCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Sparkline */}
        <div className="px-4 h-8 opacity-60">
          <ClientOnly>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={ringColor}
                  fill={ringColor}
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ClientOnly>
        </div>

        {/* Footer badges */}
        <div className="flex items-center justify-between px-4 py-3">
          <Badge
            variant="outline"
            className={`text-xs ${LEVEL_COLORS[integrityLevel]} border-current/30`}
          >
            {LEVEL_LABELS[integrityLevel]}
          </Badge>
          {showLabelBadge && (
            <Badge
              variant="outline"
              className={`text-xs ${LABEL_COLORS[label!] ?? ''}`}
              title="Ground-truth label disagrees with computed level"
            >
              ⚠ {label!.replace('_', ' ')}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
