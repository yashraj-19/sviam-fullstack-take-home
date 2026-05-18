'use client';

import { Play, Pause, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDuration } from '@/lib/utils';

interface Props {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  speed: number;
  skipSilence: boolean;
  hasNextFlag: boolean;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onSpeedChange: (s: number) => void;
  onToggleSkipSilence: () => void;
  onJumpToNextFlag: () => void;
}

const SPEEDS = [1, 2, 4, 8];

export function PlaybackControls({
  currentTime, duration, isPlaying, speed, skipSilence, hasNextFlag,
  onTogglePlay, onSeek, onSpeedChange, onToggleSkipSilence, onJumpToNextFlag,
}: Props) {
  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm px-4 py-3">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-2">
        {/* Scrub row */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground w-20 shrink-0 tabular-nums">
            {formatDuration(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            min={0}
            max={duration}
            step={1}
            className="flex-1"
            onValueChange={(vals) => onSeek(Array.isArray(vals) ? vals[0] : (vals as number))}
          />
          <span className="font-mono text-xs text-muted-foreground w-20 text-right shrink-0 tabular-nums">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-4">
          {/* Play / speed */}
          <div className="flex items-center gap-2">
            <Button size="icon" variant="default" onClick={onTogglePlay} className="h-9 w-9">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <div className="flex items-center gap-1">
              {SPEEDS.map(s => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors
                    ${speed === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="skip-silence"
                checked={skipSilence}
                onCheckedChange={onToggleSkipSilence}
                className="scale-90"
              />
              <Label htmlFor="skip-silence" className="text-xs text-muted-foreground cursor-pointer">
                Skip silence
              </Label>
            </div>

            <Tooltip>
              <TooltipTrigger render={<span className="inline-flex" />}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onJumpToNextFlag}
                  disabled={!hasNextFlag}
                  className="gap-1.5 text-xs"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Next flag
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {hasNextFlag ? 'Jump to next flagged event (F)' : 'No more flags'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
