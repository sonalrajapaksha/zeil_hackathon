# Architecture — Gemini aligned

Next.js App Router + TypeScript + Zod + server-side Gemini API. No authentication, DB, Docker, scraping, or actual ATS submission. Fictional jobs from `src/lib/jobs.ts`. Candidate state local/in memory, consent-based localStorage if added.

- `/api/conversation`: validated candidate turn and recent history to Gemini; returned reply and evidence-bearing suggestions. Optional controlled function-calling uses model-selected `propose_profile_updates` with server validation, pending-only state and tool result sent back. No model authority to confirm facts.
- `/api/application`: confirmed facts + server lookup of fictional job ID → Gemini draft → validated application package. Never fabricate achievements.
- `/api/cv-import`: bounded MIME-checked PDF/image files → Gemini native multimodal understanding → Zod-checked unconfirmed extracted facts. Do not store files persistently.
- Optional Gemini Live voice route only if task 13 approved: real streaming mic/audio, secure ephemeral credential/proxy, clear permission and text fallback. Async HTTP chat is **not** the Live bonus.

Server secrets only: `GEMINI_API_KEY` (not NEXT_PUBLIC), `GEMINI_MODEL`. Validate output even when schema-constrained; fail gracefully, preserve input, respect timeouts, avoid logging personal data. Protect public judge endpoint with appropriate bounds/rate controls while not requiring judge login. Tool calls dispatch real developer functions; normal button clicks alone aren't Hands.
