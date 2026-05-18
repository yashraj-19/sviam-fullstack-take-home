# SVIAM Session Review — Submission

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Screen Recording

https://www.loom.com/share/b0449aec3a9948bd9c9543a8d754dd6c

---

## What I Built

A behavioral integrity review tool for AI-interviewed coding sessions. Reviewers can triage all 18 sessions, replay them like a video, and investigate suspicious patterns — without ever claiming "AI detection," which is impossible to do reliably.

---

## What I Added Beyond the Spec

### 1. `uniform_session_typing` — 8th Flag Detector

The spec's data included session_10 (labeled `ai_generated`) which typed at 95–110ms/key — above the 70ms threshold for `robot_burst`, so it would have scored 97/Organic and shown no badge disagreement. I noticed the signal isn't speed, it's cross-session uniformity. I computed the standard deviation of `avg_ms_between_keys` across all keystroke bursts. Human typing varies by hundreds of milliseconds across a session (word difficulty, cognition, motor memory). session_10's stdDev was 3.7ms across 23 bursts — physically implausible for unassisted typing. Added this as a `high` severity flag with a categorical −20 score penalty, moving session_10 from 97/Organic → 62/Organic w/ Assistance and triggering the ⚠ ground-truth badge.

### 2. Discrepancy-Only Ground-Truth Badge

Rather than always showing the ground-truth label badge, it only appears when the label direction (organic vs. non-organic) disagrees with the computed integrity level. session_01, session_06, session_15 are labeled `organic` and score organic — no badge. session_03 (labeled `pasted`, scores 85/Organic) and session_10 (labeled `ai_generated`, scores 62/Organic w/ Assistance) show a ⚠ badge. This makes heuristic misses visible without cluttering every card.

### 3. Code Snapshot Cache for O(1) Scrubbing

`buildSnapshots` pre-computes the full code state at every 5-second interval of session time on mount. Seeking to any point starts from the nearest snapshot rather than replaying all events from the beginning — O(events/5s) instead of O(n). On a 25-minute session this is the difference between instant and 2–3 second seeks.

### 4. Reviewer Context Panel

A collapsible panel on each session page that accepts the candidate's self-reported WPM and years of experience. When claimed WPM is less than half of the observed peak velocity, it generates a warning note recommending a live typing demonstration. The panel explains itself as the "pre-interview intake" version of this feature — capturing self-report before the session creates a useful psychological deterrent even without the backend.

### 5. Behavioral Verdict Auto-Generation

Each session generates a plain-English paragraph citing real numbers from the session: duration, paste percentage, typing pattern, construction style, long pause count, and the reason text from the leading flag. The text differs meaningfully across the 4 integrity levels — not a template with slots, but branched logic that produces different sentences depending on which signals are present.

### 6. Edit Density Heatmap

Each line of the final code is shown with a red heat bar whose opacity scales with the number of edit events on that line. Cold lines (no bar) were pasted; warm lines were built organically. This makes the paste-without-edit pattern visually obvious at a glance without needing to read flag text.

### 7. Code Growth Curve with Spike Detection

The growth chart auto-detects abrupt jumps (delta > 30% of final length in one sample) and draws red reference lines at those timestamps. The subtitle reads "N abrupt growth spike(s) detected" vs "Steady incremental growth" — reviewer doesn't need to read the chart to know what it shows.

### 8. All Filter State in URL

All dashboard filters (search, level, language, sort) live in `URLSearchParams`. Filters survive reload, can be bookmarked, and can be shared with another reviewer by copying the URL.

---

## Core Features Delivered

### Session Replay Player

