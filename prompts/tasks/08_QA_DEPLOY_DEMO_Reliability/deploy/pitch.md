# Task 08_QA_DEPLOY_DEMO: Reliability/Deploy/Pitch

**Suggested model tier:** strong integrator. **Prerequisite:** preceding milestones in docs/PROGRESS.md.

## Required reading
Read `AGENTS.md`, `docs/MASTER_SPEC.md`, `docs/PROGRESS.md`, the relevant docs for this task. Avoid loading unrelated documents.

## Scope
Feature freeze. Run typecheck, build, manual end-to-end flow, invalid/no-key handling, keyboard, screen-reader, mobile, and access-preference tests. Deploy only with explicit platform access and permission; otherwise document exact Vercel deployment steps and env vars. Prepare the accessibility-first, universally usable three-minute pitch from docs/DEMO.md, reset procedure, and explicitly labelled fallback. Do not stage unavailable preferences or claim unverified accessibility behavior. Commit final state; don't push without approval. Report tests precisely and remaining risks. Gate: working text-first candidate-controlled journey, verified accessibility evidence, and a demo-safe fallback with honest provenance.

## Strict procedure
1. Inspect existing code and run existing checks before modifications.
2. Implement only this slice; reuse contracts and keep source-of-truth consistent.
3. Test acceptance gate; repair regressions. Do not fabricate successful results.
4. Update `docs/PROGRESS.md` with changed files, actual checks, outcome and next task.
5. Commit one focused change if repository is a Git repo. Do not push without authorisation.

## Completion response
Summarise behavior, files, actual test outcomes, risks and next prompt path.
