# Architecture — Gemini aligned

Next.js App Router + TypeScript + Zod + server-side Gemini API. No authentication, DB, Docker, scraping, or actual ATS submission. Fictional jobs from `src/lib/jobs.ts`. Candidate state local/in memory, consent-based localStorage if added.

- `/api/conversation`: validated candidate turn and recent history to Gemini; returned reply and evidence-bearing suggestions. Optional controlled function-calling uses model-selected `propose_profile_updates` with server validation, pending-only state and tool result sent back. No model authority to confirm facts.
- `/api/application`: confirmed facts + server lookup of fictional job ID → Gemini draft → validated application package. Never fabricate achievements.
- `/api/cv-import`: bounded MIME-checked PDF/image files → Gemini native multimodal understanding → Zod-checked unconfirmed extracted facts. Do not store files persistently.
- Task 13 optional Gemini Live practice: `/api/live-token` issues a constrained ephemeral credential; `LiveVoice.tsx` manages the native Live WebSocket, microphone PCM through `public/live-pcm-worklet.js`, playback and cleanup. It remains disabled by default through server configuration, requires explicit microphone consent and has a complete text alternative. Async HTTP chat is **not** the Live bonus.

Server secrets only: `GEMINI_API_KEY` (not NEXT_PUBLIC), `GEMINI_MODEL`. Validate output even when schema-constrained; fail gracefully, preserve input, respect timeouts, avoid logging personal data. Protect public judge endpoint with appropriate bounds/rate controls while not requiring judge login. Tool calls dispatch real developer functions; normal button clicks alone aren't Hands.

## Voice-first presentation boundary

The redesign changes page composition, `HeroPreview`, Live presentation and CSS; provider routes, contracts, transport, audio encoding and resource lifecycle stay unchanged. The welcome voice CTA only sets local presentation state and enters the workspace. Opening the consent panel does not request the microphone, an ephemeral token or a text turn. The text CTA uses the existing conversation start handler.

`LiveVoice` derives a visual state from lifecycle, active playback sources, mute, interruption status and errors. CSS drives concentric rings; no analyser, amplitude observer, animation framework or high-frequency audio state was added. No silent interval is classified as model thinking or candidate speech. `HeroPreview` is a local, labelled fictional example with CSS animation and pause/replay state, never a provider session.

Live transcripts remain in memory and are separate from the confirmed profile and text interview. Explicit answer transfer stops Live, appends within the existing 4,000-character text limit, and focuses the text field. Extraction then requires the candidate's ordinary text submission and follows the existing validated pending-proposal path. There is no realtime Live-to-canvas extraction or automatic evidence-to-opportunity mapping. Profile card entrances reflect mounting of existing data; confirmation remains deterministic candidate action. Existing storage, sensitive-information screening and API-key boundaries remain authoritative.
