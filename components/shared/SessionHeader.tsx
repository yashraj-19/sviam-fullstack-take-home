'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from './ThemeToggle';
import { formatDuration, LEVEL_COLORS, LEVEL_LABELS } from '@/lib/utils';
import type { IntegrityLevel, IntegrityLabel } from '@/lib/types';

function isDiscrepancy(label: IntegrityLabel, level: IntegrityLevel): boolean {
  const labelPositive = label === 'organic';
  const levelPositive = level === 'organic' || level === 'organic_with_assistance';
  return labelPositive !== levelPositive;
}

interface Props {
  sessionId: string;
  problemId: string;
  language: string;
  durationSeconds: number;
  integrityLevel: IntegrityLevel;
  label: IntegrityLabel | null;
}

const LABEL_COLORS: Record<string, string> = {
  organic: 'bg-green-500/20 text-green-300 border-green-500/40',
  pasted: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  ai_generated: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
};

export function SessionHeader({ sessionId, problemId, language, durationSeconds, integrityLevel, label }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Dashboard</span>
        </Link>

        <div className="h-5 border-l border-border" />

        <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
          <span className="font-mono text-sm text-muted-foreground">{sessionId}</span>
          <span className="font-semibold text-sm truncate">{problemId}</span>
          <Badge variant="outline" className="text-xs capitalize shrink-0">{language}</Badge>
          <span className="text-xs text-muted-foreground shrink-0">{formatDuration(durationSeconds)}</span>
          <Badge variant="outline" className={`text-xs shrink-0 ${LEVEL_COLORS[integrityLevel]}`}>
            {LEVEL_LABELS[integrityLevel]}
          </Badge>
          {label && isDiscrepancy(label, integrityLevel) && (
            <Badge variant="outline" className={`text-xs shrink-0 ${LABEL_COLORS[label] ?? ''}`}>
              ⚠ ground truth: {label.replace('_', ' ')}
            </Badge>
          )}
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
