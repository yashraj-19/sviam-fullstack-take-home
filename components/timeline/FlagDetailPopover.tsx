'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { Flag } from '@/lib/types';

const SEVERITY_COLORS: Record<Flag['severity'], string> = {
  high: 'bg-red-500/20 text-red-300 border-red-500/30',
  medium: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  low: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

const CATEGORY_EXPLANATIONS: Record<string, string> = {
  mega_paste: 'Large pastes (>100 chars) warrant scrutiny when they contain logic rather than boilerplate. This heuristic flags size; context determines significance.',
  robot_burst: 'Human typing speed varies due to muscle memory, word complexity, and thinking. Mechanical uniformity below 70ms/keystroke is statistically unusual for unassisted typing.',
  dead_silence: 'Extended pauses are normal before structural decisions. They become notable when immediately followed by significant code appearing without editing activity.',
  paste_without_edit: 'When candidates write their own solutions, they adapt code: rename variables, fix logic, format it. Verbatim acceptance of large pastes (no edits) is the strongest behavioral signal.',
  pause_then_burst: 'The combination of a long pause + immediate large code appearance suggests content was prepared externally and entered after the pause.',
  construction_jump: 'Organic code grows in spurts tied to logical units. A jump of >40% of final code length in 5 seconds — without a paste event — is unusual.',
  linear_only_writing: 'Human problem-solvers navigate backwards constantly: to re-read a function signature, fix a bug spotted later, add a missing import. Top-to-bottom writing with no back-navigation is consistent with transcription.',
  uniform_session_typing: 'Human typing speed varies across a session due to word difficulty, thinking, and muscle memory — natural sessions show high inter-event variance. A session-wide standard deviation below 10ms across many keystroke bursts is statistically inconsistent with unassisted human typing and is a strong signal of programmatically generated keystrokes.',
};

interface Props {
  flag: Flag;
  children: React.ReactNode;
  onJump: (timestamp: number) => void;
}

export function FlagDetailPopover({ flag, children, onJump }: Props) {
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <Popover>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="top" align="center">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold leading-tight">{flag.title}</h4>
            <Badge variant="outline" className={`text-xs shrink-0 ${SEVERITY_COLORS[flag.severity]}`}>
              {flag.severity}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">{flag.reason}</p>

          {/* Why this matters */}
          <button
            onClick={() => setWhyOpen(o => !o)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {whyOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Why does this heuristic matter?
          </button>

          {whyOpen && (
            <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
              {CATEGORY_EXPLANATIONS[flag.category] ?? 'This pattern is associated with non-organic coding behavior.'}
            </p>
          )}

          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2 text-xs"
            onClick={() => onJump(flag.timestamp)}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Jump to {Math.floor(flag.timestamp / 60)}:{String(Math.floor(flag.timestamp % 60)).padStart(2, '0')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
