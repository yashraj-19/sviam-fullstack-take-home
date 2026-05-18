export type EventType = 'keystroke' | 'delete' | 'paste' | 'cursor_jump' | 'pause';

export interface BaseEvent { type: EventType; timestamp: number; }
export interface KeystrokeEvent extends BaseEvent { type: 'keystroke'; text: string; chars: number; avg_ms_between_keys: number; }
export interface DeleteEvent extends BaseEvent { type: 'delete'; chars_deleted: number; }
export interface PasteEvent extends BaseEvent { type: 'paste'; content_length: number; content_preview: string; }
export interface CursorJumpEvent extends BaseEvent { type: 'cursor_jump'; from_line: number; to_line: number; }
export interface PauseEvent extends BaseEvent { type: 'pause'; duration_seconds: number; }
export type SessionEvent = KeystrokeEvent | DeleteEvent | PasteEvent | CursorJumpEvent | PauseEvent;

export interface Session {
  session_id: string;
  problem_id: string;
  language: string;
  session_duration_seconds: number;
  code: string;
  events: SessionEvent[];
}

export type IntegrityLabel = 'organic' | 'pasted' | 'ai_generated';
export type IntegrityLevel = 'organic' | 'organic_with_assistance' | 'suspicious' | 'highly_suspicious';

export type FlagCategory =
  | 'mega_paste'
  | 'robot_burst'
  | 'dead_silence'
  | 'paste_without_edit'
  | 'pause_then_burst'
  | 'construction_jump'
  | 'linear_only_writing'
  | 'uniform_session_typing';

export interface Flag {
  id: string;
  eventIndex: number;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
  category: FlagCategory;
  title: string;
  shortSummary: string;
  reason: string;
}

export interface SessionAnalysis {
  flags: Flag[];
  integrityScore: number;
  integrityLevel: IntegrityLevel;
  verdict: string;
  behaviorSummary: {
    typingPattern: 'natural' | 'mixed' | 'uniform';
    constructionStyle: 'incremental' | 'mixed' | 'sudden';
    pasteUsage: 'none' | 'light' | 'moderate' | 'heavy';
    correctionFrequency: 'low' | 'moderate' | 'high';
    longPauseCount: number;
  };
  composition: { typedChars: number; pastedChars: number; typedPct: number; pastedPct: number; };
  rhythmProfile: { t: number; velocity: number }[];
  codeGrowth: { t: number; length: number }[];
  editHeatmap: { line: number; edits: number }[];
}

export interface SessionSummary {
  session_id: string;
  problem_id: string;
  language: string;
  session_duration_seconds: number;
  eventCount: number;
  flagCount: number;
  label: IntegrityLabel | null;
  integrityScore: number;
  integrityLevel: IntegrityLevel;
}
