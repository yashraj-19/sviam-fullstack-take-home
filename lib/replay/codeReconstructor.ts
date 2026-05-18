import type { SessionEvent, KeystrokeEvent, PasteEvent, DeleteEvent } from '@/lib/types';

// Snapshots every 5 seconds of session time for fast scrubbing.
// Without caching, scrubbing to the end of a long session requires replaying
// every event from the start — O(n) per seek instead of O(n/cache_interval).
const SNAPSHOT_INTERVAL = 5;

interface Snapshot {
  time: number;
  code: string;
  eventIndex: number;
}

function applyEventsFrom(events: SessionEvent[], startCode: string, startIdx: number, targetTime: number): string {
  let code = startCode;
  for (let i = startIdx; i < events.length; i++) {
    const ev = events[i];
    if (ev.timestamp > targetTime) break;

    if (ev.type === 'keystroke') {
      code += (ev as KeystrokeEvent).text;
    } else if (ev.type === 'paste') {
      const paste = ev as PasteEvent;
      const preview = paste.content_preview;
      // Pad with comment marker when preview is shorter than actual paste
      const pad = paste.content_length > preview.length ? '\n// ...' : '';
      code += preview + pad;
    } else if (ev.type === 'delete') {
      const del = ev as DeleteEvent;
      code = code.slice(0, Math.max(0, code.length - del.chars_deleted));
    }
    // cursor_jump and pause are no-ops on code state
  }
  return code;
}

export function buildSnapshots(events: SessionEvent[], duration: number): Snapshot[] {
  const snapshots: Snapshot[] = [{ time: 0, code: '', eventIndex: 0 }];

  let code = '';
  let nextSnapshotTime = SNAPSHOT_INTERVAL;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];

    // Record snapshot before processing events that cross the snapshot boundary
    while (ev.timestamp >= nextSnapshotTime) {
      snapshots.push({ time: nextSnapshotTime, code, eventIndex: i });
      nextSnapshotTime += SNAPSHOT_INTERVAL;
    }

    if (ev.type === 'keystroke') {
      code += (ev as KeystrokeEvent).text;
    } else if (ev.type === 'paste') {
      const paste = ev as PasteEvent;
      const preview = paste.content_preview;
      const pad = paste.content_length > preview.length ? '\n// ...' : '';
      code += preview + pad;
    } else if (ev.type === 'delete') {
      const del = ev as DeleteEvent;
      code = code.slice(0, Math.max(0, code.length - del.chars_deleted));
    }
  }

  return snapshots;
}

export function reconstructAt(
  events: SessionEvent[],
  targetTime: number,
  snapshots: Snapshot[]
): string {
  // Find the nearest snapshot at or before targetTime
  let best = snapshots[0];
  for (const snap of snapshots) {
    if (snap.time <= targetTime) best = snap;
    else break;
  }

  return applyEventsFrom(events, best.code, best.eventIndex, targetTime);
}
