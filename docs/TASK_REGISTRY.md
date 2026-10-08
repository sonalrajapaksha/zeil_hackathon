# Modular task registry (model-agnostic)

| Task | Focus | Suggested model | Requires | Gate |
|---|---|---|---|---|
| 01 | UI shell | fast UI model; design reviewer | scaffold | screens navigate |
| 02 | Gemini conversation | strong | 01/contracts | real Gemini response |
| 03 | Pending profile + approval | fast + check | 02 | no unapproved claim |
| 04 | Draft package | strong | 03 | no fabricated experience |
| 05 | Export/persistence | fast | 04 | user edits export |
| 06 | Accessibility | strong reviewer | UI | keyboard/zoom |
| 07 | Impeccable visual polish | design-focused | baseline | QA on two viewport sizes |
| 08 | QA/deploy/demo | strong for blockers | baseline | public smoke test |
| 09 | Hiring proof + deploy | fast/docs + integrator | 03–05 | hiring demo + real judge-accessible URL |
| 10 | Gemini function calling / JSON | strong | 02–03 | live model tool call + malformed schema path |
| 11 | Gemini native PDF | strong | 03 | native multimodal input verified |
| 12 | 10-case eval + injection defense (fallback) | strong review | baseline | actual before/after + attack proof |
| 13 | Gemini Live streaming audio (stretch) | strongest available | public baseline | unscripted realtime voice |

Choose actual available models per your subscription. Skill/model names do not guarantee availability. Each task owns its own files. At most main agent and one isolated UI agent; never concurrently edit the same file. Update docs/PROGRESS.md after every task, commit verified increments, don't push without permission. See prompts/01_MODEL_ROUTING.md.
