# Three-minute Access demo + scoring timestamps (fill after recording)

## Rehearsal checklist

1. Open the deployed HTTPS URL only after following `docs/TASK08_RUNBOOK.md` and passing its public smoke checks. A local demo can use `npm run dev` instead.
2. Confirm the server has `GEMINI_API_KEY` and the chosen `GEMINI_MODEL`; never show or paste the key on screen. If the key or provider is unavailable, use the separate **SAMPLE FALLBACK** below and identify every prepared item as prepared content.
3. Select **Simple** question wording and **Larger text** before starting. Keep the text entry, submit, and reset controls visible. Do not claim a screen-reader audit: keyboard and browser-semantic checks passed, but spoken output has not been checked with VoiceOver/NVDA.
4. Use only fictional details. A candidate can use **Reset & delete** in the header to clear the local profile and start over. Do not enter real personal, disability, or medical information in a public demo.
5. After the demo, reset and verify the welcome screen returns and the local saved profile is removed.

## Accessibility-first scenario

Mere is a fictional jobseeker exploring customer-support work. Long, dense, multi-step application forms are difficult for Mere to navigate, so Mere chooses simple question wording, large text, and keyboard-operated text chat. This is one person's preference in the scenario, not a diagnosis, not a claim about all disabled people, and not a prerequisite to use Access. Access is designed with accessibility barriers in mind and is available to everyone.

This is a target journey, not permission to imply unfinished features work. Use only controls, Gemini responses, and accessibility behavior verified in the current build. If simple/standard wording, clarification, a preference control, or a tested access feature is still outstanding, identify it as follow-up work; do not stage a fake interaction.

## B01 hiring proof segment (20–35 seconds)

Use Mere as the required fictional disabled jobseeker persona. Describe the observable barrier as long, multi-step forms that are difficult for Mere to navigate; do not invent a diagnosis or imply this experience represents every disabled person. Show Mere choosing Simple questions and Larger text, describing volunteer experience once, reviewing and approving the evidence-backed suggestion, then choosing the clearly fictional Customer Support Assistant role and editing the resulting CV and letter. Point out that confirmed details carry forward into the editable drafts, avoiding repeated manual entry of those details across this application journey. Access is accessibility-first and available to everyone. Do not claim measured minutes saved or WCAG certification. Capture actual timestamps only after recording; none are recorded yet.

## Three-minute flow

00:00–00:20: State the fictional form barrier and Mere's chosen preferences. Explain that Access is an accessibility-first career companion for everyone, not an assessment or hiring system. Avoid diagnosis and unmeasured time-saved claims.

00:20–00:50: Show the candidate's selected question style and text entry. Use a genuine Gemini response and show one concise question at a time. Text remains available throughout.

00:50–01:20: Demonstrate skip or clarification only if implemented and verified. Show that a clarification request does not become profile evidence.

01:20–01:50: Show an evidence-backed Living Career Canvas proposal. Mere edits and approves it; an unapproved proposal remains out of the confirmed profile. Do not include sensitive information in generated materials.

01:50–02:20: Select a clearly fictional, ZEIL-relevant role and prepare an editable draft from confirmed evidence. State that Access does not apply or contact the employer.

02:20–02:45: Review and export the candidate-edited draft. Demonstrate keyboard access and the large-text preference. High contrast and reduced motion have automated computed-style/browser checks. Describe test conditions honestly; do not claim WCAG compliance without verification.

02:45–03:00: Close with candidate control and what remains private. Mention only bonus evidence that exists and is verified. Use actual deployed URL only after a judge-accessible deployment works.

Separate bonus evidence video/timestamps if the main pitch is too short. Fill actual timestamps in `docs/BONUS_EVIDENCE.md`. A native PDF upload may appear only after Task 11 verifies it. Gemini Live may replace a short segment only after Task 13 verifies real-time streaming speech; never describe ordinary async chat as Live.

## Optional proof inserts (only when verified)

- **B01 Built for Hiring:** when claiming this challenge, use its required specific fictional disabled jobseeker persona. Show their observable form barrier, chosen preferences, accessible intake, candidate-confirmed evidence, and actual manual steps avoided. Do not infer a diagnosis, imply Access is restricted to disabled candidates, or claim measured time savings without a measurement.
- **B02 Ship It:** show the real HTTPS URL only after judge-accessible deployment and endpoint smoke tests pass.
- **B03 Hands:** show Gemini's real tool choice, arguments, server dispatch, result, and pending proposal. A UI button calling a function is not proof.
- **B04 Strict Shapes:** show the actual schema and safe malformed-output recovery.
- **B05 Eyes and Ears:** show native Gemini processing of a bounded sample PDF/image and candidate review; pasted extracted text is not proof.
- **Task 13 Live:** show actual realtime microphone-to-Gemini audio and spoken response, with permission and working text fallback. Async interview chat does not qualify.

## SAMPLE FALLBACK (prepared, not model output)

Use this only as a clearly titled slide or spoken walkthrough if Gemini is unavailable. Do not paste it into the live chat or draft editor and imply the app generated it. The app has no offline AI/sample mode; the live interface will show a recoverable configuration/provider error instead.

**SAMPLE FALLBACK — PREPARED CONTENT, NOT GEMINI OUTPUT**

- Fictional scenario: Mere chooses Simple wording and Larger text. This preference belongs to this scenario and is not a diagnosis or a requirement for using Access.
- Prepared candidate statement: “I volunteer at a community library on Saturdays. I help visitors find books and keep the children’s area organised.”
- Prepared profile proposal: “Helping visitors find books”, supported by the quoted candidate statement. In a live session, the candidate must review and approve a proposal before it can enter the application draft.
- Prepared application example: an editable CV and cover letter for the fictional Customer Support Assistant role, using only a candidate-approved, work-related detail.

These lines are a fallback illustration only. They are not proof of a live response, a completed application, saved candidate data, measured time savings, or an accessible screen-reader journey. Keep genuine model output and prepared content visually distinct.

## Current rehearsal evidence

- Production build and browser smoke passed at 320px, 640px, and 1280px. The browser smoke uses mocked Gemini responses; it verifies keyboard interaction, settings, errors, confirmation, exports, reset, and no horizontal overflow.
- A separate production-browser run completed a genuine Gemini interview, candidate approval, and editable fictional-role CV/letter generation. API credentials and personal candidate information were not used in the browser scenario.
- Manual VoiceOver/NVDA output and a public judge-accessible URL remain unverified. Do not claim B02 Ship It or WCAG conformance until their respective proof exists.

Never fabricate a candidate, response, test result, deployment, recording, or scoring claim.
