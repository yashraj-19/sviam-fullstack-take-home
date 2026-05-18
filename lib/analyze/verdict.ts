import type { Session, SessionAnalysis, IntegrityLevel } from '@/lib/types';

function minuteStr(seconds: number): string {
  const m = Math.round(seconds / 60);
  return m === 1 ? '1-minute' : `${m}-minute`;
}

export function generateVerdict(session: Session, analysis: SessionAnalysis): string {
  const { integrityLevel, flags, behaviorSummary, composition } = analysis;
  const duration = session.session_duration_seconds;
  const durationStr = minuteStr(duration);

  const highFlags = flags.filter(f => f.severity === 'high');
  const pasteFlags = flags.filter(f => f.category === 'mega_paste' || f.category === 'paste_without_edit');
  const pauseThenBurstFlags = flags.filter(f => f.category === 'pause_then_burst');

  const levelMap: Record<IntegrityLevel, () => string> = {
    highly_suspicious: () => {
      const leadFlag = highFlags[0] ?? flags[0];
      const pasteDetail = pasteFlags[0]
        ? ` A ${pasteFlags[0].shortSummary} was noted.`
        : '';
      const burstDetail = pauseThenBurstFlags[0]
        ? ` ${pauseThenBurstFlags[0].shortSummary}.`
        : '';
      return `This ${durationStr} session shows multiple strong integrity concerns. ${leadFlag ? leadFlag.reason : ''}${pasteDetail}${burstDetail} Recommend a follow-up clarification interview to verify authorship.`;
    },
    suspicious: () => {
      const topFlag = flags[0];
      const constructionLabel = { incremental: 'incremental', mixed: 'mixed', sudden: 'sudden appearance' }[behaviorSummary.constructionStyle];
      return `This ${durationStr} session contains ${flags.length} behavioral flag(s) warranting review. ${topFlag ? topFlag.reason : ''} The combination of ${composition.pastedPct}% pasted content and ${constructionLabel} construction style raises integrity concerns. A brief follow-up may be warranted.`;
    },
    organic_with_assistance: () => {
      const constructionLabel = { incremental: 'incremental', mixed: 'mixed', sudden: 'sudden' }[behaviorSummary.constructionStyle];
      const noteStr = pasteFlags.length > 0
        ? ` Some paste activity was detected (${composition.pastedPct}% of characters), which may reflect legitimate use of references or boilerplate.`
        : '';
      return `This ${durationStr} session shows generally natural coding behavior with some notable patterns.${noteStr} Typing rhythm is ${behaviorSummary.typingPattern} and construction style is ${constructionLabel}. No strong integrity concerns, though ${flags.length} pattern(s) were flagged for review.`;
    },
    organic: () => {
      const constructionLabel = behaviorSummary.constructionStyle === 'incremental'
        ? 'incrementally'
        : behaviorSummary.constructionStyle === 'mixed'
          ? 'with mixed pacing'
          : 'in concentrated bursts';
      const pauseStr = behaviorSummary.longPauseCount > 0
        ? ` ${behaviorSummary.longPauseCount} thoughtful pause(s) precede structural changes, consistent with active problem-solving.`
        : '';
      return `This ${durationStr} session shows natural problem-solving behavior. Typing rhythm is ${behaviorSummary.typingPattern} and code was built ${constructionLabel}.${pauseStr} Paste activity is ${behaviorSummary.pasteUsage} (${composition.pastedPct}% of characters). No significant integrity concerns detected.`;
    },
  };

  return levelMap[integrityLevel]();
}
