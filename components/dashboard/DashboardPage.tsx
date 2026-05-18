'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { SessionCard } from './SessionCard';
import { FilterBar } from './FilterBar';
import { StatsBar } from './StatsBar';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Activity } from 'lucide-react';
import type { SessionSummary } from '@/lib/types';

function DashboardInner() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then((data: SessionSummary[]) => {
        setSessions(data);
        setLoading(false);
      });
  }, []);

  const q = searchParams.get('q')?.toLowerCase() ?? '';
  const levelFilter = searchParams.get('level') ?? 'all';
  const langFilter = searchParams.get('lang') ?? 'all';
  const sort = searchParams.get('sort') ?? 'score_asc';

  const filtered = sessions
    .filter(s => !q || s.problem_id.toLowerCase().includes(q))
    .filter(s => {
      if (levelFilter === 'all') return true;
      if (levelFilter === 'has_label') return s.label !== null;
      return s.integrityLevel === levelFilter;
    })
    .filter(s => langFilter === 'all' || s.language === langFilter)
    .sort((a, b) => {
      switch (sort) {
        case 'score_asc': return a.integrityScore - b.integrityScore;
        case 'score_desc': return b.integrityScore - a.integrityScore;
        case 'duration': return b.session_duration_seconds - a.session_duration_seconds;
        case 'flags': return b.flagCount - a.flagCount;
        case 'problem': return a.problem_id.localeCompare(b.problem_id);
        default: return a.integrityScore - b.integrityScore;
      }
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-base font-semibold leading-none">SVIAM Session Review</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Behavioral Integrity Analysis</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <StatsBar sessions={sessions} />
            <FilterBar sessions={sessions} />

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Activity className="h-10 w-10 mb-4 opacity-30" />
                <p className="text-sm">No sessions match the current filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(session => (
                  <SessionCard key={session.session_id} session={session} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg px-4 py-3 animate-pulse">
            <div className="h-7 bg-muted rounded w-12 mb-1" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
        ))}
      </div>
      <div className="flex gap-3 mb-6">
        <div className="h-10 bg-muted rounded flex-1 animate-pulse" />
        <div className="h-10 bg-muted rounded w-44 animate-pulse" />
        <div className="h-10 bg-muted rounded w-36 animate-pulse" />
        <div className="h-10 bg-muted rounded w-48 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-52 bg-card border border-border rounded-xl animate-pulse" />
        ))}
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </Suspense>
  );
}
