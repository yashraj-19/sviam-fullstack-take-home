'use client';

import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  heatmap: { line: number; edits: number }[];
  code: string;
}

export function EditHeatmap({ heatmap, code }: Props) {
  const codeLines = code.split('\n');
  const maxEdits = Math.max(...heatmap.map(h => h.edits), 1);

  function getOpacity(edits: number): number {
    if (edits === 0) return 0;
    return 0.15 + (edits / maxEdits) * 0.65;
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold">Edit Density</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Cold lines (no bar) = likely pasted. Warm lines = organically built.
      </p>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-3 rounded-sm" style={{ background: `rgba(239,68,68,0.15)` }} />
          <span className="text-xs text-muted-foreground">Light editing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-3 rounded-sm" style={{ background: `rgba(239,68,68,0.8)` }} />
          <span className="text-xs text-muted-foreground">Heavy editing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-3 rounded-sm border border-border" />
          <span className="text-xs text-muted-foreground">No edits</span>
        </div>
      </div>

      <ScrollArea className="h-64 rounded border border-border bg-background">
        <div className="font-mono text-xs leading-5 p-2">
          {codeLines.map((line, i) => {
            const lineNum = i + 1;
            const entry = heatmap.find(h => h.line === lineNum);
            const edits = entry?.edits ?? 0;
            const opacity = getOpacity(edits);

            return (
              <div key={i} className="flex items-stretch group">
                {/* Heat bar */}
                <div
                  className="w-1 shrink-0 rounded-sm mr-2 self-stretch"
                  style={{ background: opacity > 0 ? `rgba(239,68,68,${opacity})` : 'transparent' }}
                />
                {/* Line number */}
                <span className="text-muted-foreground/40 w-7 shrink-0 text-right mr-3 select-none">
                  {lineNum}
                </span>
                {/* Code */}
                <span className="text-foreground/80 whitespace-pre overflow-hidden">{line || ' '}</span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
