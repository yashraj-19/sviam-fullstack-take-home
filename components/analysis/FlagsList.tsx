'use client';

import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import type { Flag } from '@/lib/types';

interface Props {
  flags: Flag[];
  onJumpToFlag: (timestamp: number) => void;
}

const SEVERITY_COLORS: Record<Flag['severity'], string> = {
  high: 'bg-red-500/20 text-red-300 border-red-500/30',
  medium: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  low: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

export function FlagsList({ flags, onJumpToFlag }: Props) {
  if (flags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mb-3 opacity-30" />
        <p className="text-sm">No behavioral flags detected.</p>
        <p className="text-xs mt-1">This session shows organic coding patterns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {flags.map(flag => (
        <button
          key={flag.id}
          className="w-full text-left bg-card border border-border rounded-lg p-3 hover:border-border/80 hover:bg-muted/20 transition-colors"
          onClick={() => onJumpToFlag(flag.timestamp)}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-sm font-medium">{flag.title}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[flag.severity]}`}>
                {flag.severity}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">
                {formatDuration(flag.timestamp)}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{flag.shortSummary}</p>
        </button>
      ))}
    </div>
  );
}
