import type { Session, SessionEvent, Flag, FlagCategory, KeystrokeEvent, PasteEvent, PauseEvent } from '@/lib/types';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

let flagCounter = 0;
function makeId(category: FlagCategory): string {
  return `${category}_${++flagCounter}`;
}

function detectMegaPaste(events: SessionEvent[]): Flag[] {
  const flags: Flag[] = [];
  events.forEach((ev, i) => {
    if (ev.type !== 'paste') return;
    const paste = ev as PasteEvent;
    if (paste.content_length <= 100) return;

    const severity = paste.content_length > 300 ? 'high' : 'medium';
    const time = formatTime(paste.timestamp);
    flags.push({
      id: makeId('mega_paste'),
      eventIndex: i,
      timestamp: paste.timestamp,
      severity,
      category: 'mega_paste',
      title: 'Large Paste Detected',
      shortSummary: `${paste.content_length}-char paste at ${time}`,
      reason: `A ${paste.content_length}-character block was pasted at ${time}. Large pastes can be legitimate (boilerplate, imports) but warrant verification when they contain substantive logic.`,
    });
  });
  return flags;
}

function detectRobotBurst(events: SessionEvent[]): Flag[] {
  const flags: Flag[] = [];
  events.forEach((ev, i) => {
    if (ev.type !== 'keystroke') return;
    const ks = ev as KeystrokeEvent;
    if (ks.avg_ms_between_keys >= 70 || ks.chars <= 15) return;

    const severity = ks.avg_ms_between_keys < 50 ? 'high' : 'medium';
    const time = formatTime(ks.timestamp);
    flags.push({
      id: makeId('robot_burst'),
      eventIndex: i,
      timestamp: ks.timestamp,
      severity,
      category: 'robot_burst',
      title: 'Unusually Fast Typing Burst',
      shortSummary: `Uniform ${ks.avg_ms_between_keys}ms typing burst over ${ks.chars} chars at ${time}`,
      reason: `A ${ks.chars}-character burst at ${time} averaged ${ks.avg_ms_between_keys}ms between keys — below the 70ms threshold consistent with natural human typing. Mechanical uniformity at this speed is atypical and may indicate externally-generated content being entered programmatically.`,
    });
  });
  return flags;
}

function detectDeadSilence(events: SessionEvent[]): Flag[] {
  const flags: Flag[] = [];
  events.forEach((ev, i) => {
    if (ev.type !== 'pause') return;
    const pause = ev as PauseEvent;
    if (pause.duration_seconds <= 30) return;

    const severity = pause.duration_seconds > 90 ? 'high' : 'medium';
    const time = formatTime(pause.timestamp);
    flags.push({
      id: makeId('dead_silence'),
      eventIndex: i,
      timestamp: pause.timestamp,
      severity,
      category: 'dead_silence',
      title: 'Extended Silence',
      shortSummary: `${Math.round(pause.duration_seconds)}s silence at ${time}`,
      reason: `A ${Math.round(pause.duration_seconds)}-second pause occurred at ${time}. While thinking pauses are normal, silences beyond 30 seconds — especially before significant code changes — may indicate external consultation.`,
    });
  });
  return flags;
}

function detectPasteWithoutEdit(events: SessionEvent[]): Flag[] {
  const flags: Flag[] = [];
  events.forEach((ev, i) => {
    if (ev.type !== 'paste') return;
    const paste = ev as PasteEvent;
    if (paste.content_length <= 150) return;

    // Count keystroke chars in the 60s window after the paste
    const windowEnd = paste.timestamp + 60;
    let charCount = 0;
    for (let j = i + 1; j < events.length; j++) {
      const next = events[j];
      if (next.timestamp > windowEnd) break;
      if (next.type === 'keystroke') {
        charCount += (next as KeystrokeEvent).chars;
      }
    }

    if (charCount >= 20) return;

    const time = formatTime(paste.timestamp);
    flags.push({
      id: makeId('paste_without_edit'),
      eventIndex: i,
      timestamp: paste.timestamp,
      severity: 'high',
      category: 'paste_without_edit',
      title: 'Paste Without Meaningful Edit',
      shortSummary: `${paste.content_length}-char paste at ${time}, only ${charCount} chars typed after`,
      reason: `A ${paste.content_length}-character paste was inserted at ${time}, but only ${charCount} keystrokes followed within the next minute. Candidates writing their own solutions typically adapt pasted code (rename variables, fix formatting, debug). Minimal post-paste activity is a notable behavioral pattern.`,
    });
  });
  return flags;
}

function detectPauseThenBurst(events: SessionEvent[]): Flag[] {
  const flags: Flag[] = [];
  events.forEach((ev, i) => {
    if (ev.type !== 'pause') return;
    const pause = ev as PauseEvent;
    if (pause.duration_seconds <= 20) return;

    // Look for a paste >100 chars or keystroke >100 chars within 5s of pause end
    const pauseEnd = pause.timestamp + pause.duration_seconds;
    const burstWindow = pauseEnd + 5;

    for (let j = i + 1; j < events.length; j++) {
      const next = events[j];
      if (next.timestamp > burstWindow) break;
      if (next.timestamp < pauseEnd) continue;

      const isPasteBurst = next.type === 'paste' && (next as PasteEvent).content_length > 100;
      const isKeystrokeBurst = next.type === 'keystroke' && (next as KeystrokeEvent).chars > 100;

      if (isPasteBurst || isKeystrokeBurst) {
        const burstSize = isPasteBurst
          ? (next as PasteEvent).content_length
          : (next as KeystrokeEvent).chars;
        const pauseTime = formatTime(pause.timestamp);
        flags.push({
          id: makeId('pause_then_burst'),
          eventIndex: i,
          timestamp: pause.timestamp,
          severity: 'high',
          category: 'pause_then_burst',
          title: 'Pause Followed by Burst',
          shortSummary: `${Math.round(pause.duration_seconds)}s silence at ${pauseTime} then ${burstSize}-char burst`,
          reason: `A ${Math.round(pause.duration_seconds)}-second silence at ${pauseTime} was immediately followed by a ${burstSize}-character ${isPasteBurst ? 'paste' : 'keystroke burst'}. This pattern is consistent with consulting an external source during the pause and entering its content immediately after.`,
        });
        break;
      }
    }
  });
  return flags;
}

