# ACCESS MASTER IMPLEMENTATION SPEC — v2.0 — bonus-aligned

## 0. Source of truth and scope
This document governs all tasks. `docs/TASK_REGISTRY.md` is the execution map; tasks may be independently assigned but must meet interfaces defined here. When a task asks for something outside this scope, record it in `docs/TECH_DEBT.md` rather than implementing unless user explicitly approves.

## 1. Problem
Conventional job applications can be inaccessible. Build a career agent that accepts natural-language descriptions of experience, extracts a structured profile, allows correction, and drafts an application package suited to a chosen job. It is a **jobseeker-support** tool, NOT a hiring evaluator.

## 2. Three core product screens
1. Welcome/setup: choose text input; select accessible preferences (large text, high contrast, reduced motion). Explain AI, retention, candidate control.
2. Conversation + Living Career Canvas: asynchronous send/receive; AI adaptive follow-up; suggested profile items with source evidence and *unconfirmed* flag. Candidate approves or edits skills and experience.
3. Jobs + Application Package: choose among three fictional jobs; AI drafts tailored CV + cover letter only from confirmed evidence; edit, regenerate, download `.txt` at minimum; optional `.pdf` only if reliable.

## 3. Explicit out of scope
No account, database, scraping, employer integrations, actual application submission, disability diagnosis, medical questions, scoring of a person's employability, fake job posts portrayed as real, voice-only controls, custom ML training.

## 4. Functional requirements
- R01 Onboarding explains use of AI and that user controls disclosure.
- R02 Accessible input and conversational follow-ups based on preceding answers.
- R03 AI outputs structured profile proposals backed by quotations/paraphrasable evidence from candidate input; never fabricate awards, dates, employers or education.
- R04 Proposed facts start `confirmed:false`; user can edit/approve/delete.
- R05 Candidate selects job from local `DEMO_JOBS` explicitly labelled fictional.
- R06 Application generation uses ONLY confirmed experience and matching job description.
- R07 Provide editable text CV and letter and functional download button.
- R08 No sending/auto-application. Clear human review reminder.
- R09 API errors show comprehensible retry, preserve user-typed content and allow fallback sample only with explicit demo label.
- R10 Keyboard-only completion, labels, landmarks, focus indicator, `aria-live` for async feedback, reduced motion.
- R11 High contrast and large-text preferences alter real UI, not cosmetic placeholders.
- R12 Optional mic transcription ONLY after baseline passes; fallback text always present.

## 5. Model/tool architecture
Use Next.js TypeScript single repo, server-side route handlers `/api/conversation` and `/api/application`; Zod parse on input/output. Keep `GEMINI_API_KEY` on server; configurable `GEMINI_MODEL`. Use Gemini API with the official supported SDK (install during implementation); no agent framework. Bound tokens, output schemas, history length and retry count to control spend. Prefer a single pass extracting nextQuestion + profileSuggestions; a separate call for application package. Candidate approval is deterministic UI state.

## 6. Contracts
`src/lib/contracts.ts` is authoritative; `src/lib/jobs.ts` is seeded content. Chat API proposed request: `{history:ConversationMessage[], profile:CandidateProfile}` and response `{reply:string, suggestions:{kind:'skill'|'experience'|'education', text:string, evidence:string}[]}`; validate via Zod. Application API `{profile:CandidateProfile, jobId:string}` → `ApplicationPackage`; server looks up job, never trusts client-provided job specification.

## 7. Flow/state
`welcome → intake → review → job-select → application-review → export`. Profile is local in memory/localStorage, never sent externally except to the configured model provider for requested generation. Explicit reset deletes local state. Never store secret keys in client code. Keep localStorage versioned and tolerant of invalid data.

