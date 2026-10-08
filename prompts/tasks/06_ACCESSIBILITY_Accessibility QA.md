# Task 06_ACCESSIBILITY: Accessibility Qa

**Suggested model tier:** strong review. **Prerequisite:** preceding milestones in docs/PROGRESS.md.

## Required reading
Read `AGENTS.md`, `docs/MASTER_SPEC.md`, `docs/PROGRESS.md`, the relevant docs for this task. Avoid loading unrelated documents.

## Scope
Use docs/ACCESSIBILITY.md as checklist. Audit and fix semantic structure, focus order/visibility, keyboard-only full user journey, live regions, form errors, zoom 200%, 320px width, motion preference, reading-size and high-contrast toggles. Aim WCAG 2.2 AA; don't claim certification. Gate: record actual keyboard and viewport verification, known gaps. Do not strip functionality.

## Strict procedure
1. Inspect existing code and run existing checks before modifications.
2. Implement only this slice; reuse contracts and keep source-of-truth consistent.
3. Test acceptance gate; repair regressions. Do not fabricate successful results.
4. Update `docs/PROGRESS.md` with changed files, actual checks, outcome and next task.
5. Commit one focused change if repository is a Git repo. Do not push without authorisation.

## Completion response
Summarise behavior, files, actual test outcomes, risks and next prompt path.
