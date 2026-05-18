import type { SessionEvent } from '@/lib/types';

// Returns events whose timestamps fall in the half-open interval [lastTime, currentTime).
// Used by the replay player to trigger animations as time advances.
export function getEventsInWindow(
  events: SessionEvent[],
  lastTime: number,
  currentTime: number
): SessionEvent[] {
  return events.filter(ev => ev.timestamp >= lastTime && ev.timestamp < currentTime);
}
