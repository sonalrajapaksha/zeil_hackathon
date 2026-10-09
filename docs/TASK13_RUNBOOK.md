# Task 13 — optional Gemini Live voice interview

Implementation is separate from the complete text interview. It streams microphone PCM over the real Gemini Live WebSocket and plays native model PCM audio. It does not use browser speech recognition or the turn-based conversation endpoint. Completed candidate voice answers automatically produce source-checked, unconfirmed skills, experience and education in the Career Canvas. Candidates review/edit and approve each claim before it can enter a CV or cover letter. “Review this answer in text” remains an optional correction path.

## Enable locally

Keep `GEMINI_API_KEY` server-side in the ignored `.env.local`. Set `GEMINI_LIVE_ENABLED=true` and `GEMINI_LIVE_MODEL=gemini-3.8-live` in that file, then restart the server. The model must support Live and be available to that API account. The committed example defaults Live off. Microphone capture requires HTTPS or localhost and a supported AudioWorklet browser. Before enabling on a public host, configure platform rate/quota controls; the anonymous prototype has no distributed token-minting rate limiter.

Choose Simple or Standard, select **Start a conversation**, and select **Start voice & allow microphone**. Only that explicit button requests permission. Audio goes directly to Google Gemini. Access does not record audio, persist the transcript, log tokens, or send the existing profile/text history into Live. Google processes the audio under its provider terms; this is not a promise about Google's retention. The server locks the selected wording and safety instructions, AUDIO output, transcriptions and token ceiling into a single-use credential with a one-minute connection window and five-minute expiry. No long-lived key reaches the browser.

Mute disables microphone tracks and PCM transmission, sends `audioStreamEnd`, and retains the connection for listening. Unmute restores capture. Stop releases tracks, audio playback/worklet/context, timers, pending token requests and WebSocket (including before setup completes). Model interruption immediately clears queued audio. Reset, leaving the story screen, changing question style, switching to the canvas, starting a text request, and backgrounding the page stop voice. A five-minute timeout ends the session; there is no automatic reconnect or hidden retry. Denial/connection failure keeps candidate text/profile intact and offers retry or the complete text controls. Restarting voice starts a fresh transcript. Completed answers are processed sequentially in a bounded discovery queue; extraction errors offer explicit retry without stopping audio. Already-completed extraction can finish after Stop; leaving/reset cancels it.

## Reproducible checks

- `npm run typecheck`
- `npm test` — includes strict token request/credential constraints, disabled/missing-key/cross-origin/provider failures and PCM tests.
- `npm run build`
- `ACCESS_TEST_URL=http://localhost:3013 PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs npm run test:browser` — existing complete candidate-to-export flow.
- `ACCESS_TEST_URL=http://localhost:3013 PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs npm run test:live-browser` — synthetic Chromium microphone plus deterministic WebSocket. Tests keyboard start/permission denial, host failure, input preservation, real PCM microphone framing, mute/unmute, skip/clarification commands, native audio scheduling, interruption queue cleanup, explicit transcript-to-text review, stop before setup, provider closure, reset and no overflow/runtime errors at 320/1280px. This is not human speech or genuine provider proof.
- `npm run test:live-gemini` — uses local server credentials to mint a constrained token, open an actual Gemini Live WebSocket, request a career question and assert a native PCM reply. It does not print tokens/credentials. It enables Live for that test process only. This consumes provider quota and proves connection/audio output, not human microphone turn-taking.

## Actual evidence and remaining acceptance gate

On 2026-10-09, the real-provider smoke passed with `gemini-3.8-live`: single-use constrained token, WebSocket setup and native audio reply. The deterministic browser checks passed at 320px and 1280px. UI captures are `/tmp/access-task13-320.png` and `/tmp/access-task13-1280.png` (local QA artifacts, not checked-in video evidence).

**Not verified:** a real person speaking through a physical microphone, unscripted follow-up, audible playback quality, live human interruption, Safari/mobile hardware, VoiceOver/NVDA output, or a demo video timestamp. There is still no public baseline URL. Task 13's full spoken/video gate remains outstanding; Gemini Live +15 is WORKING, not VERIFIED or CLAIMED. Keep the feature off by default until the owner completes this gate.

To complete that gate, record one uninterrupted run with fictional work examples: allow microphone; answer a fresh Gemini question aloud; receive a contextual spoken follow-up; interrupt the reply; use mute/unmute, skip and clarification; review/edit/approve the voice suggestions and finish the CV/letter export workflow. Verify the complete text fallback separately. Also deny microphone once and verify text input survives. Record the real video path/timestamp and observed device/browser outcomes in `docs/BONUS_EVIDENCE.md` and `docs/PROGRESS.md`. Do not invent them. Existing manual screen-reader/zoom/public-deployment gaps remain unchanged.

## Voice discovery verification — 2026-10-09

- `ACCESS_TEST_URL=http://localhost:3022 PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs npm run test:voice-canvas-browser`: synthetic finalized candidate speech → real extraction handler with deterministic provider fixture → pending claims → edited approval → real application handler → CV/letter download. PASS at 1280/320px, including partial/AI exclusion, duplicate prevention, skip/clarify, failure/retry, confirmed-only storage and reset cancellation.
- `npm run test:voice-profile-gemini`: actual Gemini extraction PASS (three grounded proposals for a synthetic work answer; zero for clarification). This does not prove physical microphone transcription.
- Existing text browser regression PASS at 1280/640/320px; Live regression PASS at 1440/1024/768/390/320px. Genuine Live token/WebSocket/native PCM smoke also PASS after the prompt update.
- UI captures: `/tmp/access-voice-canvas-1280.png`, `/tmp/access-voice-canvas-320.png`. Independent scoped Impeccable review: SHIP. Full spoken/video gate remains pending.
