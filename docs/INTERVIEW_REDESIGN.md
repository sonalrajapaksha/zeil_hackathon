# ACCESS — UNIFIED VOICE-FIRST INTERVIEW REDESIGN

## Objective

Redesign the existing Access interview page into a single, cohesive, accessibility-first interviewing experience with two mutually exclusive interaction modes:

1. **Voice — default mode**, powered by the existing, functioning Gemini Live realtime audio integration.
2. **Text — alternative mode**, powered by the existing text-based Gemini interview implementation.

The user must interact through EITHER voice OR text at any given time, not both simultaneously.

The **Living Career Canvas remains visible and active in both modes**, displaying actual career information extracted from the conversation.

The live transcript must be collapsed by default and only displayed when the user explicitly expands it.

This is an implementation task. Modify the existing application, test the result and commit the changes.

---

## 1. Non-negotiable preservation requirements

Before modifying code, read:
- `AGENTS.md`
- `docs/MASTER_SPEC.md`
- `docs/PROGRESS.md`
- Existing accessibility and design documentation
- The actual interview page and its dependencies

Inspect the existing Gemini Live and text interview implementations.

Preserve:
- Gemini Live streaming, microphone handling and playback
- Session lifecycle and interruption behaviour
- Existing Gemini text API integration
- Conversation history
- Career evidence extraction
- Candidate confirmation and editing
- Career Canvas functionality
- Accessibility preferences and persistence
- Keyboard and screen-reader support
- Existing API contracts
- Error recovery
- Navigation and downstream CV/job workflows

Do not replace working features with mocks.

Do not rewrite Gemini Live.

Do not modify unrelated pages.

---

## 2. Unified interview architecture

The page should have three main elements:

### A. Interview mode selector

Place a refined, accessible segmented control near the top of the interview stage:

**Voice | Text**

Default to Voice for users without a saved mode preference.

If the user has explicitly selected a communication mode during onboarding or in saved preferences, honour that choice instead.

The selector must:
- Have clear labels and selected states.
- Be keyboard-operable.
- Be accessible to screen readers.
- Preserve existing communication preferences.
- Never automatically start microphone recording.
- Never automatically request microphone permission.
- Never automatically open a Gemini Live connection simply because Voice is selected.

Selecting a mode changes the interview interface, not the candidate's underlying career profile.

### B. Active interview stage

Only one interaction interface is visible and active at a time.

Voice mode displays the realtime voice interface.

Text mode displays the text interview interface.

Do not display both interfaces stacked vertically.

Do not show a second, competing "Start interview" workflow beneath the voice interface.

### C. Living Career Canvas

Keep the existing Career Canvas visible alongside the interview on desktop.

It should remain active in both modes.

It must continue displaying real extracted information and preserve all existing confirmation, editing and review functionality.

Do not replace it with mock data.

---

## 3. Voice mode — primary experience

Voice is the visually prominent default.

Use the existing Gemini Live integration.

Design a spacious, premium conversation stage containing:

- Current interview question, when available
- Existing realtime voice visualisation
- Clear session state
- Start conversation control
- Mute/unmute, when supported
- Stop/end conversation control
- Accessible error and recovery messages
- Collapsible transcript

The voice stage should be the dominant visual element.

Use the existing Access visual language: warm ivory, near-black, electric violet and refined editorial typography.

### Voice states

Reflect actual system states:

- Ready
- Requesting permission
- Connecting
- Listening
- Candidate speaking, if detectable
- AI speaking, if detectable
- Interrupted, if supported
- Reconnecting
- Error
- Ended

Do not fabricate realtime activity.

### Starting voice

When Voice mode is selected but the session has not started:

Show a prominent **Start conversation** button.

Only request microphone permission and start Gemini Live after the user activates it.

### Active voice session

When connected:

Show the existing working microphone and session controls.

Display meaningful connection and recording status.

Preserve interruption, audio playback and error recovery.

### Ending voice

Ending the session must:
- Stop audio capture.
- Stop playback appropriately.
- Release existing audio resources.
- Preserve usable interview information.
- Keep the Career Canvas intact.
- Avoid duplicate or orphaned sessions.

