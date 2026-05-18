'use client';

import { useRef, useState, useCallback } from 'react';
import { FlagDetailPopover } from './FlagDetailPopover';
import { formatDuration } from '@/lib/utils';
import type { SessionEvent, Flag, PauseEvent } from '@/lib/types';

interface Props {
  events: SessionEvent[];
  flags: Flag[];
  duration: number;
  currentTime: number;
  onSeek: (t: number) => void;
}

const TRACK = { keystroke: 0, paste: 1, delete: 2, pause: 3, cursor_jump: 4 } as const;
const TRACK_COUNT = 5;
const TRACK_LABELS = ['Keystroke', 'Paste', 'Delete', 'Pause', 'Jump'];
const TRACK_COLORS: Record<string, string> = {
  keystroke: '#6b7280',
  paste: '#3b82f6',
  delete: '#f97316',
  pause: '#9ca3af',
  cursor_jump: '#a855f7',
};
const SEVERITY_RING: Record<string, string> = { high: '#ef4444', medium: '#f97316', low: '#eab308' };

const SVG_HEIGHT = 120;
const TRACK_HEIGHT = SVG_HEIGHT / TRACK_COUNT;
const DOT_R = 4;
const FLAG_DOT_R = 6;

export function EventTimeline({ events, flags, duration, currentTime, onSeek }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);

  // Map flagged event indices for quick lookup
  const flagByEventIndex = new Map<number, Flag>();
  for (const f of flags) {
    if (f.eventIndex >= 0) flagByEventIndex.set(f.eventIndex, f);
  }

  const getX = useCallback((t: number, width: number) => {
    return duration > 0 ? (t / duration) * width : 0;
  }, [duration]);

  const getTrackY = (track: number) => TRACK_HEIGHT * track + TRACK_HEIGHT / 2;

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const t = (x / rect.width) * duration;
    onSeek(Math.max(0, Math.min(duration, t)));
  }

  return (
    <div className="border-t border-border bg-card/50 px-4 py-3">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-medium text-muted-foreground">Events</span>
          <div className="flex items-center gap-3 flex-wrap">
            {Object.entries(TRACK_COLORS).map(([type, color]) => (
              <span key={type} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                {TRACK_LABELS[TRACK[type as keyof typeof TRACK]]}
              </span>
            ))}
          </div>
        </div>

        <div className="relative w-full rounded-lg bg-background/50 border border-border/50">
          {/* Flag pin overlay — HTML elements so popovers can anchor to them */}
          {flags.filter(f => f.eventIndex >= 0).map(flag => {
            const leftPct = duration > 0 ? (flag.timestamp / duration) * 100 : 0;
            return (
              <div
                key={flag.id}
                className="absolute top-0 z-10"
                style={{ left: `${leftPct}%`, transform: 'translateX(-50%)' }}
              >
                <FlagDetailPopover flag={flag} onJump={onSeek}>
                  <span
                    className="block w-2 opacity-0 cursor-pointer"
                    style={{ height: SVG_HEIGHT }}
                    aria-label={flag.title}
                    role="button"
                    tabIndex={0}
                  />
                </FlagDetailPopover>
              </div>
            );
          })}
          <svg
            ref={svgRef}
            width="100%"
            height={SVG_HEIGHT}
            className="cursor-crosshair block"
            onClick={handleSvgClick}
            style={{ display: 'block' }}
          >
            <SvgContent
              events={events}
              flagByEventIndex={flagByEventIndex}
              duration={duration}
              currentTime={currentTime}
              hoveredEvent={hoveredEvent}
              setHoveredEvent={setHoveredEvent}
              getX={getX}
              getTrackY={getTrackY}
              onSeek={onSeek}
            />
          </svg>
        </div>

        {/* Time axis */}
        <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
          <span>0:00</span>
          <span>{formatDuration(duration * 0.25)}</span>
          <span>{formatDuration(duration * 0.5)}</span>
          <span>{formatDuration(duration * 0.75)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
    </div>
  );
}

// Separated so SVG foreignObject isn't needed for tooltips — we use absolute positioned divs
function SvgContent({
  events, flagByEventIndex, duration, currentTime, hoveredEvent, setHoveredEvent, getX, getTrackY, onSeek
}: {
  events: SessionEvent[];
  flagByEventIndex: Map<number, Flag>;
  duration: number;
  currentTime: number;
  hoveredEvent: number | null;
  setHoveredEvent: (i: number | null) => void;
  getX: (t: number, w: number) => number;
  getTrackY: (track: number) => number;
  onSeek: (t: number) => void;
}) {
  // Render tracks and events at a fixed logical width, scaled by SVG viewBox
  const W = 1200;

  return (
    <svg viewBox={`0 0 ${W} ${SVG_HEIGHT}`} preserveAspectRatio="none" style={{ width: '100%', height: SVG_HEIGHT }}>
      {/* Track backgrounds */}
      {Array.from({ length: TRACK_COUNT }).map((_, i) => (
        <rect
          key={i}
          x={0}
          y={TRACK_HEIGHT * i}
          width={W}
          height={TRACK_HEIGHT}
          fill={i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)'}
        />
      ))}

      {/* Events */}
      {events.map((ev, i) => {
        const x = getX(ev.timestamp, W);
        const trackIndex = TRACK[ev.type as keyof typeof TRACK] ?? 0;
        const y = getTrackY(trackIndex);
        const color = TRACK_COLORS[ev.type] ?? '#6b7280';
        const flag = flagByEventIndex.get(i);
        const r = flag ? FLAG_DOT_R : DOT_R;

        // Pause events: render as a bar
        if (ev.type === 'pause') {
          const pause = ev as PauseEvent;
          const barW = Math.max(2, (pause.duration_seconds / duration) * W);
          return (
            <g key={i}>
              <rect
                x={x}
                y={y - TRACK_HEIGHT * 0.35}
                width={barW}
                height={TRACK_HEIGHT * 0.7}
                fill={flag ? SEVERITY_RING[flag.severity] : color}
                fillOpacity={flag ? 0.5 : 0.3}
                rx={2}
              />
            </g>
          );
        }

        const isFlagged = !!flag;
        return (
          <g key={i} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onSeek(ev.timestamp); }}>
            {/* Outer ring for flagged events */}
            {isFlagged && (
              <circle cx={x} cy={y} r={r + 4} fill={SEVERITY_RING[flag.severity]} fillOpacity={0.2} />
            )}
            <circle
              cx={x} cy={y} r={r}
              fill={isFlagged ? SEVERITY_RING[flag.severity] : color}
              fillOpacity={hoveredEvent === i ? 1 : 0.7}
              onMouseEnter={() => setHoveredEvent(i)}
              onMouseLeave={() => setHoveredEvent(null)}
            />
            {isFlagged && (
              <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="white" style={{ pointerEvents: 'none' }}>
                !
              </text>
            )}
          </g>
        );
      })}

      {/* Playhead */}
      {duration > 0 && (
        <line
          x1={getX(currentTime, W)}
          x2={getX(currentTime, W)}
          y1={0}
          y2={SVG_HEIGHT}
          stroke="white"
          strokeWidth={1.5}
          strokeOpacity={0.8}
          strokeDasharray="3 2"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </svg>
  );
}
