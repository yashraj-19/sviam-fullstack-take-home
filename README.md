# SVIAM | Full Stack Engineer Intern Take Home Assignment

## Context

SVIAM builds an AI interviewer that conducts live technical interviews and scores candidates in real time. After each interview, a hiring manager needs to **review the session**: see how the candidate wrote their code, spot suspicious behavior (large pastes, long unexplained pauses, unnaturally uniform typing), and make a judgment call.

Today that review process does not exist as a product. Your job is to build the first version.

## The Rules

**You may and should use AI tools.** Claude, GPT, Copilot, whatever you prefer. We are not testing whether you can write a for loop from memory. We are testing whether you can:

1. **Build something that works end to end.** Frontend talks to backend, data flows correctly, the user can accomplish their goal.
2. **Make good product decisions.** When the spec is ambiguous, do you build something useful or something that technically satisfies the requirement?
3. **Write clean, maintainable code.** Components are well structured, state is managed sensibly, the codebase is easy to navigate.
4. **Handle the edges.** Empty sessions, 30 minute sessions, sessions with only paste events. Does your app break or degrade gracefully?

## Time Expectation

Aim for **6 to 8 hours**. A polished Part 1 with a working Part 2 is better than a rushed attempt at all three parts. Ship what you are proud of.

## Assumptions

The spec is intentionally underspecified. If you make an assumption, write it down in `SUBMISSION.md`. We value good assumptions as much as good code.

---

## The Dataset

`/data/sessions/` contains **18 coding session files** (`session_01.json` through `session_18.json`). Each represents one candidate solving a coding problem during a live AI interview. The events are chronological and capture everything the candidate did.

`/data/labels.json` contains integrity labels for 5 of the 18 sessions (`organic`, `pasted`, or `ai_generated`). The other 13 are unlabeled.

### Session JSON Schema

```json
{
  "session_id": "session_01",
  "problem_id": "two_sum",
  "language": "python",
  "session_duration_seconds": 1380,
  "code": "def two_sum(nums, target):\n    ...",
  "events": [
    {
      "type": "keystroke",
      "timestamp": 2.1,
      "text": "def ",
      "chars": 4,
      "avg_ms_between_keys": 145
    },
    {
      "type": "delete",
      "timestamp": 18.3,
      "chars_deleted": 5
    },
    {
      "type": "paste",
      "timestamp": 45.0,
      "content_length": 128,
      "content_preview": "import collections..."
    },
    {
      "type": "cursor_jump",
      "timestamp": 50.0,
      "from_line": 1,
      "to_line": 15
    },
    {
      "type": "pause",
      "timestamp": 60.0,
      "duration_seconds": 12.5
    }
  ]
}
```

**Event Types:**

| Type | Fields | Description |
|------|--------|-------------|
| `keystroke` | `text`, `chars`, `avg_ms_between_keys` | A burst of typing. `avg_ms_between_keys` is the mean inter key delay in milliseconds. |
| `delete` | `chars_deleted` | Backspace or deletion event. |
| `paste` | `content_length`, `content_preview` | Clipboard paste. `content_preview` shows the first ~50 characters. |
| `cursor_jump` | `from_line`, `to_line` | Non sequential cursor movement. |
| `pause` | `duration_seconds` | Inactivity gap. Only pauses greater than 5 seconds are recorded. |

All events have a `timestamp` (seconds from session start) and `type`.

---

## The Assignment

### Part 1: Session Replay Player (Core)

Build a web app that lets a reviewer **replay a candidate's coding session like a video**.

When the reviewer selects a session and presses play:

- **Keystrokes** appear in a code editor area, rendered at a pace proportional to the original typing speed (not instant, not real time either; find a pace that feels informative)
- **Paste events** flash or highlight to make them visually distinct from typed code
- **Delete events** remove characters from the editor
- **Pauses** show a visible indicator (a timer, a dimmed overlay, a pulsing dot; your call)
- **Cursor jumps** are visually indicated (the reviewer should know the candidate jumped to a different section)

**Playback controls:**
- Play / Pause
- Speed: 1x, 2x, 4x (at minimum)
- A scrub bar or timeline to jump to any point in the session
- Current timestamp display

