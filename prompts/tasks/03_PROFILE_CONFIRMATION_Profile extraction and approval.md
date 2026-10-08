# Task 03_PROFILE_CONFIRMATION: Profile Extraction And Approval

**Suggested model tier:** fast/strong verification. **Prerequisite:** preceding milestones in docs/PROGRESS.md.

## Required reading
Read `AGENTS.md`, `docs/MASTER_SPEC.md`, `docs/PROGRESS.md`, the relevant docs for this task. Avoid loading unrelated documents.

## Scope
Extend conversation structured output so suggested career claims have evidence and start unconfirmed. Add Living Career Canvas proposal cards with approve/edit/delete. CandidateProfile type is authoritative. Show visibly where claims came from. Never save inferred disability or automatic user qualification judgments. Gate: edited confirmed skill appears in profile; unconfirmed skill is not included in confirmed selector. Ensure mobile/keyboard.

## Strict procedure
1. Inspect existing code and run existing checks before modifications.
2. Implement only this slice; reuse contracts and keep source-of-truth consistent.
3. Test acceptance gate; repair regressions. Do not fabricate successful results.
4. Update `docs/PROGRESS.md` with changed files, actual checks, outcome and next task.
5. Commit one focused change if repository is a Git repo. Do not push without authorisation.

## Completion response
Summarise behavior, files, actual test outcomes, risks and next prompt path.
