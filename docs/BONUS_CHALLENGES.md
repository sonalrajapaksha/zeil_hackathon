# ZEIL bonus scoring implementation and proof — v2

Screenshot source: user-provided ZEIL bonus challenge image. Organiser/judges decide final points. Screenshot: “optional, on top of your main score, up to +50”; judge awards full / half / zero; submit with video timestamp or repo file. “Free points” button claims +100; cap interaction unclear. Press and verify separately.

## Target route — +50 potential, not guaranteed
| ID | Challenge | Points | Implementation | Evidence and honest claim gate | Task |
|---|---|---:|---|---|---|
| B01 | Built for hiring | 20 | Accessible conversational CV + job application with approved skills | Explain named persona, demonstrable barrier, actual improved workflow and moment it saves manual entry | 03/04/09 |
| B02 | Ship it | 10 | Public HTTPS Vercel deployment; no login/install; server-held API key | Judge can use URL; README includes URL and test steps; deployed endpoints work | 08/09 |
| B03 | Hands | 10 | Gemini chooses genuine `propose_profile_updates` tool call, server validates and applies to *pending* suggestions only | Show model tool-call arguments, server dispatch, actual pending suggestion card result | 10 |
| B04 | Strict shapes | 5 | Gemini schema-constrained JSON, validated with Zod, documented invalid-response handler | Show schema and verified bad-output scenario in repo/video | 10 |
| B05 | Eyes and ears | 5 | Gemini reads uploaded PDF/image natively (not just pasted text) | Show upload → real multimodal Gemini response → pending items and human approval | 11 |

## Alternative/extra proofable challenges
- **Prove it works +10**: at least ten real eval test inputs, expected outputs and reproducible scoring script; measured baseline and after a real change. Task 12. Do not invent scores.
- **Break it, fix it +10**: adversarial text inside uploaded resume attempts to manipulate output; show vulnerable/baseline result if safe to demonstrate, defensive fix, rerun and result. Task 12.
- **Live +15**: only if Gemini Live API streams live microphone/audio and replies as events occur. Text chat, turn-based HTTP, browser speech recognition followed by ordinary LLM call, or an animated waveform alone do **not** qualify. Task 13 (stretch). Keep explicit audio permission, accessible text alternative, and safe server-side token setup.
- **Two brains +15**: explicit different model roles, handoff and demonstrated improvement against a single call; not a couple of Codex coding agents (they build the app, not its user-facing AI). Skip unless baseline done.
- **Grounded +10**: clickable evidence from Google Search grounding or document retrieval + embeddings; citations must link to authentic sources. Candidate quote provenance on its own is NOT guaranteed to satisfy the described Google/Search/RAG requirement.
- **Midpoint drop +25**: revealed at 13:00; triage then, do not guess now.
- **Free points +100**: press claim button manually; screenshot is contradictory with +50 cap. Don't treat it as awarded without confirmation.

## Submission evidence instructions
In `docs/BONUS_EVIDENCE.md`, provide each claimed bonus: requirement, actual implementation path, proof screenshot or test path, demo video timestamp, known limitations, URL when applicable. Only mark CLAIMED when working and verified. The user / judge must submit claims through the official submission form; repository checklists do not submit anything.
