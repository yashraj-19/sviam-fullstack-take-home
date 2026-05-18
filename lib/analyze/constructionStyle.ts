import type { Session } from '@/lib/types';
import { computeCodeGrowth } from './codeGrowth';

export function computeConstructionStyle(session: Session): 'incremental' | 'mixed' | 'sudden' {
  const growth = computeCodeGrowth(session);
  if (growth.length < 2) return 'incremental';

  const finalLength = growth[growth.length - 1].length;
  if (finalLength === 0) return 'incremental';

  // Check each consecutive 5-second window (approx — samples are at 1/60 intervals)
  // Find the window with max single-step growth
  let maxWindowGrowthPct = 0;
  let maxStepGrowthPct = 0;

  for (let i = 1; i < growth.length; i++) {
    const step = growth[i].length - growth[i - 1].length;
    const stepPct = step / finalLength;
    if (stepPct > maxStepGrowthPct) maxStepGrowthPct = stepPct;
  }

  // Group into ~5s windows (each sample covers duration/60 seconds)
  const sampleDuration = session.session_duration_seconds / 60;
  const samplesPerWindow = Math.max(1, Math.round(5 / sampleDuration));

  for (let i = 0; i < growth.length; i += samplesPerWindow) {
    const windowStart = growth[i].length;
    const windowEnd = growth[Math.min(i + samplesPerWindow, growth.length - 1)].length;
    const windowGrowthPct = (windowEnd - windowStart) / finalLength;
    if (windowGrowthPct > maxWindowGrowthPct) maxWindowGrowthPct = windowGrowthPct;
  }

  if (maxWindowGrowthPct > 0.4) return 'sudden';
  if (maxWindowGrowthPct > 0.2) return 'mixed';
  return 'incremental';
}
