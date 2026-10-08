# Task 02 — conversational backend

## Run

Use Node 22.18+ (Node 26.7.0 was used for verification), then `npm ci`.
Set server-only values in the ignored `.env.local`:

```dotenv
GEMINI_API_KEY=your-own-key
GEMINI_MODEL=gemini-3.6-flash
```

The model is configurable; choose one enabled for your Gemini account. The default is `gemini-3.6-flash`. Restart Next.js after changing environment values. Never use a `NEXT_PUBLIC_` key variable.
Run `npm run dev`, then start an interview. The UI discloses transmission to Google Gemini. Access stores the session only in browser memory; reload/reset clears it. No candidate history or provider errors are logged by the route. Google provider retention is governed by your account terms.

## API and state

`POST /api/conversation`, JSON only:

```json
{"action":"start","history":[]}
```

For subsequent turns, submit the returned `history` with `action: "answer"` and `answer`, or `action: "skip"`. For corrections, use `action: "correct"`, the previous user `messageId`, and the replacement `answer`. Correction removes subsequent turns so outdated details do not remain model context. `action: "end"` returns ended progress without calling Gemini. The UI also permits immediate local ending/reset during a pending request.

Success returns `{reply, suggestions: [], history, interview: {status, answered, questions, limit}}`. Errors return `{error: {code, message, retryable}}`; no state is committed. Retry resubmits the same turn. Skips do not count as answers. Interviews allow up to 12 questions; the last answer ends the session deterministically. No database or server session is needed. History, IDs, ordering, answer size, total request body and model output are validated. Generation is bounded to 1,024 tokens, 30 seconds and one attempt; the UI has a 35-second deadline. Exact repeated questions are rejected; semantic repetition remains a model-quality limitation.

The model receives one system instruction plus the alternating conversation transcript. The route requests schema-constrained JSON and validates the output again with Zod. Prompt constraints forbid sensitive inference and fabrication; these instructions reduce risk but cannot certify all generated language. Career profile extraction/approval belongs to Task 03. Existing application screens remain labeled local demo drafts.

## Checks

- `npm run typecheck`
- `npm test` — eight mocked test groups; SDK HTTP requests are intercepted, never real credentials.
- `npm run build`
- `npm run test:gemini` — reads `.env`/`.env.local`, performs real initial/contextual follow-up/end checks if `GEMINI_API_KEY` is present; otherwise explicitly skips. Uses only a fictional library-volunteering story.

Optional browser test: run the production server on port 3002 (`npm run start -- --port 3002`) with no Gemini key; use externally installed Playwright (`npm exec --yes --package=@playwright/test -- playwright install chromium`). Set `PLAYWRIGHT_MODULE` to the absolute `playwright/index.mjs` in that installation and run `npm run test:browser`. Alternatively install Playwright in your own test environment and omit that variable. `ACCESS_TEST_URL` overrides the URL; `CHROME_PATH` can point to an existing Chrome executable. Playwright is intentionally not a production or repository dependency.

The browser check exercises the real missing-key endpoint, then mocks Gemini HTTP responses through the actual route handler. It verifies desktop/mobile keyboard start, failure/retry and preserved text, corrections, skipping, duplicate protection, ending, canvas/demo-draft compatibility, reset, runtime errors and horizontal overflow. Screenshots are written to `/tmp/access-task02-1280.png` and `/tmp/access-task02-320.png`. This is not live Gemini evidence or a full screen-reader accessibility audit.
