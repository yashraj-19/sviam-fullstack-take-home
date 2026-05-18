'use client';

import type { SessionAnalysis } from '@/lib/types';

interface Props {
  behaviorSummary: SessionAnalysis['behaviorSummary'];
}

type Level = 'green' | 'yellow' | 'red';

function Dot({ level }: { level: Level }) {
  const colors = { green: 'bg-green-400', yellow: 'bg-yellow-400', red: 'bg-red-400' };
  return <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors[level]}`} />;
}

function Row({ label, value, level }: { label: string; value: string; level: Level }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <Dot level={level} />
        <span className="text-xs font-medium">{value}</span>
      </div>
    </div>
  );
}

export function BehaviorSummary({ behaviorSummary }: Props) {
  const { typingPattern, constructionStyle, pasteUsage, correctionFrequency, longPauseCount } = behaviorSummary;

  const typingLevel: Level = typingPattern === 'natural' ? 'green' : typingPattern === 'mixed' ? 'yellow' : 'red';
  const constructionLevel: Level = constructionStyle === 'incremental' ? 'green' : constructionStyle === 'mixed' ? 'yellow' : 'red';
  const pasteLevel: Level = pasteUsage === 'none' || pasteUsage === 'light' ? 'green' : pasteUsage === 'moderate' ? 'yellow' : 'red';
  const correctionLevel: Level = correctionFrequency === 'moderate' ? 'green' : correctionFrequency === 'high' ? 'yellow' : 'green';
  const pauseLevel: Level = longPauseCount === 0 ? 'green' : longPauseCount <= 2 ? 'yellow' : 'red';

  const CONSTRUCTION_LABELS = {
    incremental: 'Built step-by-step',
    mixed: 'Mixed construction',
    sudden: 'Appeared suddenly',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3">Behavior Summary</h3>
      <Row label="Typing Pattern" value={typingPattern === 'natural' ? 'Natural' : typingPattern === 'mixed' ? 'Mixed' : 'Uniform'} level={typingLevel} />
      <Row label="Construction Style" value={CONSTRUCTION_LABELS[constructionStyle]} level={constructionLevel} />
      <Row label="Paste Usage" value={pasteUsage.charAt(0).toUpperCase() + pasteUsage.slice(1)} level={pasteLevel} />
      <Row label="Correction Frequency" value={correctionFrequency.charAt(0).toUpperCase() + correctionFrequency.slice(1)} level={correctionLevel} />
      <Row label="Long Pauses (>30s)" value={String(longPauseCount)} level={pauseLevel} />
    </div>
  );
}
