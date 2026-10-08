# Task 06_ACCESSIBILITY: Accessibility Qa

**Suggested model tier:** strong review. **Prerequisite:** preceding milestones in docs/PROGRESS.md.

## Required reading
Read `AGENTS.md`, `docs/MASTER_SPEC.md`, `docs/PROGRESS.md`, the relevant docs for this task. Avoid loading unrelated documents.

## Scope
Use docs/ACCESSIBILITY.md as checklist. Access serves everyone with an accessibility-first design. Audit and fix semantic structure, focus order/visibility, keyboard-only full journey, screen-reader announcements, accessible form/API errors, zoom 200%, 320px and 1280px widths, reduced motion, large text, and functional high contrast. Verify the simple/standard question-style choice and its effect on Gemini output. Verify skip and clarification behavior, including that a clarification request is not extracted as profile evidence. Confirm text completes the full flow regardless of optional voice state. Aim toward WCAG 2.2 AA; report test evidence and gaps without claiming certification. Gate: record actual keyboard, screen-reader, settings, error, and viewport verification. Do not strip functionality.

## Strict procedure
1. Inspect existing code and run existing checks before modifications.
2. Implement only this slice; reuse contracts and keep source-of-truth consistent.
3. Test acceptance gate; repair regressions. Do not fabricate successful results.
4. Update `docs/PROGRESS.md` with changed files, actual checks, outcome and next task.
5. Commit one focused change if repository is a Git repo. Do not push without authorisation.

## Completion response
Summarise behavior, files, actual test outcomes, risks and next prompt path.
