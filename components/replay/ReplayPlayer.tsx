'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CodeEditor } from './CodeEditor';
import { PlaybackControls } from './PlaybackControls';
import { PasteFlash } from './PasteFlash';
import { PauseOverlay } from './PauseOverlay';
import { CursorJumpIndicator } from './CursorJumpIndicator';
import { buildSnapshots, reconstructAt } from '@/lib/replay/codeReconstructor';
import { getEventsInWindow } from '@/lib/replay/eventScheduler';
import type { Session, SessionEvent, PasteEvent, PauseEvent, CursorJumpEvent, Flag } from '@/lib/types';

interface ActiveAnimation {
  type: 'paste' | 'pause' | 'jump';
  expiresAt: number; // real-world ms timestamp
  data: {
    charCount?: number;
    duration?: number;
    fromLine?: number;
    toLine?: number;
  };
}

interface Props {
  session: Session;
  flags: Flag[];
  onTimeUpdate?: (t: number) => void;
  seekRef?: { current: ((t: number) => void) | null };
}

const SKIP_SILENCE_THRESHOLD = 10;

export function ReplayPlayer({ session, flags, onTimeUpdate, seekRef }: Props) {
  const { events, session_duration_seconds, language } = session;

  // Pre-build snapshots once
  const snapshots = useRef(buildSnapshots(events, session_duration_seconds));

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [skipSilence, setSkipSilence] = useState(false);
  const [activeAnimations, setActiveAnimations] = useState<ActiveAnimation[]>([]);
  const [code, setCode] = useState('');

  const rafRef = useRef<number | null>(null);
  const lastRealTimeRef = useRef<number | null>(null);
  // Ref so the rAF loop always reads the latest session time without stale closures
  const sessionTimeRefCurrent = useRef(0);

  function addAnimation(anim: ActiveAnimation) {
    setActiveAnimations(prev => [...prev.filter(a => a.expiresAt > Date.now()), anim]);
  }

  const processEvents = useCallback((firedEvents: SessionEvent[]) => {
    const now = Date.now();
    for (const ev of firedEvents) {
      if (ev.type === 'paste') {
        const paste = ev as PasteEvent;
        addAnimation({ type: 'paste', expiresAt: now + 1500, data: { charCount: paste.content_length } });
      } else if (ev.type === 'pause') {
        const pause = ev as PauseEvent;
        if (pause.duration_seconds > 2) {
          // Overlay shown for the duration of the pause in session time.
          // We cap visual TTL to 3s real-time so it doesn't hang at high speeds.
          const ttl = Math.min((pause.duration_seconds / speed) * 1000, 3000);
          addAnimation({ type: 'pause', expiresAt: now + ttl, data: { duration: pause.duration_seconds } });
        }
      } else if (ev.type === 'cursor_jump') {
        const jump = ev as CursorJumpEvent;
        addAnimation({ type: 'jump', expiresAt: now + 1200, data: { fromLine: jump.from_line, toLine: jump.to_line } });
      }
    }
  }, [speed]);

  // rAF loop
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRealTimeRef.current = null;
      return;
    }

    function tick(realNow: number) {
      if (lastRealTimeRef.current === null) {
        lastRealTimeRef.current = realNow;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const deltaReal = realNow - lastRealTimeRef.current;
      lastRealTimeRef.current = realNow;

      let deltaSession = (deltaReal / 1000) * speed;
      const prev = sessionTimeRefCurrent.current;

      // Skip silence: if next event is a pause > threshold, jump past it
      if (skipSilence) {
        for (const ev of events) {
          if (ev.type === 'pause' && ev.timestamp >= prev && ev.timestamp <= prev + deltaSession + 1) {
            const pause = ev as PauseEvent;
            if (pause.duration_seconds > SKIP_SILENCE_THRESHOLD) {
              deltaSession += pause.duration_seconds;
            }
          }
        }
      }

      const newTime = prev + deltaSession;

      if (newTime >= session_duration_seconds) {
        sessionTimeRefCurrent.current = session_duration_seconds;
        setCurrentTime(session_duration_seconds);
        onTimeUpdate?.(session_duration_seconds);
        setCode(reconstructAt(events, session_duration_seconds, snapshots.current));
        setIsPlaying(false);
        return;
      }

      sessionTimeRefCurrent.current = newTime;
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
      setCode(reconstructAt(events, newTime, snapshots.current));

      const fired = getEventsInWindow(events, prev, newTime);
      if (fired.length > 0) processEvents(fired);

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, speed, skipSilence, events, session_duration_seconds, processEvents]);

  // Initialize code on mount
  useEffect(() => {
    setCode(reconstructAt(events, 0, snapshots.current));
  }, [events]);

  const handleSeek = useCallback((t: number) => {
    sessionTimeRefCurrent.current = t;
    setCurrentTime(t);
    onTimeUpdate?.(t);
    setCode(reconstructAt(events, t, snapshots.current));
    lastRealTimeRef.current = null; // reset delta on seek so rAF doesn't jump forward
  }, [events, onTimeUpdate]);

  // Expose seek to parent via ref
  useEffect(() => {
    if (seekRef) seekRef.current = handleSeek;
    return () => { if (seekRef) seekRef.current = null; };
  }, [seekRef, handleSeek]);

  function handleTogglePlay() {
    if (currentTime >= session_duration_seconds) {
      handleSeek(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  }

  // "Jump to next flag" — find next flag after currentTime
  const nextFlag = flags.find(f => f.timestamp > currentTime);
  function handleJumpToNextFlag() {
    if (nextFlag) handleSeek(nextFlag.timestamp);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case ' ': e.preventDefault(); handleTogglePlay(); break;
        case 'ArrowLeft': handleSeek(Math.max(0, sessionTimeRefCurrent.current - 5)); break;
        case 'ArrowRight': handleSeek(Math.min(session_duration_seconds, sessionTimeRefCurrent.current + 5)); break;
        case 'j': case 'J': handleSeek(Math.max(0, sessionTimeRefCurrent.current - 10)); break;
        case 'l': case 'L': handleSeek(Math.min(session_duration_seconds, sessionTimeRefCurrent.current + 10)); break;
        case '1': setSpeed(1); break;
        case '2': setSpeed(2); break;
        case '4': setSpeed(4); break;
        case '8': setSpeed(8); break;
        case 'f': case 'F': handleJumpToNextFlag(); break;
        case 's': case 'S': setSkipSilence(p => !p); break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flags, currentTime, session_duration_seconds]);

  // Derive active animation states
  const now = Date.now();
  const liveAnims = activeAnimations.filter(a => a.expiresAt > now);
  const pasteAnim = liveAnims.find(a => a.type === 'paste');
  const pauseAnim = liveAnims.find(a => a.type === 'pause');
  const jumpAnim = liveAnims.find(a => a.type === 'jump');

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 min-h-0">
        <CodeEditor code={code} language={language} />
        <PasteFlash visible={!!pasteAnim} charCount={pasteAnim?.data.charCount ?? 0} />
        <PauseOverlay visible={!!pauseAnim} durationSeconds={pauseAnim?.data.duration ?? 0} />
        <CursorJumpIndicator
          visible={!!jumpAnim}
          fromLine={jumpAnim?.data.fromLine ?? 0}
          toLine={jumpAnim?.data.toLine ?? 0}
        />
      </div>

      <PlaybackControls
        currentTime={currentTime}
        duration={session_duration_seconds}
        isPlaying={isPlaying}
        speed={speed}
        skipSilence={skipSilence}
        hasNextFlag={!!nextFlag}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onSpeedChange={setSpeed}
        onToggleSkipSilence={() => setSkipSilence(p => !p)}
        onJumpToNextFlag={handleJumpToNextFlag}
      />
    </div>
  );
}
