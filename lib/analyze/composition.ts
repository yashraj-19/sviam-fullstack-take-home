import type { Session, KeystrokeEvent, PasteEvent } from '@/lib/types';

export function computeComposition(session: Session) {
  let typedChars = 0;
  let pastedChars = 0;

  for (const ev of session.events) {
    if (ev.type === 'keystroke') typedChars += (ev as KeystrokeEvent).chars;
    else if (ev.type === 'paste') pastedChars += (ev as PasteEvent).content_length;
  }

  const total = typedChars + pastedChars;
  const typedPct = total > 0 ? Math.round((typedChars / total) * 100) : 100;
  const pastedPct = total > 0 ? 100 - typedPct : 0;

  return { typedChars, pastedChars, typedPct, pastedPct };
}
