# Task 10 — Gemini Hands + Strict Shapes

Role: stronger reasoning model. Read AGENTS.md, MASTER_SPEC, ARCHITECTURE, BONUS_CHALLENGES and PROGRESS.

**Provider:** move AI endpoints to Gemini via server-side `GEMINI_API_KEY` and configurable `GEMINI_MODEL`; use current official SDK interfaces verified against installed package. No API keys in frontend or logs. Respect model limitations for function calling/JSON schemas.

**B03 Hands (+10):** define model-callable `propose_profile_updates({items:[...]})` (or similarly useful function). When a candidate gives new experience, Gemini decides whether/when to call it. Respect the candidate's explicit simple/standard question style; clarification requests are not experience. On server validate tool-call args, execute function to normalise/deduplicate *pending* evidence-bearing suggestions, and send tool result back to Gemini. UI visibly updates pending cards accessibly. Do not mark confirmed until explicit candidate action. No tool or schema may infer disability, make a hiring judgment, or automatically disclose sensitive information. Provide genuine run/trace with model-selected tool, arguments, dispatch, outcome, and a no-tool path. Never mock a direct function call as model-chosen.

**B04 Strict shapes (+5):** define strict schema in code for at least one Gemini response. Request schema-constrained JSON from Gemini, parse and revalidate with Zod, reject unknown/incorrect types, show a friendly recovery UI. Add deterministic malformed-response fixture test to prove failure path; distinguish fixture from live Gemini outputs.

Test: actual Gemini tool-selection run (when credentials present), request validation, no exposure of keys, malformed JSON/error paths. Update BONUS_EVIDENCE, PROGRESS, commit. Avoid building full agent orchestration.