function detectConstructionJump(events: SessionEvent[], _duration: number): Flag[] {
  const flags: Flag[] = [];

  // Build code length timeline
  let currentLength = 0;
  const timeline: { t: number; length: number; hasPaste: boolean }[] = [];

  for (const ev of events) {
    if (ev.type === 'keystroke') currentLength += (ev as KeystrokeEvent).chars;
    else if (ev.type === 'paste') currentLength += (ev as PasteEvent).content_length;
    else if (ev.type === 'delete') currentLength = Math.max(0, currentLength - (ev as { chars_deleted: number }).chars_deleted);
    timeline.push({ t: ev.timestamp, length: currentLength, hasPaste: ev.type === 'paste' });
  }

  if (timeline.length === 0) return flags;

  const finalLength = timeline[timeline.length - 1].length;
  if (finalLength === 0) return flags;

  // Check each 5-second window
  const checkedWindows = new Set<number>();

  for (let i = 0; i < timeline.length; i++) {
    const windowStart = timeline[i].t;
    const windowKey = Math.floor(windowStart / 5);
    if (checkedWindows.has(windowKey)) continue;
    checkedWindows.add(windowKey);

    const windowEnd = windowStart + 5;
    const startLength = i > 0 ? timeline[i - 1].length : 0;

    let endLength = startLength;
    let hasPaste = false;
    for (let j = i; j < timeline.length; j++) {
      if (timeline[j].t > windowEnd) break;
      endLength = timeline[j].length;
      if (timeline[j].hasPaste) hasPaste = true;
    }

    const growth = endLength - startLength;
    const growthPct = finalLength > 0 ? growth / finalLength : 0;

    // Growth > 40% of final length in 5s window, without a paste explaining it
    if (growthPct > 0.4 && !hasPaste) {
      const time = formatTime(windowStart);
      flags.push({
        id: makeId('construction_jump'),
        eventIndex: i,
        timestamp: windowStart,
        severity: 'medium',
        category: 'construction_jump',
        title: 'Sudden Code Construction',
        shortSummary: `Code grew ${Math.round(growthPct * 100)}% in 5s at ${time}, no paste`,
        reason: `Code length grew by ${Math.round(growthPct * 100)}% of the final solution in a 5-second window at ${time}, without a paste event to explain it. This kind of sudden construction without visible editing activity is an unusual behavioral pattern.`,
      });
    }
  }

  return flags;
}

function detectUniformSessionTyping(events: SessionEvent[]): Flag[] {
  const keystrokes = events.filter(e => e.type === 'keystroke') as KeystrokeEvent[];
  if (keystrokes.length < 15) return [];

  const speeds = keystrokes.map(k => k.avg_ms_between_keys);
  const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const variance = speeds.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / speeds.length;
  const stdDev = Math.sqrt(variance);

  // Human typing has high inter-event variance. StdDev < 10ms across 15+ events
  // indicates mechanically generated keystrokes — far below natural human range.
  if (stdDev >= 10) return [];

  return [{
    id: makeId('uniform_session_typing'),
    eventIndex: -1,
    timestamp: 0,
    severity: 'high',
    category: 'uniform_session_typing',
    title: 'Mechanically Uniform Typing',
    shortSummary: `Typing speed stdDev ${stdDev.toFixed(1)}ms across ${keystrokes.length} bursts — far below human range`,
    reason: `The standard deviation of inter-key timing across all ${keystrokes.length} keystroke bursts is ${stdDev.toFixed(1)}ms (average ${Math.round(avg)}ms/key). Human typing varies naturally due to word complexity, cognition, and motor memory — a session-wide stdDev below 10ms is statistically inconsistent with unassisted human typing and is associated with programmatically generated keystrokes.`,
  }];
}

function detectLinearOnlyWriting(events: SessionEvent[]): Flag[] {
  const totalEvents = events.length;
  if (totalEvents <= 50) return [];

  const jumpCount = events.filter(e => e.type === 'cursor_jump').length;
  if (jumpCount >= 2) return [];

  return [{
    id: makeId('linear_only_writing'),
    eventIndex: -1,
    timestamp: 0,
    severity: 'low',
    category: 'linear_only_writing',
    title: 'Linear-Only Writing Pattern',
    shortSummary: `${totalEvents} events, only ${jumpCount} cursor jump(s) — no back-navigation`,
    reason: `This session has ${totalEvents} events but only ${jumpCount} cursor repositioning event(s). Human problem-solvers typically navigate backwards to revise, debug, or cross-reference earlier code. Writing top-to-bottom with no back-navigation is consistent with transcribing already-composed code.`,
  }];
}

export function detectAllFlags(session: Session): Flag[] {
  flagCounter = 0; // reset per session to avoid unbounded growth
  const { events, session_duration_seconds } = session;

  return [
    ...detectMegaPaste(events),
    ...detectRobotBurst(events),
    ...detectDeadSilence(events),
    ...detectPasteWithoutEdit(events),
    ...detectPauseThenBurst(events),
    ...detectConstructionJump(events, session_duration_seconds),
    ...detectLinearOnlyWriting(events),
    ...detectUniformSessionTyping(events),
  ];
}
