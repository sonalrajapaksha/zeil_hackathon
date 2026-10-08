# Task 04_APPLICATION_GENERATOR: Grounded Cv And Letter

**Suggested model tier:** strong. **Prerequisite:** preceding milestones in docs/PROGRESS.md.

## Required reading
Read `AGENTS.md`, `docs/MASTER_SPEC.md`, `docs/PROGRESS.md`, the relevant docs for this task. Avoid loading unrelated documents.

## Scope
Build job picker from fictional DEMO_JOBS. Implement /api/application validating request and looking up server-side job by id. Use only confirmed, job-relevant candidate evidence; generate an editable CV and tailored letter with `unverifiedClaims` when grounding is uncertain. Never invent credentials. Never automatically include sensitive personal, disability, or medical information, even if it appeared in the interview or profile; do not ask for it. Preserve candidate review/edit control and accessible error recovery. Gate: job switching changes the application; unconfirmed and sensitive claims are excluded; errors preserve user content and are announced accessibly. Avoid fake match scores.

## Strict procedure
1. Inspect existing code and run existing checks before modifications.
2. Implement only this slice; reuse contracts and keep source-of-truth consistent.
3. Test acceptance gate; repair regressions. Do not fabricate successful results.
4. Update `docs/PROGRESS.md` with changed files, actual checks, outcome and next task.
5. Commit one focused change if repository is a Git repo. Do not push without authorisation.

## Completion response
Summarise behavior, files, actual test outcomes, risks and next prompt path.