---

## 4. Text mode — complete alternative

When Text is selected, replace the voice stage with the existing text interview interface.

Show:

- Current question
- Conversation context where needed
- Text answer field
- Send answer
- Skip question
- Clarify question
- End interview
- Loading, retry and error states

Reuse existing components and business logic.

Do not create a second text interview implementation.

Text mode must support the same career-discovery outcomes as Voice mode.

The Career Canvas must remain visible and continue working.

Text must not be visually treated as an inferior accessibility fallback.

---

## 5. Safe switching between modes

Switching between Voice and Text must be predictable and safe.

### Text → Voice

- Preserve confirmed career evidence.
- Preserve the existing text interview history.
- Do not start the microphone automatically.
- Show Start conversation.
- Use the existing supported session/context continuity mechanism.

### Voice → Text

If a voice session is active:
- Clearly inform the user that switching will stop the live voice session.
- Require confirmation before switching.
- Stop the session cleanly using the existing lifecycle methods.
- Preserve finalised transcript turns and extracted evidence.
- Keep the Career Canvas unchanged.
- Display the text interface.

Do not discard an answer still being processed without warning.

### Conversation continuity

Both modes must contribute to a shared career profile.

Where existing infrastructure supports it, preserve conversational context across modes.

If the two interview backends currently have separate histories, introduce the smallest safe shared, typed representation of finalised interview turns so future turns can use appropriate context.

Do not attempt to pass a live audio session directly into the text backend.

Avoid duplicate evidence extraction when a finalised turn has already been processed.

If complete cross-mode conversational continuity cannot be implemented safely, preserve all profile data and clearly explain any conversation restart rather than silently pretending continuity exists.

---

## 6. Live transcript — collapsed by default

The voice transcript should no longer occupy a large permanent section of the page.

Replace it with a compact disclosure control:

**View transcript (3 turns)**

When collapsed:
- Show only the disclosure control.
- Keep transcript collection functioning.
- Do not discard transcript data.
- Do not scroll the main page when new turns arrive.
- Update the turn count without distracting animation.

When expanded:
- Show the real transcript.
- Clearly distinguish AI and candidate turns.
- Display finalised and partial transcripts appropriately.
- Provide a contained scrollable region with a sensible maximum height.
- Allow users to review earlier messages.
- Avoid forced scrolling when the user is reading older turns.
- Include any existing transcript correction or review functionality.
- Provide an obvious Collapse transcript control.

Use an accessible disclosure pattern with `aria-expanded` and `aria-controls`, or equivalent accessible primitives.

The disclosure must work by keyboard.

Do not automatically expand the transcript when voice activity begins.

For text mode, preserve any necessary visible conversation context. Do not hide essential text interview questions or answers merely because the voice transcript is collapsed.

---

## 7. Career Canvas — preserve and emphasise

The existing Career Canvas is a strength of the application.

**Do not redesign its underlying functionality.**

Keep it prominent and visible on desktop.

Preserve:
- Real-time or near-real-time profile suggestions
- Confirmed/unconfirmed distinctions
- Candidate review and confirmation
- Editing
- Manual additions
- Existing evidence relationships
- Existing job/CV integration

Both Voice and Text must feed the same profile data pipeline.

### Voice evidence extraction

Inspect the existing implementation.

If voice transcript turns already feed career extraction, preserve that behaviour.

If voice currently operates as isolated practice, connect finalised candidate voice turns to the existing evidence-extraction pipeline.

Requirements:
- Use actual finalised candidate transcript data.
- Never extract from incomplete partial transcripts.
- Do not treat AI questions as candidate evidence.
- Avoid processing the same turn twice.
- Keep suggestions unconfirmed until the candidate reviews them.
- Never invent skills or experiences.
- Preserve existing sensitive-information screening.
- Handle transcription errors through existing correction/review mechanisms.

Do not redesign the extraction model or introduce a new backend unless necessary.

### Visual feedback

