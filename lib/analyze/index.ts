import type { Session, SessionAnalysis, SessionEvent, KeystrokeEvent, PauseEvent } from '@/lib/types';
import { detectAllFlags } from './flagDetectors';
import { computeIntegrityScore, scoreToLevel } from './integrityScore';
import { computeComposition } from './composition';
import { computeRhythmProfile } from './rhythm';
import { computeCodeGrowth } from './codeGrowth';
import { computeEditHeatmap } from './editHeatmap';
import { computeConstructionStyle } from './constructionStyle';
import { generateVerdict } from './verdict';

function computeTypingPattern(events: SessionEvent[]): 'natural' | 'mixed' | 'uniform' {
  const keystrokes = events.filter(e => e.type === 'keystroke') as KeystrokeEvent[];
  if (keystrokes.length === 0) return 'natural';

  const speeds = keystrokes.map(k => k.avg_ms_between_keys);
  const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const variance = speeds.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / speeds.length;
  const stdDev = Math.sqrt(variance);

  // High variance = natural; low variance = uniform; middle = mixed
  if (stdDev < 15) return 'uniform';
  if (stdDev < 35) return 'mixed';
  return 'natural';
}

function computePasteUsage(pastedChars: number, total: number): 'none' | 'light' | 'moderate' | 'heavy' {
  if (total === 0) return 'none';
  const pct = pastedChars / total;
  if (pct === 0) return 'none';
  if (pct < 0.2) return 'light';
  if (pct < 0.5) return 'moderate';
  return 'heavy';
}

function computeCorrectionFrequency(events: SessionEvent[]): 'low' | 'moderate' | 'high' {
  const deleteCount = events.filter(e => e.type === 'delete').length;
  const keystrokeCount = events.filter(e => e.type === 'keystroke').length;
  if (keystrokeCount === 0) return 'low';
  const ratio = deleteCount / keystrokeCount;
  if (ratio < 0.1) return 'low';
  if (ratio < 0.3) return 'moderate';
  return 'high';
}

export function analyzeSession(session: Session): SessionAnalysis {
  const flags = detectAllFlags(session);
  const composition = computeComposition(session);
  const integrityScore = computeIntegrityScore(flags, composition.pastedChars);
  const integrityLevel = scoreToLevel(integrityScore);
  const constructionStyle = computeConstructionStyle(session);

  const longPauses = session.events.filter(
    e => e.type === 'pause' && (e as PauseEvent).duration_seconds > 30
  );

  const behaviorSummary: SessionAnalysis['behaviorSummary'] = {
    typingPattern: computeTypingPattern(session.events),
    constructionStyle,
    pasteUsage: computePasteUsage(composition.pastedChars, composition.typedChars + composition.pastedChars),
    correctionFrequency: computeCorrectionFrequency(session.events),
    longPauseCount: longPauses.length,
  };

  const partialAnalysis = {
    flags,
    integrityScore,
    integrityLevel,
    verdict: '', // placeholder before verdict generation
    behaviorSummary,
    composition,
    rhythmProfile: computeRhythmProfile(session),
    codeGrowth: computeCodeGrowth(session),
    editHeatmap: computeEditHeatmap(session),
  };

  const verdict = generateVerdict(session, partialAnalysis);

  return { ...partialAnalysis, verdict };
}