- `requestAnimationFrame` loop scaled by speed multiplier (1×/2×/4×/8×)
- Snapshot-cached code reconstruction — scrubbing is instant on any session length
- Monaco editor imperatively controlled (`editor.setValue`) — no React re-renders during playback
- Paste events: green "PASTED N chars" badge (Framer Motion, 1.5s TTL)
- Pause events: dim overlay with animated dots (TTL capped at 3s real-time so it doesn't hang at 8×)
- Cursor jumps: purple "Line X → Line Y" toast (1.2s TTL)
- Keyboard shortcuts: Space (play/pause), ←/→ (±5s), J/L (±10s), 1/2/4/8 (speed), F (next flag), S (skip silence)
- Skip silence: fast-forwards past pauses >10s in session time
- Jump to next flag: seeks to next flagged timestamp; disabled with tooltip when none remain

### Event Timeline

- SVG with 5 tracks: keystroke (grey), paste (blue), delete (orange), pause (grey bars), cursor_jump (purple)
- Pause events render as proportional-width bars
- Flagged events: larger dot, severity-colored outer ring, `!` glyph
- Clicking any event seeks the replay
- Clicking a flagged event opens a `FlagDetailPopover` with title, reason, expandable "Why does this heuristic matter?" section, and a jump-to button

### Dashboard

- 18 session cards sorted by integrity score ascending (riskiest first)
- Each card: score ring (green/yellow/orange/red), integrity level badge, event count, flag count, sparkline, ⚠ ground-truth badge on discrepancies only
- Filters: text search by problem ID, integrity level filter, language filter, sort by score/duration/flags/problem
- Stats bar: total sessions, flag counts by severity, distribution across levels
- Loading skeletons while API fetch is in flight
- URL-persistent filter state

### Eight Flag Detectors

1. **mega_paste** — paste >100 chars
2. **robot_burst** — avg <70ms/key over >15 chars
3. **dead_silence** — pause >30s
4. **paste_without_edit** — paste >150 chars, <20 keystrokes in 60s after
5. **pause_then_burst** — pause >20s immediately followed by paste or keystroke burst >100 chars
6. **construction_jump** — code grows >40% of final length in 5s, no paste
7. **linear_only_writing** — >50 events, <2 cursor jumps
8. **uniform_session_typing** — stdDev of inter-key timing <10ms across ≥15 keystroke bursts

### Integrity Score

Starts at 100. Deducts by flag severity (high −15, medium −8, low −3), paste-ratio penalty (up to −35), and categorical penalties for paste_without_edit (−12), pause_then_burst (−8), uniform_session_typing (−20). Maps to: Organic (75–100), Organic w/ Assistance (50–74), Suspicious (25–49), Highly Suspicious (0–24).

---

## Technical Decisions

**Next.js 16 App Router** — API routes cache analysis in-memory so each session is computed once per server lifetime. No database, no client waterfalls.

**Monaco** — imperatively controlled via `editor.setValue` rather than React props. `alwaysConsumeMouseWheel: false` so the editor doesn't swallow page scroll events when content fits in the viewport.

**shadcn v4 / Base UI** — shadcn's 2025 release ships Base UI primitives (not Radix). No `asChild` prop; `TooltipTrigger` renders as `<button>` by default, which required `render={<span />}` to avoid `<button><button>` nesting. Slider `onValueChange` is `number | readonly number[]`; Select `onValueChange` is `string | null` — TypeScript strict mode caught both at compile time.

**Recharts** — all charts wrapped in a `ClientOnly` component to prevent SSR dimension warnings.

**Framer Motion** — `AnimatePresence` drives paste flash, pause overlay, cursor jump indicator. All TTLs are real-time capped so overlays don't linger at high speeds.

---

## Assumptions

1. `content_preview` is ~50 chars; `content_length` is authoritative for flagging. Replay displays `content_preview` padded with `// ...` when actual length exceeds preview length.
2. "Behavioral integrity" framing, not "AI detection" — binary detection has unacceptably high false positive rates and isn't the right product framing.
3. Dashboard default sort: integrity score ascending (riskiest first) — matches the reviewer's actual workflow.
4. Ground-truth labels are display-only; the product doesn't train on them or adjust scores based on them.
5. Pause overlays are visualized rather than causing literal dead-air — the overlay makes pauses explicit without blocking the reviewer.
6. session_03 heuristic miss is intentional and shown: labeled `pasted`, scores 85/Organic because 48 chars were typed after the paste (threshold is 20). The ⚠ badge surfaces this disagreement for the reviewer.

---

## Edge Cases

- **session_03** (6 events, 86% pasted): replay completes cleanly; paste animation fires at 12s
- **session_11** (8 long pauses, score 1): timeline shows proportional pause bars; skip-silence skips all 8; rhythm strip trims zero-velocity leading/trailing buckets
- **Empty events array**: renders "No activity recorded" with back link, no crash
- **Sessions with no flags**: green score ring; next-flag button disabled with tooltip; verdict is positive
- **Sparse keystroke data** (session_03): `uniform_session_typing` requires ≥15 keystroke events — doesn't fire on sessions too short to be meaningful

---

## What I Would Add Next

- **Reviewer notes per session** — bookmarkable flags, exportable PDF report
- **Side-by-side session compare** — two candidates, same problem, in parallel
- **Pre-interview WPM intake** — production version of Reviewer Context; self-report before the session starts creates a psychological deterrent
- **Session clustering** — surface behavioral archetypes across many interviews to calibrate thresholds per role

---

## Process Log

Read session_03, session_10, session_11 first to understand actual data shape before building. Key discoveries: session_03 has 6 events (one paste + 48 chars); session_11 has 8 pauses ranging 32–60s with zero cursor jumps; session_10 types at 95–110ms/key (above robot_burst threshold) but with 3.7ms stdDev — the cross-session uniformity signal. Built phase-by-phase: types → analyzers → API → dashboard → replay player → timeline → analysis panel. Main mid-build adjustment: shadcn initialized with Base UI (not Radix), requiring removal of all `asChild` props and adaptation of Slider/Select type signatures. TypeScript strict mode caught all of these at compile time.
