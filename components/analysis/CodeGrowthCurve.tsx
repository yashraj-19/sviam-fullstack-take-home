'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { ClientOnly } from '@/components/shared/ClientOnly';
import { formatDuration, formatNumber } from '@/lib/utils';

interface Props {
  data: { t: number; length: number }[];
}

export function CodeGrowthCurve({ data }: Props) {
  // Detect abrupt jumps: a step where length grows by >30% of final in one sample
  const finalLength = data.length > 0 ? data[data.length - 1].length : 0;
  const jumpTimestamps: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const delta = data[i].length - data[i - 1].length;
    if (finalLength > 0 && delta / finalLength > 0.3) {
      jumpTimestamps.push(data[i].t);
    }
  }

  const subtitle = jumpTimestamps.length > 0
    ? `${jumpTimestamps.length} abrupt growth spike${jumpTimestamps.length > 1 ? 's' : ''} detected`
    : 'Steady incremental growth';

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold">Code Growth</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
      <div className="h-40">
        <ClientOnly fallback={<div className="h-40 bg-muted/20 rounded animate-pulse" />}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tickFormatter={formatDuration} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => formatNumber(v)} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as { t: number; length: number };
                  return (
                    <div className="bg-popover border border-border rounded px-2 py-1 text-xs">
                      {formatDuration(d.t)}: {formatNumber(d.length)} chars
                    </div>
                  );
                }}
              />
              {jumpTimestamps.map(t => (
                <ReferenceLine key={t} x={t} stroke="#ef4444" strokeOpacity={0.5} strokeWidth={1.5} />
              ))}
              <Line type="monotone" dataKey="length" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ClientOnly>
      </div>
    </div>
  );
}
