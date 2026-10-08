# Agent instructions — Access
Read `docs/MASTER_SPEC.md` and `docs/PROGRESS.md` before any task. Read only the task-specific files required; do not flood context. Respect `docs/COMPETITION_RULES.md`.

## Priority order
1. Working accessible end-to-end flow
2. Truthfulness, user control, privacy, safe handling of API keys
3. Clear ZEIL-relevant product demonstration
4. Craft and polish
5. Optional features

## Ponytail-minded coding discipline
Understand touched code first. Ask: does this need to exist? can existing code or the platform do it? prefer the smallest proven solution. No Docker, auth, database, agents framework or unnecessary dependencies. NEVER cut input validation, accessibility, privacy or critical tests.

## Impeccable-minded interface discipline
Build a specific editorial visual system from `docs/DESIGN.md`; don't produce generic dashboard cards. Real buttons only. Verify keyboard access, focus, responsive states and reduced motion. If upstream Impeccable is installed, invoke its skill for relevant UI work.

## Execution
- Single owner per file at any point; 1 main integrator plus 1 independent UI agent max.
- Implement the requested task only and its dependencies.
- After each task: `npm run typecheck`, `npm run build` when possible, test critical flow, update `docs/PROGRESS.md` with PASS/FAIL and next task.
- No pretend API outputs. Never fabricate tests passed; explain blockers.
- Commit meaningful working increments. Do NOT auto-push without explicit user approval and a configured remote.
- Keep solutions clean, no unexplained mocks in production paths.

## ZEIL bonus requirements (mandatory reading)
Read `docs/BONUS_CHALLENGES.md` and `docs/BONUS_EVIDENCE.md`. Prefer B01 hiring, B02 public deploy, B03 Gemini-selected tool calls, B04 strict JSON, B05 native multimodal file. Do not infer Live from turn-based interview. Gemini Live is optional task 13 only. All bonus claims require real proof; screenshot states +50 cap, with conflicting Free +100 button. Keep core product working.

