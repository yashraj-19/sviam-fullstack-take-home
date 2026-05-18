import { NextResponse } from 'next/server';
import { getSession, getLabels } from '@/lib/data/loader';
import { analyzeSession } from '@/lib/analyze';

// Per-session analysis cache keyed by session_id
const cache = new Map<string, { session: unknown; analysis: unknown; label: unknown }>();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (cache.has(id)) {
    return NextResponse.json(cache.get(id));
  }

  const [session, labels] = await Promise.all([getSession(id), getLabels()]);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const analysis = analyzeSession(session);
  const label = labels[id] ?? null;

  const result = { session, analysis, label };
  cache.set(id, result);

  return NextResponse.json(result);
}
