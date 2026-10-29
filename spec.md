# AI Mystery Room — Project Specification

## Overview
AI Mystery Room is a browser-based detective game. A player supplies a premise and difficulty; the application builds a case, lets them inspect evidence and request hints, then scores their accusation. The intended users are students and casual puzzle fans. The experience should feel like a midnight detective's case room, with a clear path from case intake to case closed.

## Requirements and limits
- Frontend: React, Vite, React Router, Axios, Tailwind CSS.
- Backend: Node.js, Express, MongoDB, Mongoose, Gemini via `@google/genai`, and Zod validation.
- Core: case generation, three difficulty levels, suspects, locked/discoverable clues, hints, accusation, result and score breakdown.
- Solution and undiscovered clue text stay on the server. Scores are authoritative on the server.
- Optional enhancements: evidence timeline, responsive tabs, reduced-motion-aware transitions, local in-memory fallback for development.
- Limits: generated content depends on Gemini availability and quality; MongoDB persistence requires a configured URI; no user accounts or multiplayer are in scope.
- Deliverables: source, this specification, working local workflow, and deployment configuration/documentation. Deployment requires external credentials and hosting accounts.

## User flow
1. Home introduces the case room; Open a Case leads to intake.
2. Player enters a premise and chooses Easy, Medium, or Hard.
3. Backend asks Gemini for a structured case, validates it, and stores private solution data.
4. Player reads the briefing, discovers clues, reviews evidence, and requests hints.
5. Player selects and confirms a suspect accusation.
6. Backend evaluates the accusation and score, then reveals verdict, culprit, explanation, and score breakdown.
7. Player starts a new case.

## Pages and states
- **Home:** identity, “Every Secret Leaves a Trace.”, introductory copy, how-to-play, atmospheric evidence-board visual, Open a Case.
- **Create Mystery:** labeled premise field, example premise, difficulty selector, configuration counts (Easy 3/5/2; Medium 4/7/3; Hard 5/9/3), validation, disabled/loading state and progress copy.
- **Investigation Room:** desktop briefing/evidence/suspect three-panel layout; tablet two-panel and mobile single-column sections/tabs. Show case story, progress, discovered clue text only, neutral locked-clue placeholders, suspects, hint action, review evidence, and accusation action.
- **Accusation:** selectable suspect profiles, selected state, confirmation step, duplicate-submit prevention, and finality reminder.
- **Results:** backend verdict, culprit, explanation, score and base/clue/hint breakdown; investigation summary and Solve Another Mystery.
- Shared states: loading, empty, recoverable error, success notification, keyboard focus, accessible labels, touch-friendly controls, reduced-motion support. Navigation must preserve case progress.

## API contract
JSON requests and responses; errors use `{ "error": { "message": "..." } }` with an appropriate 4xx/5xx status. Validate IDs, difficulty, premise length, and suspect/clue identifiers. Do not include solution fields or undiscovered clue content in active-case responses.

| Endpoint | Request | Response |
|---|---|---|
| `POST /api/cases` | `{ premise, difficulty }` | `{ case: publicCase }` |
| `GET /api/cases/:id` | — | `{ case: publicCase }` |
| `POST /api/cases/:id/clues/:clueId/discover` | — | `{ clue, progress }` |
| `POST /api/cases/:id/hints` | — | `{ hint, hintsUsed, hintsRemaining }` |
| `POST /api/cases/:id/accuse` | `{ suspectId }` | `{ result }` |
| `GET /api/cases/:id/result` | — | `{ result }` after completion only |

`publicCase` includes title, story, difficulty, suspects (public profiles), clue IDs and discovery state (no locked text), hint availability, and player progress. Result includes verdict, culprit, explanation, score, and score breakdown.

## Data model
Mongoose Case: title, premise, story, difficulty, suspects `{id,name,description}`, clues `{id,title,content}`, hints, culprit ID, solution explanation, discovered clue IDs, hints used, accusation, result, score and timestamps. Solution-bearing fields are only projected in private server operations and result retrieval after accusation.

## AI output and scoring
Gemini returns JSON with `title`, `story`, `suspects`, `clues`, `hints`, `culpritId`, and `solutionExplanation`. Validate schema, exact difficulty counts, unique IDs, valid culprit reference, hint count, nonempty content, and coherent clue-supported explanation before persistence. Retry malformed output once, then return a safe generation error. Never trust model scores.

| Difficulty | Suspects | Clues | Hints | Correct base |
|---|---:|---:|---:|---:|
| Easy | 3 | 5 | 2 | 100 |
| Medium | 4 | 7 | 3 | 150 |
| Hard | 5 | 9 | 3 | 200 |

Final score = `max(0, correct base + 5 × discovered clues − 10 × hints used)`; incorrect accusation receives zero. Calculate only on the backend.

## Acceptance criteria
- Cases generate for all three levels with required counts.
- Players can discover evidence, request available hints, accuse, and read results.
- Neither solution nor undiscovered clue content is returned to the client before accusation.
- Backend validates generated data and calculates scores.
- Results accurately show verdict, culprit, explanation, and score breakdown.
- Loading/error/empty/success states, accessible interactions, responsive layouts, and reduced-motion behavior work.
- The complete flow can run locally and can be deployed when external database/API/hosting credentials are supplied.