When real evidence is produced:
- Introduce the suggestion with a subtle animation.
- Briefly highlight new information.
- Preserve keyboard focus.
- Respect reduced-motion preferences.
- Do not animate fake progress or unsupported discoveries.

---

## 8. Layout redesign

### Desktop

Use a balanced two-column layout:

LEFT — approximately 60–65%:
- Interview heading
- Voice/Text selector
- Active interview stage
- Collapsible transcript

RIGHT — approximately 35–40%:
- Existing Living Career Canvas

The interview should be visually dominant while the Canvas remains clearly visible.

Avoid excessive empty margins and unnecessarily narrow content.

### Mobile

Use a responsive layout:

- Interview stage first
- Mode selector always accessible
- Career Canvas below or in an accessible panel
- Collapsible transcript within the interview stage
- No horizontal overflow
- No essential controls hidden behind hover

Ensure important career suggestions are discoverable without interrupting the conversation.

---

## 9. Accessibility requirements

Preserve all existing accessibility functionality.

Specifically verify:

- Keyboard navigation
- Screen-reader semantics
- High-contrast mode
- Large-text mode
- Reduced-motion mode
- Simple-language preferences
- Input-mode preference persistence
- Accessible status messages
- Focus management
- Microphone permission messaging
- Transcript disclosure controls
- Candidate confirmation controls

Do not automatically focus the microphone control after switching modes.

Do not announce every partial transcript update to screen readers.

Ensure all meaningful voice states have textual equivalents.

Never require speech.

Do not introduce time limits or unnecessary cognitive load.

---

## 10. Remove redundant UI

The current page contains separate voice and text sections stacked together.

Replace this with the unified mode-based design.

Remove redundant presentation elements such as:
- Duplicate interview headings
- Competing start buttons
- Duplicate session instructions
- Permanently expanded voice transcript
- Unnecessary explanatory paragraphs

However, do not remove the underlying functionality associated with these elements.

Retain privacy and consent information, but present it concisely and accessibly.

Do not remove important safety disclosures.

Do not move unrelated features such as PDF import unless necessary to make the interview layout coherent.

---

## 11. Verification and testing

Test the following scenarios:

1. Voice is selected by default when no preference exists.
2. A saved Text preference is honoured.
3. Selecting Voice does not request microphone permission.
4. Starting Voice initiates the existing Gemini Live flow.
5. Live audio input and output continue working.
6. Existing interruption behaviour remains functional.
7. Transcript is collapsed initially.
8. Transcript can be expanded and collapsed by keyboard.
9. Transcript collection continues while collapsed.
10. Career Canvas updates from valid voice evidence.
11. Career Canvas updates from text answers.
12. Evidence is not duplicated.
13. Voice → Text switching safely ends the voice session.
14. Text → Voice does not automatically start recording.
15. Confirmed profile data survives switching.
16. High contrast, large text and reduced motion still work.
17. Existing downstream CV and job features still work.
18. Mobile layout has no horizontal overflow.

Run lint, typecheck, existing tests and production build.

If actual microphone testing is unavailable, state that explicitly.

Fix all regressions introduced by this task.

---

## 12. Delivery

Update `docs/PROGRESS.md` and relevant architecture/accessibility documentation.

Document any changes to interview mode state, transcript handling or shared evidence extraction.

Commit the implementation with a descriptive message.

Do not push unless explicitly authorised.

In your final report, include:
- Files changed
- New interview interaction structure
- Voice/Text switching behaviour
- Transcript disclosure behaviour
- Career Canvas integration
- Accessibility checks
- Test/build results
- Any limitations
- Commit hash

**Do not stop at a plan. Implement the changes in the existing application.**

## FINAL ACCEPTANCE CRITERIA

A user opens the interview page and sees one clear, welcoming interaction:

**Voice | Text**

Voice is the default unless they have chosen otherwise.

Only the selected interview interface is shown.

The transcript is hidden until expanded.

The Living Career Canvas stays visible and responds to real conversation evidence.

Both modes support the same career-discovery process.

All existing accessibility preferences and application functionality remain intact.