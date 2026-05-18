'use client';

import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ClientOnly } from '@/components/shared/ClientOnly';
import { formatDuration } from '@/lib/utils';

interface Props {
  data: { t: number; velocity: number }[];
  typingPattern: 'natural' | 'mixed' | 'uniform';
}

export function RhythmStrip({ data, typingPattern }: Props) {
  const subtitle = typingPattern === 'natural'
    ? 'Variance suggests natural problem-solving'
    : typingPattern === 'uniform'
      ? 'Uniform pattern is consistent with external content'
      : 'Mixed pattern — some natural variation';

  // Filter out empty buckets at the edges; don't show zero-velocity trailing silence
  const trimmed = data.filter((d, i, arr) => {
    if (d.velocity > 0) return true;
    const prev = arr[i - 1];
    const next = arr[i + 1];
    return (prev && prev.velocity > 0) || (next && next.velocity > 0);
  });

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold">Typing Rhythm</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
      <div className="h-20">
        <ClientOnly fallback={<div className="h-20 bg-muted/20 rounded animate-pulse" />}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trimmed} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="t" hide type="number" domain={['dataMin', 'dataMax']} scale="linear" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as { t: number; velocity: number };
                  return (
                    <div className="bg-popover border border-border rounded px-2 py-1 text-xs">
                      {formatDuration(d.t)}: {d.velocity}% velocity
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="velocity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ClientOnly>
      </div>
    </div>
  );
}
