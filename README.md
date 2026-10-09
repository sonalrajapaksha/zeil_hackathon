# ACCESS — ZEIL Hackathon Starter

**Accessibility-first, conversation-to-career application agent.** This is a **starter repository** (specifications, implementation prompts, contracts, skill integration and skeleton files), **not a finished implementation**.

## Start here
1. Review `docs/MASTER_SPEC.md` and `docs/COMPETITION_RULES.md`. Respect hackathon rules on prebuilt code, teams and AI tools; adapt this kit if needed.
2. Install Node.js 20+; `npm install`; copy `.env.example` to `.env.local` and add your own API key (never commit it).
3. Run `npm run dev` to see a basic scaffold. The frontend and backend must be built through the task prompts.
4. Read `docs/BUILD_ORDER.md`; give Codex `prompts/00_ORCHESTRATOR.md`.
5. Run tasks `prompts/tasks/01...08` in order, using `docs/TASK_REGISTRY.md` for dependencies and acceptance gates.
6. To get upstream skills: read `docs/SKILLS.md` and run `bash scripts/install-skills.sh` (requires internet). Do **not** assume those external skills are already bundled.
7. Update `docs/PROGRESS.md` after each milestone. Commit working slices.

## Core objective
A candidate describes their experience naturally via text (optional browser speech recognition enhancement). AI extracts **confirmed** work history into an editable profile. The candidate chooses a seeded job, receives an evidence-grounded draft CV and cover letter, edits them and exports the result. **Never automatically apply or disclose disability.**

## Initial scope
Frontend first for 30–45 minutes, then an actual AI call, then vertical slices. Strict six-hour cap. Mock job data; no login, ATS integration, scraping or database.

## Docs index
- `docs/MASTER_SPEC.md` — scope, data flows, product contract, requirements and acceptance criteria
- `docs/BUILD_ORDER.md` — strict six-hour implementation and kill switches
- `docs/ARCHITECTURE.md` — stack, API and state management
- `docs/ACCESSIBILITY.md` — accessibility-first implementation checks
- `docs/DESIGN.md` — ZEIL-inspired but distinct Boldly Human design direction
- `docs/PRODUCT.md` — mission, personas and user journey
- `docs/SECURITY_PRIVACY.md` — privacy/safety constraints
- `docs/TASK_REGISTRY.md` — model routing and parallelism
- `docs/DEMO.md` — live demo, backups and pitch
- `docs/COMPETITION_RULES.md` — verify organizer's actual permitted tooling
- `docs/SKILLS.md` — upstream Impeccable and Ponytail installation
- `prompts/00_ORCHESTRATOR.md` and `prompts/tasks/*` — modular build prompts

## Limitations
Seeded jobs, single-session candidate data, and job matching are prototype-only. AI should be labeled as assistance, not impartial hiring evaluation. Demo data must be fictional; do not present seeded outputs as live model results.

## ZEIL bonus-aligned v2 quickstart
**The baseline is a starter scaffold, not an implemented AI product, deployed website, or earned bonus points.**

- Review `docs/BONUS_CHALLENGES.md` for the preferred +50 route and `docs/BONUS_EVIDENCE.md` for required proof.
- AI environment is now `GEMINI_API_KEY` / `GEMINI_MODEL` (server side). The Gemini SDK must be installed/implemented through the modular AI tasks; simply setting the env vars doesn't make the starter functional.
- Run `prompts/00_ORCHESTRATOR.md`, core tasks 01–08, plus bonus tasks 09–11 within time gates. Optional 12 and 13 are fallback and stretch.
- Normal text-based AI interviews are **not** “Live +15”. Genuine Gemini Live voice streaming is a separate stretch task.
- Do not claim +20 hiring or +10 shipping until the working flow and public deployment are demonstrated.

## Deploy for judges

The public deployment URL is **not yet available**. Do not submit a placeholder as a live demo. Vercel deployment requires an authorized Vercel account/project and a server-side Gemini API key.

1. Import this repository into Vercel with the repository owner's authorization. Use the Next.js preset, Node.js 20 or later, `npm install`, and `npm run build`.
2. Add `GEMINI_API_KEY` as a server-only Production environment variable. Optionally add `GEMINI_MODEL` if the default `gemini-3.6-flash` is not enabled for the key. Never use a `NEXT_PUBLIC_` prefix.
3. Configure the provider/platform request rate controls for `/api/conversation` and `/api/application` before sharing a public endpoint. The handlers cap JSON bodies at 64 KB and model calls at 12 seconds; provider quota errors return a retryable 429. App-level distributed rate limiting is not implemented in this prototype.
4. Deploy to Production. After Vercel reports Ready, record its actual HTTPS domain here and in `docs/BONUS_EVIDENCE.md` only after the public smoke checks and a genuine fictional candidate-to-export journey pass.

### Public smoke test

```sh
PUBLIC_URL='https://your-real-deployment.vercel.app'
curl -i "$PUBLIC_URL/"
curl -i -X POST "$PUBLIC_URL/api/conversation" \
  -H 'Content-Type: application/json' \
  --data '{"action":"start","history":[],"questionStyle":"standard","extra":true}'
```

Expect HTTP 200 for `/` and HTTP 400 with `INVALID_REQUEST` for the extra-field request. Then use the public page to complete a genuine Gemini interview, approve a grounded suggestion, prepare and edit a draft for a fictional role, download both text files, and reset. Use no real candidate information. See `docs/TASK08_RUNBOOK.md` for the full release procedure and failure checks.
