import type { Session, KeystrokeEvent } from '@/lib/types';

const SAMPLE_COUNT = 60;

export function computeRhythmProfile(session: Session): { t: number; velocity: number }[] {
  const duration = session.session_duration_seconds;
  if (duration <= 0) return [];

  const bucketSize = duration / SAMPLE_COUNT;
  const buckets: number[][] = Array.from({ length: SAMPLE_COUNT }, () => []);

  for (const ev of session.events) {
    if (ev.type !== 'keystroke') continue;
    const ks = ev as KeystrokeEvent;
    const bucketIndex = Math.min(
      Math.floor(ks.timestamp / bucketSize),
      SAMPLE_COUNT - 1
    );
    // chars per second for this keystroke event
    const durationApprox = ks.chars * (ks.avg_ms_between_keys / 1000);
    const cps = durationApprox > 0 ? ks.chars / durationApprox : 0;
    buckets[bucketIndex].push(cps);
  }

  // Compute average velocity per bucket
  const raw = buckets.map(b => b.length > 0 ? b.reduce((a, c) => a + c, 0) / b.length : 0);

  // Normalize to 0-100 range
  const maxVal = Math.max(...raw, 1);
  return raw.map((v, i) => ({
    t: Math.round((i + 0.5) * bucketSize),
    velocity: Math.round((v / maxVal) * 100),
  }));
}
