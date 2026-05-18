import { NextResponse } from 'next/server';
import { getAllSessions, getLabels } from '@/lib/data/loader';
import { analyzeSession } from '@/lib/analyze';
import type { SessionSummary } from '@/lib/types';

// In-memory cache so analyses run once per server lifetime
let cachedSummaries: SessionSummary[] | null = null;

export async function GET() {
  if (cachedSummaries) {
    return NextResponse.json(cachedSummaries);
  }

  const [sessions, labels] = await Promise.all([getAllSessions(), getLabels()]);

  const summaries: SessionSummary[] = sessions.map(session => {
    const analysis = analyzeSession(session);
    return {
      session_id: session.session_id,
      problem_id: session.problem_id,
      language: session.language,
      session_duration_seconds: session.session_duration_seconds,
      eventCount: session.events.length,
      flagCount: analysis.flags.length,
      label: labels[session.session_id] ?? null,
      integrityScore: analysis.integrityScore,
      integrityLevel: analysis.integrityLevel,
    };
  });

  cachedSummaries = summaries;
  return NextResponse.json(summaries);
}
