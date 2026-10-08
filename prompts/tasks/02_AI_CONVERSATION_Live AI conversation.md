# Task 02_AI_CONVERSATION: Live Ai Conversation

**Suggested model tier:** strong. **Prerequisite:** preceding milestones in docs/PROGRESS.md.

## Required reading
Read `AGENTS.md`, `docs/MASTER_SPEC.md`, `docs/PROGRESS.md`, the relevant docs for this task. Avoid loading unrelated documents.

## Scope
Implement Next.js /api/conversation with server-side API key and configurable model. Zod request/response. Real API call (use appropriate SDK or HTTPS fetch), bounded history, clear accessible errors. Pass only the candidate's explicit simple/standard question-style choice needed by Gemini; don't infer preferences or send unrelated profile/display data. Gemini asks exactly one clear question at a time and respects that choice. A candidate can skip or ask for clarification. For a clear clarification request, briefly explain and restate the pending question; do not treat the clarification request as experience evidence or advance the interview. Text interaction remains complete and always available. Voice is outside this task unless separately approved after text works; Gemini Live remains optional Task 13. Optionally return profile suggestions only if robust, evidence-backed, and unconfirmed. Never trust incoming job description; no job needed yet. Integrate submit, pending/error/retry while preserving typed content and focus access. Gate: with key a genuine contextual follow-up respects wording preference; skip and clarification work without false profile extraction; without key safe, informative accessible failure; no client-visible key. Test malformed requests and both question styles.

## Strict procedure
1. Inspect existing code and run existing checks before modifications.
2. Implement only this slice; reuse contracts and keep source-of-truth consistent.
3. Test acceptance gate; repair regressions. Do not fabricate successful results.
4. Update `docs/PROGRESS.md` with changed files, actual checks, outcome and next task.
5. Commit one focused change if repository is a Git repo. Do not push without authorisation.

## Completion response
Summarise behavior, files, actual test outcomes, risks and next prompt path.

**Important bonus clarification:** “Live AI conversation” in this task means genuine dynamic async replies, *not* ZEIL's Live +15 category. That requires task 13 real-time Gemini Live streaming speech or reactive camera/screen implementation. Build task 02 with real Gemini model and safe credentials.
