# Modular task registry (model-agnostic)

| Task | Focus | Suggested model | Requires | Gate |
|---|---|---|---|---|
| 01 | UI shell | fast UI model; design reviewer | scaffold | three screens navigate; text-first interaction and functional access preferences are clear |
| 02 | Gemini conversation | strong | 01/contracts | real contextual response respects simple/standard wording, one question at a time, skip, clarification, and safe errors |
| 03 | Pending profile + approval | fast + check | 02 | evidence visible; candidate edits/approves/removes; no unapproved or sensitive claim is disclosed |
| 04 | Draft package | strong | 03 | only confirmed, non-sensitive evidence is used; editable draft and errors are accessible |
| 05 | Export/persistence | fast | 04 | user edits and chosen preferences persist safely; reset clears; accessible export feedback |
| 06 | Accessibility | strong reviewer | UI | keyboard + screen-reader critical flow; settings, 320px, 1280px, 200% zoom, errors, and motion recorded |
| 07 | Impeccable visual polish | design-focused | baseline | existing visual identity retained; QA on two viewport sizes without accessibility regressions |
| 08 | QA/deploy/demo | strong for blockers | baseline | accessibility-first end-to-end demo and public smoke test if deployed |
| 09 | Hiring proof + deploy | fast/docs + integrator | 03–05 | hiring demo + real judge-accessible URL |
| 10 | Gemini function calling / JSON | strong | 02–03 | live model tool call + malformed schema path |
| 11 | Gemini native PDF | strong | 03 | native multimodal input verified |
| 12 | 10-case eval + injection defense (fallback) | strong review | baseline | actual before/after + attack proof |
| 13 | Gemini Live streaming audio (optional stretch) | strongest available | public baseline | genuine unscripted realtime voice; microphone permission, stop/error states, and complete text fallback verified |

Choose actual available models per your subscription. Skill/model names do not guarantee availability. Every task preserves Access's accessibility-first, universally usable positioning and candidate control. Do not infer disability or medical conditions, and never automatically include sensitive information in application materials. Text is the complete baseline; voice is optional. Each task owns its own files. At most main agent and one isolated UI agent; never concurrently edit the same file. Update docs/PROGRESS.md after every task, commit verified increments, don't push without permission. See prompts/01_MODEL_ROUTING.md.
