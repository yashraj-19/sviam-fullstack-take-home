import type { Session, KeystrokeEvent, PasteEvent, DeleteEvent } from '@/lib/types';

export function computeEditHeatmap(session: Session): { line: number; edits: number }[] {
  // Replay events maintaining a line-count model
  let lineCount = 1;
  const editCounts: Map<number, number> = new Map();

  function increment(line: number) {
    editCounts.set(line, (editCounts.get(line) ?? 0) + 1);
  }

  for (const ev of session.events) {
    if (ev.type === 'keystroke') {
      const ks = ev as KeystrokeEvent;
      increment(lineCount);
      // Count newlines to advance the current line
      const newlines = (ks.text.match(/\n/g) ?? []).length;
      lineCount += newlines;
    } else if (ev.type === 'paste') {
      const paste = ev as PasteEvent;
      increment(lineCount);
      // Estimate newlines from content_preview (may be truncated)
      const newlines = (paste.content_preview.match(/\n/g) ?? []).length;
      lineCount += newlines;
    } else if (ev.type === 'delete') {
      increment(lineCount);
    } else if (ev.type === 'cursor_jump') {
      // Update current line based on jump destination
      const jump = ev as { to_line: number };
      lineCount = jump.to_line;
    }
  }

  // Build final array sorted by line
  const finalLineCount = Math.max(lineCount, ...editCounts.keys(), 1);
  const result: { line: number; edits: number }[] = [];
  for (let i = 1; i <= finalLineCount; i++) {
    result.push({ line: i, edits: editCounts.get(i) ?? 0 });
  }

  return result;
}