The code editor does not need to be a full IDE. A syntax highlighted `<pre>` block or a lightweight editor component (Monaco, CodeMirror) are both fine. What matters is that the replay feels like watching someone code.

### Part 2: Event Timeline with Flags (Analysis Layer)

Below or beside the replay, render an **event timeline** that gives the reviewer a bird's eye view of the session:

- Each event is a mark on the timeline, positioned by its timestamp
- Events are color coded by type (keystrokes, pastes, deletes, pauses, cursor jumps)
- Clicking a mark on the timeline jumps the replay to that moment

**Automatic flags.** Your app should identify and visually highlight suspicious moments. At minimum, flag:

- Paste events where `content_length > 100`
- Keystroke bursts where `avg_ms_between_keys < 70` (unnaturally fast)
- Pauses longer than 30 seconds
- Any other heuristic you think is useful (explain your choices in `SUBMISSION.md`)

Flags should be prominent on the timeline (different color, icon, tooltip) so a reviewer scanning quickly can spot them.

### Part 3: Session List Dashboard (Full Picture)

Build a landing page that lists all 18 sessions with summary information:

- Session ID, problem, language, duration
- Number of events, number of flags
- Integrity label if one exists in `labels.json`, or "Unlabeled" otherwise
- A quick visual indicator of risk (green / yellow / red based on flag count, or your own heuristic)

Clicking a session navigates to the replay view from Parts 1 and 2.

**Sorting and filtering** are appreciated but not required. If you add them, make them useful (sort by flag count, filter by label, filter by problem).

---

## Technical Requirements

- **Frontend:** Any framework you are comfortable with. React, Vue, Svelte, vanilla JS. Your choice.
- **Backend:** Serve the session data through an API. Can be Express, FastAPI, Go, whatever. A simple file server that reads the JSON files is perfectly acceptable. Do not over engineer the backend.
- **No database required.** The JSON files in `/data/` are your data store. If you want to add SQLite or similar, that is fine, but it is not expected.
- **No authentication required.**
- **The app should run locally with a single setup command.** Document it clearly in `SUBMISSION.md`.

## What We Do Not Want

- Do not deploy it. Local is fine.
- Do not add user auth, databases, or CI/CD. Focus on the product.
- Do not write tests unless you want to. We would rather see a polished UI than a test suite for a take home.
- Do not over abstract. If you have 3 components, do not build a component library. Build the thing.

---

## How to Submit

1. **Fork** this repo
2. Build your app in the repo (add your source code, package files, etc.)
3. Fill in `SUBMISSION.md`
4. Push your fork and share the link with us

Include a screen recording (30 to 60 seconds) showing the replay in action. A GIF, a Loom link, or a video file in the repo all work. We review many submissions and a quick recording helps us see your work immediately.

---

## How We Evaluate

In rough priority order:

1. **Does the replay work and feel good?** Can we watch a session play back and understand what happened? Is it smooth, not janky? Does it communicate the right information at the right time?
2. **Product instinct.** Did you build what a reviewer actually needs, or did you build what the spec literally says? The best submissions include small touches we did not ask for that make the tool genuinely useful.
3. **Code quality.** Clean component structure, sensible state management, no spaghetti. We will read your code, not just run it.
4. **Flag quality.** Are the automatic flags useful? Did you think about what signals actually matter, or did you just threshold on raw numbers?
5. **Edge case handling.** What happens with session_03 (3 minute session, one giant paste)? What about session_11 (25 minutes of long pauses)? Does your app handle the extremes?
6. **Visual polish.** We are not expecting a design portfolio, but basic visual hierarchy, readable typography, and intentional use of color go a long way. The difference between "works" and "works and looks intentional" matters.

What we do not care about: framework choice, number of dependencies, clever abstractions, deployment, test coverage.

---

## Setup

```bash
# Clone your fork
git clone <your fork url>
cd sviam-fullstack-take-home

# Your setup instructions go here
# Document them clearly in SUBMISSION.md
```

The `/data/` directory contains everything you need. Build from there.

---

Good luck. Show us how you think about building tools for real people.
