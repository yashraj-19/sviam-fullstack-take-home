'use client';

import type { SessionSummary } from '@/lib/types';
import { LEVEL_COLORS, LEVEL_LABELS } from '@/lib/utils';

interface Props {
  sessions: SessionSummary[];
}

export function StatsBar({ sessions }: Props) {
  const total = sessions.length;
  const labeled = sessions.filter(s => s.label !== null).length;
  const avgScore = total > 0
    ? Math.round(sessions.reduce((a, s) => a + s.integrityScore, 0) / total)
    : 0;

  const counts = {
    organic: sessions.filter(s => s.integrityLevel === 'organic').length,
    organic_with_assistance: sessions.filter(s => s.integrityLevel === 'organic_with_assistance').length,
    suspicious: sessions.filter(s => s.integrityLevel === 'suspicious').length,
    highly_suspicious: sessions.filter(s => s.integrityLevel === 'highly_suspicious').length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
      <StatCard label="Total Sessions" value={total} />
      <StatCard label="Avg Score" value={`${avgScore}/100`} />
      <StatCard label="Labeled" value={`${labeled}/${total}`} />
      <StatCard
        label={LEVEL_LABELS.organic}
        value={counts.organic}
        colorClass={LEVEL_COLORS.organic}
      />
      <StatCard
        label={LEVEL_LABELS.suspicious}
        value={counts.suspicious}
        colorClass={LEVEL_COLORS.suspicious}
      />
      <StatCard
        label={LEVEL_LABELS.highly_suspicious}
        value={counts.highly_suspicious}
        colorClass={LEVEL_COLORS.highly_suspicious}
      />
    </div>
  );
}

function StatCard({ label, value, colorClass }: { label: string; value: string | number; colorClass?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3">
      <div className={`text-2xl font-bold tabular-nums ${colorClass ?? ''}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
