import type { Session, KeystrokeEvent, PasteEvent, DeleteEvent } from '@/lib/types';

const SAMPLE_COUNT = 60;

export function computeCodeGrowth(session: Session): { t: number; length: number }[] {
  const duration = session.session_duration_seconds;
  if (duration <= 0) return [];

  // Build an event-by-event running length timeline
  let currentLength = 0;
  const eventLengths: { t: number; length: number }[] = [{ t: 0, length: 0 }];

  for (const ev of session.events) {
    if (ev.type === 'keystroke') currentLength += (ev as KeystrokeEvent).chars;
    else if (ev.type === 'paste') currentLength += (ev as PasteEvent).content_length;
    else if (ev.type === 'delete') currentLength = Math.max(0, currentLength - (ev as DeleteEvent).chars_deleted);
    eventLengths.push({ t: ev.timestamp, length: currentLength });
  }

  // Sample at 60 evenly-spaced timestamps
  const step = duration / SAMPLE_COUNT;
  const result: { t: number; length: number }[] = [];

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const sampleT = (i + 1) * step;
    // Find the last event before or at sampleT
    let length = 0;
    for (const el of eventLengths) {
      if (el.t <= sampleT) length = el.length;
      else break;
    }
    result.push({ t: Math.round(sampleT), length });
  }

  return result;
}