## 8. Test acceptance matrix
A. Text-only demo succeeds end-to-end with valid API key.
B. User edits a proposed skill; generated CV reflects edited/confirmed truth.
C. Unconfirmed suggestions never get into generated CV/letter.
D. Blank answers, malformed model output, API refusal and network failure fail visibly/safely.
E. Keyboard completes critical flow without trapping focus.
F. Contrast and resizing tested at desktop/mobile and at 200% zoom.
G. No fictional demo companies shown as real ZEIL jobs.
H. No disability information inferred or included unless volunteered and deliberately retained for a user-controlled purpose; don't need it for CV.
I. `npm run typecheck` and `npm run build` pass.
J. Live demo uses at least one genuine LLM-generated response, visually distinguished from fallback prepared data.

## 9. Milestone release gates
M0 scaffold boots → M1 3-screen styled navigation → M2 real conversational AI → M3 profile verification → M4 tailored package → M5 accessibility audit → M6 deploy + rehearsal. Do not move forward from M2 if one full conversation has not worked.

## 10. Competition constraints
Organiser rules override this spec. Check whether pre-made starter files and AI tools are allowed. If not allowed, use these files only for learning/preparation, not submission. The concept and placeholder wording are not official ZEIL briefing documents.

## 11. BONUS CHALLENGES: AUTHORITATIVE IMPLEMENTATION CONTRACT
Read `docs/BONUS_CHALLENGES.md` before coding. Challenge descriptions are transcribed from the user-provided event screenshot, not independently verified official rules. The screenshot states a +50 bonus cap, and separately advertises a +100 Free points button; do not assume how they interact.

**Primary +50 target (conditional on judge acceptance):** Built for Hiring +20, Ship It +10, Hands +10, Strict Shapes +5, Eyes and Ears +5. These are NOT automatically earned; implement and collect evidence.
- **B01 Built for Hiring (+20):** Define a specific disabled jobseeker persona and observable friction: repeated inaccessible fields → natural-language intake → verified, editable experience profile → accessible CV/application draft; show a real time-saving moment. Avoid unmeasured time-saved claims. Deliver a 20–35s demo segment and `docs/BONUS_EVIDENCE.md`.
- **B02 Ship It (+10):** Public HTTPS deployment reachable by a judge without installing or creating an account, functioning during evaluation. All model keys server-side; scoped rate limits, bounded inputs, timeouts, graceful failures. Record actual public URL after deployment; never fabricate it.
- **B03 Hands (+10):** Gemini must autonomously *choose* when to invoke a developer-defined function, e.g. `propose_profile_updates` or `prepare_application_draft`, with observable tool-call/dispatch/result. Do not merely call a function directly from UI and call it function-calling. The tool must do genuine computation or data/state modification subject to human approval. Enforce argument validation and separate proposals from confirmed profile.
- **B04 Strict Shapes (+5):** Gemini returns JSON in an explicit schema validated by application code; show malformed/invalid response behavior and a safe retry/error path. Ensure JSON schema matches supported SDK capabilities and Zod validation occurs after the API response.
- **B05 Eyes and Ears (+5):** Gemini natively receives a PDF/image or audio input, e.g. a sample CV PDF, and extracts verifiable experience proposals with candidate approval; simply pasting extracted plain text is insufficient for this bonus. Restrict file size/types and never publish uploads.

**Fallback + extras:** Evaluation +10 (10 documented cases, expected outcomes, repeatable script and authentic before/after counts); Break it, fix it +10 (prompt-injection in untrusted resume, failed attack after mitigation demonstrated); optional Gemini Live +15 (actual streaming realtime microphone ↔ Gemini Live with spoken responses, not just asynchronous interview chat). Two brains +15 only if distinct model roles with meaningful visible handoff; don't force it. Grounded +10 only if actual verifiable clickable sources rather than model assertions. Midpoint +25 unknown until announced.

**Release gate:** Core jobseeker workflow and accessibility outrank bonus scoring. Keep Gemini tool-calling and multimodal parsing behind independently testable API functions; voice must never block text keyboard UX.
