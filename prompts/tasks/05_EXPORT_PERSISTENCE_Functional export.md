# Task 05_EXPORT_PERSISTENCE: Functional Export

**Suggested model tier:** fast. **Prerequisite:** preceding milestones in docs/PROGRESS.md.

## Required reading
Read `AGENTS.md`, `docs/MASTER_SPEC.md`, `docs/PROGRESS.md`, the relevant docs for this task. Avoid loading unrelated documents.

## Scope
Implement safe browser localStorage state with versioned key and validation. Explicit Reset & Delete. Functional text downloads for CV and letter, correct filenames, edited preview exported, accessible feedback. No storage of keys. Gate: reload preserves candidate choices; reset clears; download contains edits. No new dependency if browser APIs suffice.

## Strict procedure
1. Inspect existing code and run existing checks before modifications.
2. Implement only this slice; reuse contracts and keep source-of-truth consistent.
3. Test acceptance gate; repair regressions. Do not fabricate successful results.
4. Update `docs/PROGRESS.md` with changed files, actual checks, outcome and next task.
5. Commit one focused change if repository is a Git repo. Do not push without authorisation.

## Completion response
Summarise behavior, files, actual test outcomes, risks and next prompt path.
