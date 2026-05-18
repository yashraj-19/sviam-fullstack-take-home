'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface Props {
  rhythmProfile: { t: number; velocity: number }[];
  onContextApplied: (note: string | null) => void;
}

export function ReviewerContextNotes({ rhythmProfile, onContextApplied }: Props) {
  const [open, setOpen] = useState(false);
  const [wpm, setWpm] = useState('');
  const [years, setYears] = useState('');
  const [proficiency, setProficiency] = useState('');
  const [applied, setApplied] = useState(false);

  // Estimate peak observed WPM from rhythm profile
  // chars/sec * 5 chars/word * 60s/min ≈ WPM
  const maxVelocity = Math.max(...rhythmProfile.map(r => r.velocity), 1);
  // velocity is normalized 0-100; we stored chars/sec normalized — rough estimate
  const peakObservedWpm = Math.round(maxVelocity * 0.8);

  function handleApply() {
    const claimedWpm = parseInt(wpm);
    if (!isNaN(claimedWpm) && claimedWpm > 0) {
      if (claimedWpm < peakObservedWpm * 0.5) {
        onContextApplied(
          `Note: observed peak typing speed (~${peakObservedWpm} WPM equivalent) significantly exceeds the reported ${claimedWpm} WPM. Recommend a live typing demonstration in follow-up.`
        );
      } else {
        onContextApplied(null);
      }
    } else {
      onContextApplied(null);
    }
    setApplied(true);
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <span className="text-sm font-semibold">Reviewer Context</span>
          <span className="text-xs text-muted-foreground ml-2">(optional)</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border">
          <p className="text-xs text-muted-foreground pt-3 leading-relaxed">
            If captured at interview intake, these inputs would refine the integrity verdict. Currently reviewer-editable for what-if analysis.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wpm" className="text-xs">Claimed WPM</Label>
              <Input
                id="wpm"
                type="number"
                placeholder="e.g. 65"
                value={wpm}
                onChange={e => setWpm(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="years" className="text-xs">Years experience</Label>
              <Input
                id="years"
                type="number"
                placeholder="e.g. 3"
                value={years}
                onChange={e => setYears(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Language proficiency</Label>
            <Select value={proficiency} onValueChange={v => setProficiency(v ?? '')}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" className="w-full text-xs" onClick={handleApply}>
            {applied ? 'Context Applied ✓' : 'Apply Context'}
          </Button>
        </div>
      )}
    </div>
  );
}
