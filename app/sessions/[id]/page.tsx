import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getSession, getLabels } from '@/lib/data/loader';
import { analyzeSession } from '@/lib/analyze';
import type { Metadata } from 'next';
import { SessionPageClient } from './SessionPageClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `${id} — SVIAM` };
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params;
  const [session, labels] = await Promise.all([getSession(id), getLabels()]);

  if (!session) notFound();

  const analysis = analyzeSession(session);
  const label = labels[id] ?? null;

  return (
    <Suspense fallback={<SessionSkeleton />}>
      <SessionPageClient session={session} analysis={analysis} label={label} />
    </Suspense>
  );
}

function SessionSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-14 border-b border-border bg-card animate-pulse" />
      <div className="h-12 border-b border-border bg-card/50 animate-pulse" />
      <div className="flex h-[calc(100vh-104px)]">
        <div className="flex-1 bg-muted/10 animate-pulse" />
        <div className="w-80 border-l border-border bg-card/50 animate-pulse" />
      </div>
    </div>
  );
}
