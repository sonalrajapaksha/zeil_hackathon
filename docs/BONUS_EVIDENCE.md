# ZEIL bonus evidence — fill with verified results only

| Bonus | Status (NOT STARTED / WORKING / VERIFIED / CLAIMED) | Implementation/source paths | Video timestamp | Proof/test output |
|---|---|---|---|---|
| B01 Built for hiring +20 | WORKING | `src/app/page.tsx`; `docs/DEMO.md`; Tasks 03–08 production-browser evidence in `docs/PROGRESS.md` | Not recorded | Mere is a fictional disabled jobseeker persona with a specific form-navigation barrier and chosen preferences; the app now explains carrying confirmed details into editable drafts instead of repeating them. Sample jobs are visibly labeled fictional. Record a real segment and timestamp before claiming. |
| B02 Ship it +10 | NOT STARTED | `docs/TASK08_RUNBOOK.md`; `README.md` deployment guide | — | Vercel CLI reports no credentials; no public HTTPS URL or judge click test exists. Deploy and verify before claiming. |
| B03 Hands +10 | VERIFIED | `src/app/api/conversation/route.ts`; `src/lib/contracts.ts`; `tests/gemini-smoke.ts`; `tests/conversation.test.ts` | Not recorded | `npm run test:gemini` on 2026-10-09 showed Gemini autonomously selecting `propose_profile_updates`, genuine evidence arguments, validated server dispatch, `pending_for_review`, and a separate genuine no-tool answer path. Deterministic dispatch/validation tests also pass. No video timestamp; not claimed with ZEIL. |
| B04 Strict shapes +5 | VERIFIED | `src/app/api/conversation/route.ts`; `src/lib/contracts.ts`; `tests/conversation.test.ts` | Not recorded | Gemini receives a JSON schema for the strict conversation response; output is parsed/revalidated with strict Zod. `npm test` includes malformed JSON, missing/unknown shape fields, blank/multiple/repeated question failures and verifies friendly `INVALID_RESPONSE`. No video timestamp; not claimed with ZEIL. |
| B05 Eyes and ears +5 | NOT STARTED | — | — | Show Gemini native PDF/image/audio handling |
| Eval +10 (optional) | NOT STARTED | — | — | 10 examples + actual baseline / improved numbers |
| Break it +10 (optional) | NOT STARTED | — | — | Actual attack/retest evidence |
| Gemini Live +15 (optional) | NOT STARTED | — | — | Real-time streaming speech, not normal chat |
| Midpoint +25 | UNKNOWN | — | — | Await 13:00 brief |
| Free points +100 | UNCONFIRMED | Manual event-site button | — | Screenshot confirmation / rules interpretation |

Never fill in links, timestamps, test scores, or claims until they exist. Judges may award half or zero points.
