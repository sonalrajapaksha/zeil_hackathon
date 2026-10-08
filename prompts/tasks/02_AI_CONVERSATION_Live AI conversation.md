# Task 02_AI_CONVERSATION: Live Ai Conversation

**Suggested model tier:** strong. **Prerequisite:** preceding milestones in docs/PROGRESS.md.

## Required reading
Read `AGENTS.md`, `docs/MASTER_SPEC.md`, `docs/PROGRESS.md`, the relevant docs for this task. Avoid loading unrelated documents.

## Scope
Implement Next.js /api/conversation with server-side API key and configurable model. Zod request/response. Real API call (use appropriate SDK or HTTPS fetch), bounded history, clear API errors. Make one user message → context-aware assistant reply; optionally suggestions if robust. Never trust incoming job description; no job needed yet. Integrate into frontend with submit, pending/error/retry. Gate: with key a real contextual follow-up; without key safe, informative failure; no client-visible key. Tests for malformed requests.

## Strict procedure
1. Inspect existing code and run existing checks before modifications.
2. Implement only this slice; reuse contracts and keep source-of-truth consistent.
3. Test acceptance gate; repair regressions. Do not fabricate successful results.
4. Update `docs/PROGRESS.md` with changed files, actual checks, outcome and next task.
5. Commit one focused change if repository is a Git repo. Do not push without authorisation.

## Completion response
Summarise behavior, files, actual test outcomes, risks and next prompt path.

**Important bonus clarification:** “Live AI conversation” in this task means genuine dynamic async replies, *not* ZEIL's Live +15 category. That requires task 13 real-time Gemini Live streaming speech or reactive camera/screen implementation. Build task 02 with real Gemini model and safe credentials.

