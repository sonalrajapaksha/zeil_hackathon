# Task 03_PROFILE_CONFIRMATION: Profile Extraction And Approval

**Suggested model tier:** fast/strong verification. **Prerequisite:** preceding milestones in docs/PROGRESS.md.

## Required reading
Read `AGENTS.md`, `docs/MASTER_SPEC.md`, `docs/PROGRESS.md`, the relevant docs for this task. Avoid loading unrelated documents.

## Scope
Extend conversation structured output so suggested career claims have evidence and start unconfirmed. Add Living Career Canvas proposals with approve/edit/remove. CandidateProfile type is authoritative. Show each claim's source visibly. Candidates control every proposal; clarification requests are not profile evidence. Never save inferred disability or medical conditions, make automatic qualification judgments, or automatically disclose sensitive information in application materials. Access is for everyone and must not presume an access need. Gate: edited and approved skill appears in the confirmed profile; unconfirmed skill is excluded; removal works; source evidence is visible; keyboard/mobile controls work.

## Strict procedure
1. Inspect existing code and run existing checks before modifications.
2. Implement only this slice; reuse contracts and keep source-of-truth consistent.
3. Test acceptance gate; repair regressions. Do not fabricate successful results.
4. Update `docs/PROGRESS.md` with changed files, actual checks, outcome and next task.
5. Commit one focused change if repository is a Git repo. Do not push without authorisation.

## Completion response
Summarise behavior, files, actual test outcomes, risks and next prompt path.
