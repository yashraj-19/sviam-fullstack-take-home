import type { Flag, IntegrityLevel } from '@/lib/types';

export function computeIntegrityScore(flags: Flag[], pastedChars: number): number {
  let score = 100;

  for (const flag of flags) {
    if (flag.severity === 'high') score -= 15;
    else if (flag.severity === 'medium') score -= 8;
    else score -= 3;
  }

  score -= Math.min(pastedChars / 40, 35);

  const hasPasteWithoutEdit = flags.some(f => f.category === 'paste_without_edit');
  if (hasPasteWithoutEdit) score -= 12;

  const hasPauseThenBurst = flags.some(f => f.category === 'pause_then_burst');
  if (hasPauseThenBurst) score -= 8;

  // Extra penalty for mechanically uniform session-wide typing — the flag fires but
  // the per-flag deduction alone undersells how anomalous sub-10ms stdDev is.
  const hasUniformTyping = flags.some(f => f.category === 'uniform_session_typing');
  if (hasUniformTyping) score -= 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreToLevel(score: number): IntegrityLevel {
  if (score >= 75) return 'organic';
  if (score >= 50) return 'organic_with_assistance';
  if (score >= 25) return 'suspicious';
  return 'highly_suspicious';
}
