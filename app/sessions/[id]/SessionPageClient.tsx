'use client';

import { useState, useCallback, useRef } from 'react';
import { SessionHeader } from '@/components/shared/SessionHeader';
import { CompositionBar } from '@/components/replay/CompositionBar';
import { ReplayPlayer } from '@/components/replay/ReplayPlayer';
import { EventTimeline } from '@/components/timeline/EventTimeline';
import { IntegrityVerdict } from '@/components/analysis/IntegrityVerdict';
import { BehaviorSummary } from '@/components/analysis/BehaviorSummary';
import { ReviewerContextNotes } from '@/components/analysis/ReviewerContextNotes';
import { RhythmStrip } from '@/components/analysis/RhythmStrip';
import { CodeGrowthCurve } from '@/components/analysis/CodeGrowthCurve';
import { EditHeatmap } from '@/components/analysis/EditHeatmap';
import { FlagsList } from '@/components/analysis/FlagsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity } from 'lucide-react';
import type { Session, SessionAnalysis, IntegrityLabel } from '@/lib/types';

interface Props {
  session: Session;
  analysis: SessionAnalysis;
  label: IntegrityLabel | null;
}

export function SessionPageClient({ session, analysis, label }: Props) {
  const [currentTime, setCurrentTime] = useState(0);
  const [contextNote, setContextNote] = useState<string | null>(null);
  // seekRef lets EventTimeline and FlagsList trigger seeks inside ReplayPlayer
  const seekRef = useRef<((t: number) => void) | null>(null);

  const handleSeek = useCallback((t: number) => {
    seekRef.current?.(t);
  }, []);

  const verdict = contextNote
    ? `${analysis.verdict}\n\n${contextNote}`
    : analysis.verdict;

  if (session.events.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SessionHeader
          sessionId={session.session_id}
          problemId={session.problem_id}
          language={session.language}
          durationSeconds={session.session_duration_seconds}
          integrityLevel={analysis.integrityLevel}
          label={label}
        />
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground gap-3">
          <Activity className="h-10 w-10 opacity-30" />
          <p className="text-lg font-medium">No activity recorded</p>
          <p className="text-sm">This session has no events to replay.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SessionHeader
        sessionId={session.session_id}
        problemId={session.problem_id}
        language={session.language}
        durationSeconds={session.session_duration_seconds}
        integrityLevel={analysis.integrityLevel}
        label={label}
      />
      <CompositionBar {...analysis.composition} />

      {/* Main layout: editor left, analysis panel right */}
      <div className="flex flex-1 min-h-0" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex-1 min-w-0 min-h-0">
          <ReplayPlayer
            session={session}
            flags={analysis.flags}
            onTimeUpdate={setCurrentTime}
            seekRef={seekRef}
          />
        </div>

        <aside className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-border shrink-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <IntegrityVerdict
                score={analysis.integrityScore}
                level={analysis.integrityLevel}
                verdict={verdict}
              />
              <BehaviorSummary behaviorSummary={analysis.behaviorSummary} />
              <ReviewerContextNotes
                rhythmProfile={analysis.rhythmProfile}
                onContextApplied={setContextNote}
              />
            </div>
          </ScrollArea>
        </aside>
      </div>

      {/* Bottom: timeline + tabbed analysis */}
      <div className="shrink-0 border-t border-border">
        <EventTimeline
          events={session.events}
          flags={analysis.flags}
          duration={session.session_duration_seconds}
          currentTime={currentTime}
          onSeek={handleSeek}
        />

        <div className="px-4 py-3 bg-card/40">
          <div className="max-w-[1600px] mx-auto">
            <Tabs defaultValue="growth">
              <TabsList className="h-8">
                <TabsTrigger value="growth" className="text-xs">Code Growth</TabsTrigger>
                <TabsTrigger value="heatmap" className="text-xs">Edit Heatmap</TabsTrigger>
                <TabsTrigger value="rhythm" className="text-xs">Rhythm</TabsTrigger>
                <TabsTrigger value="flags" className="text-xs">
                  Flags{analysis.flags.length > 0 ? ` (${analysis.flags.length})` : ''}
                </TabsTrigger>
                <TabsTrigger value="analysis" className="text-xs lg:hidden">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="growth" className="mt-3">
                <CodeGrowthCurve data={analysis.codeGrowth} />
              </TabsContent>
              <TabsContent value="heatmap" className="mt-3">
                <EditHeatmap heatmap={analysis.editHeatmap} code={session.code} />
              </TabsContent>
              <TabsContent value="rhythm" className="mt-3">
                <RhythmStrip data={analysis.rhythmProfile} typingPattern={analysis.behaviorSummary.typingPattern} />
              </TabsContent>
              <TabsContent value="flags" className="mt-3">
                <FlagsList flags={analysis.flags} onJumpToFlag={handleSeek} />
              </TabsContent>
              <TabsContent value="analysis" className="mt-3 lg:hidden space-y-4">
                <IntegrityVerdict score={analysis.integrityScore} level={analysis.integrityLevel} verdict={verdict} />
                <BehaviorSummary behaviorSummary={analysis.behaviorSummary} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
