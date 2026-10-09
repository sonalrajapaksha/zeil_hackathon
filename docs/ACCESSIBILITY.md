# Accessibility requirements and manual test protocol

Access is an accessibility-first career companion for everyone. Design for people facing accessibility barriers without assuming a diagnosis, inferring a need, or restricting access to disabled candidates. Ask about preferences directly and let candidates change them at any time.

## Required user controls

- Text interaction is always available and supports the complete core journey.
- Let candidates choose **Simple questions** or **Standard questions**. Simple means shorter sentences and familiar words; it does not change, summarize, or judge the candidate's own words.
- Provide functional high-contrast, large-text, and reduced-motion preferences. Do not infer or preselect them.
- Voice interaction is optional and only present if explicitly implemented. It must include permission, status, stop controls, and a complete text fallback. Gemini Live is optional Task 13, not the baseline.

## Interface requirements

Use semantic HTML, skip link, logical keyboard focus order, visible focus indicators, explicit labels, associated errors, descriptive real buttons, and no hover-only interactions. All core actions—including choose style, send, skip, clarify, review/edit/approve/remove a claim, choose a fictional role, edit a draft, and export—must be keyboard operable.

Use concise polite screen-reader announcements for question readiness, profile suggestions, confirmation, completion, and errors. Do not announce the entire changed canvas on each update. Keep focus stable or move it intentionally after errors and state changes.

Errors must identify the problem, provide a keyboard-accessible recovery action, and preserve the candidate's unsent text and existing confirmed profile. Never present prepared content as model output; label fallback content clearly.

Never ask for disability or medical information. Do not infer a condition or preference from a candidate's words or behavior. Sensitive information volunteered by the candidate must never be automatically included in a CV or cover letter.

Use readable contrast, body text of at least 16px where practical, clear heading order, text labels for status, and touch targets around 44×44px where practical. Export meaningful editable text, not image-only documents. Avoid claiming certified WCAG compliance without a complete verified audit.

## Manual test protocol

Test the complete flow using keyboard only: onboarding and preferences → text interview → simple and standard question styles → skip and clarification → proposal source review → edit, approve, and remove → fictional job → draft review/edit → download. Test Tab and Shift+Tab, Enter and Space, focus visibility, and recovery from API/network errors.

Also test:

- Screen-reader announcements for questions, proposals, approvals, and errors using VoiceOver or an equivalent screen reader.
- 320px and 1280px viewports and 200% browser zoom, with no lost controls or horizontal scrolling that blocks the task.
- High contrast, large text, and reduced-motion preferences as functional settings.
- Sensitive volunteered text is neither inferred nor automatically disclosed in generated materials.
- If voice is implemented, microphone permission, denial, stop/mute, failure recovery, and completion using text alone.

Record exact test conditions, outcomes, and known gaps. Automated scans and passing tests do not by themselves establish WCAG conformance.

## Voice-first redesign — 2026-10-09

“Start a conversation” opens the voice information and controls without requesting microphone permission or starting a text API call. “I’d rather type” starts the existing complete text journey. Voice starts only through “Start voice & allow microphone”; mute, stop, skip, clarification and retry remain explicit controls. Voice is optional practice, separate from text extraction. “Review this answer in text” stops voice and places a bounded answer in the text field for correction and explicit submission; it never approves a claim.

The visual signal is decorative (`aria-hidden`), paired with readable state text and concise status/error announcements. The native transcript disclosure has speaker labels and a keyboard-focusable scroll region. Streaming transcript tokens are not a live region and do not force scroll or move keyboard focus. Stopping returns focus to the start control; transferring an answer focuses the text field. Existing mobile panel controls, high contrast, large text, simple/standard questions and preference persistence remain in place.

System and application reduced-motion settings stop the landing preview, signal and card animation; preview motion controls are hidden when motion is disabled. Pause/play and replay are available otherwise. Fictional preview content is explicitly labelled and carries no microphone or provider activity.

Verification reported by the integrator: baseline/final 29 unit tests, typecheck and production build PASS; text browser flow at 320/640/1280px PASS; synthetic Live browser flow at 1440/1024/768/390/320px PASS. Genuine-provider ephemeral token, WebSocket and native PCM reply PASS. Synthetic audio and provider output do not establish human microphone turn-taking or heard playback quality. Manual VoiceOver/NVDA and actual 200% browser zoom remain unverified; 640px reflow is not a zoom test. Final preview/consent/reflow checks passed at all five requested widths; screenshots and the independent spacing-fix verdict are recorded in `docs/PROGRESS.md`. No WCAG certification or full Live bonus verification is claimed.

Microphone waveform follow-up: real microphone samples update only the decorative SVG line. Green indicates a working Live session; red accompanies visible voice/microphone errors. Mute is neutral. Both reduced-motion preferences keep the line flat, and all state/error text remains available. Colour is never the only status cue.
