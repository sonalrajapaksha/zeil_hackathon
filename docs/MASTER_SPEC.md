# ACCESS MASTER IMPLEMENTATION SPEC — v2.0 — bonus-aligned

## 0. Source of truth and scope
This document governs all tasks. `docs/TASK_REGISTRY.md` is the execution map; tasks may be independently assigned but must meet interfaces defined here. When a task asks for something outside this scope, record it in `docs/TECH_DEBT.md` rather than implementing unless user explicitly approves.

Keep delivery realistic for a six-hour hackathon: use the existing Next.js/TypeScript/Zod/Gemini architecture, avoid new dependencies and infrastructure, implement question style as a small candidate-controlled setting, and keep voice/Gemini Live optional stretch work.

## 1. Problem and positioning
Access is an accessibility-first AI career companion that removes barriers in traditional job applications. It is designed with people facing accessibility challenges in mind and is available to everyone. It accepts natural-language descriptions of experience, extracts an evidence-backed profile for candidate review, and drafts an application package for a chosen job.

Access is career assistance, not a disability assessment, hiring decision system, employability scorer, or service restricted to disabled candidates. Never ask for diagnoses or infer disability, medical conditions, or access preferences from behavior. Candidates choose their communication and display preferences.

## 2. Three core product screens
1. Welcome/setup: text interaction is always available. Let candidates choose simple or standard question wording and functional high-contrast, large-text, and reduced-motion preferences. Explain Gemini use, retention, and candidate control. Do not infer or preselect preferences.
2. Conversation + Living Career Canvas: asynchronous send/receive; one clear question at a time; follow-ups respect the chosen question style; candidates can skip or request clarification. Clarification is not treated as candidate experience. Suggestions show source evidence and start unconfirmed. Candidate can edit, approve, or remove skills, experience, and education.
3. Jobs + Application Package: choose among three fictional jobs; AI drafts tailored CV + cover letter only from confirmed evidence; edit, regenerate, download `.txt` at minimum; optional `.pdf` only if reliable.

## 3. Explicit out of scope
No account, database, scraping, employer integrations, actual application submission, disability diagnosis, medical questions, scoring of a person's employability, fake job posts portrayed as real, voice-only controls, custom ML training. Access is not restricted to disabled candidates.

## 4. Functional requirements
- R01 Onboarding positions Access as accessibility-first and available to everyone; explains Gemini use, retention, and user control over disclosure.
- R02 Text interaction is always available. The candidate explicitly chooses simple or standard question wording; Gemini respects that preference and asks exactly one interview question at a time.
- R02a The candidate can skip a question or ask for clarification. Clarification receives a concise answer and restates the current question; clarification text is not extracted as career evidence. Skips are not treated as answers.
- R03 AI outputs structured profile proposals backed by quotations/paraphrasable evidence from candidate input; never fabricate awards, dates, employers or education.
- R04 Proposed facts start `confirmed:false`; user can edit/approve/delete.
- R05 Candidate selects job from local `DEMO_JOBS` explicitly labelled fictional.
- R06 Application generation uses ONLY confirmed experience and matching job description.
- R07 Provide editable text CV and letter and functional download button.
- R08 No sending/auto-application. Clear human review reminder.
- R09 API errors are accessible to keyboard and screen-reader users, explain recovery, preserve user-entered content, and allow fallback sample only with an explicit demo label.
- R10 Keyboard-only completion, semantic landmarks and labels, visible focus, concise screen-reader announcements for async updates, and reduced-motion support.
- R11 High-contrast, large-text, and reduced-motion preferences alter the real interface, not cosmetic placeholders. Question style is an explicit, changeable choice and changes Gemini wording.
- R12 Voice is optional and only implemented after the text flow works. Microphone permission is explicit; every core task has a complete text alternative. Gemini Live is optional Task 13 only.
- R13 Never automatically include sensitive personal, disability, or medical information in a CV or cover letter, even if volunteered or retained. Do not ask for it. The candidate remains in control of any manual edits and disclosure.

## 5. Model/tool architecture
Use Next.js TypeScript single repo, server-side route handlers `/api/conversation` and `/api/application`; Zod parse on input/output. Keep `GEMINI_API_KEY` on server; configurable `GEMINI_MODEL`. Use Gemini API with the official supported SDK (install during implementation); no agent framework. Bound tokens, output schemas, history length and retry count to control spend. Send Gemini only the communication preference needed for question wording; do not send display preferences or the full profile unless a requested feature requires it. Prefer a single pass extracting nextQuestion + profileSuggestions; a separate call for application package. Candidate approval is deterministic UI state.

## 6. Contracts
`src/lib/contracts.ts` is authoritative; `src/lib/jobs.ts` is seeded content. Chat API request includes bounded history and only the selected `questionStyle:'simple'|'standard'`; response includes one reply and evidence-bearing profile suggestions. Validate via Zod. Application API `{profile:CandidateProfile, jobId:string}` → `ApplicationPackage`; server looks up job, never trusts client-provided job specification. The draft generator excludes unconfirmed facts and sensitive information; the candidate reviews and edits the result.

## 7. Flow/state
`welcome → intake → review → job-select → application-review → export`. Profile and preferences remain local in memory/localStorage; send only the minimum information needed to the configured model provider for a requested generation. Explicit reset deletes local state. Never store secret keys in client code. Keep localStorage versioned and tolerant of invalid data.

## 8. Test acceptance matrix
A. Text-only demo succeeds end-to-end with valid API key and remains complete if optional voice is unavailable.
B. User edits a proposed skill; generated CV reflects edited/confirmed truth.
C. Unconfirmed suggestions never get into generated CV/letter.
D. Blank answers, malformed model output, API refusal and network failure fail visibly/safely.
E. Candidate can switch simple/standard question wording; a clarification request gets a concise answer and restated question without becoming profile evidence; skip is not counted as an answer.
F. Keyboard completes the critical flow without trapping focus; screen-reader announcements cover progress, suggestions, and errors without reading the entire canvas repeatedly.
G. Functional high contrast, large text, and reduced motion are checked. Test 320px, 1280px, and 200% zoom; record actual results and gaps.
H. No fictional demo companies shown as real ZEIL jobs.
I. No disability or medical information is inferred, requested, or automatically included in generated application materials. User control and explicit review are preserved.
J. Accessible errors preserve candidate text and provide a usable recovery path.
K. `npm run typecheck` and `npm run build` pass.
L. Live demo uses at least one genuine LLM-generated response, visually distinguished from fallback prepared data.

## 9. Milestone release gates
M0 scaffold boots → M1 3-screen styled navigation and explicit preferences → M2 real conversational AI respecting question style, skip, and clarification → M3 profile verification → M4 tailored package → M5 accessibility audit → M6 deploy + rehearsal. Do not move forward from M2 if one full conversation has not worked. Treat accessibility as a requirement at every milestone, not a feature deferred to M5.

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
