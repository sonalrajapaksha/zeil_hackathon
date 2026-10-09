# ACCESS — MASTER VOICE-FIRST ANIMATION & INTERACTION REDESIGN

## MISSION

You are an elite creative engineering team responsible for transforming Access into a visually exceptional, accessibility-first, **realtime voice-native career companion**.

Access already has a functioning realtime audio interview powered by Gemini Live.

**This is a foundational fact, not an optional feature.**

Your job is to redesign the entire user experience around that working realtime conversation.

The intended result is a beautiful, responsive and emotionally engaging application in which users speak naturally with an AI career interviewer while their experiences, skills and opportunities become visible.

Think:

**A living conversation that becomes a living career profile.**

This is a production frontend redesign, not a mockup.

You must implement the changes in the existing repository.

---

# 1. ABSOLUTE NON-NEGOTIABLES

## 1.1 Gemini Live must remain fully functional

The realtime audio implementation already works.

DO NOT replace, rebuild, mock or simplify it.

Preserve its existing:

- Gemini Live API integration
- Audio capture and playback
- Streaming transport
- Session establishment
- Session lifecycle
- Authentication and token handling
- Microphone permission handling
- Audio encoding and decoding
- Voice activity detection, if implemented
- Interruption and barge-in behaviour
- Reconnection and recovery logic
- Transcript handling, if implemented
- Interview state management
- Error handling
- Existing conversation-to-profile integration

Inspect the actual implementation to determine its architecture.

Do not assume WebSockets, WebRTC, AudioWorklets or any specific transport unless confirmed by the code.

**The new UI must wrap and respond to the existing realtime system. The realtime system must not be rewritten to accommodate the UI.**

## 1.2 Preserve every existing feature

Preserve all currently implemented functionality, including:

- Landing page
- Onboarding
- Voice interview
- Text interview
- Communication preferences
- Accessibility settings
- Living Career Canvas
- Experience and skill extraction
- Evidence confirmation
- Job matching
- CV and cover-letter generation
- Editing and exports
- Navigation
- Session state and persistence
- API contracts
- Loading and error handling

Only preserve features that actually exist; do not invent missing functionality.

Do not introduce fake buttons, placeholder APIs or simulated functionality into real user flows.

## 1.3 Accessibility is a frozen compatibility contract

Preserve existing:

- Reduced-motion preference
- High-contrast mode
- Large-text mode
- Simple-language preference
- Keyboard navigation
- Screen-reader support
- Text-only interviewing
- Accessible form controls
- Focus management
- Preference persistence

Never require users to speak.

Never automatically activate their microphone.

Voice-first means **voice is the signature experience**, not that text becomes inferior.

## 1.4 Do not break the working application

Before making changes:

- Inspect Git status.
- Identify uncommitted work.
- Establish the current functional baseline.
- Run available checks.
- Identify the current Gemini Live component boundaries.
- Identify how live audio states reach the UI.

Preserve unrelated changes.

If an animation requires a risky backend refactor, choose a simpler animation.

---

# 2. CREATIVE VISION

## Product identity: BOLDLY HUMAN

Access should feel like a beautifully crafted conversational environment, not a chatbot, recruitment portal or traditional form.

The experience should communicate:

**Your experiences matter. Let's discover what they mean.**

Design principles:

1. Conversation before forms.
2. Listening before categorising.
3. Discovery before documentation.
4. Accessibility without compromise.
5. Motion that reflects real system state.
6. Calm, confident and emotionally intelligent interactions.

## Visual language

Use the established palette:

- Electric violet: `#8052FF`
- Warm ivory: `#F7F5F0`
- Near-black: `#17151D`
- Soft lilac: `#C2AFFC`
- Electric lime: `#D8FF74`

Typography:
- Space Grotesk
- Inter

Use editorial typography, elegant composition, restrained visual depth and refined microinteractions.

Avoid generic AI SaaS visuals, glassmorphism, excessive gradients, decorative particle systems and unnecessary 3D.

The application should look exceptional even with all motion disabled.

---

# 3. LANDING PAGE — CINEMATIC VOICE-FIRST HERO

The landing page must make Access's realtime conversational nature immediately obvious.

## 3.1 Headline

Primary headline:

**Your experience. Your future.**

Create a sophisticated entrance:

- First line reveals upward.
- Second line follows with a subtle stagger.
- Supporting copy appears.
- CTA enters.
- Interactive demonstration becomes visible.

Complete the headline entrance in approximately 900 milliseconds.

Avoid layout shifts.

Respect reduced-motion settings.

## 3.2 Primary CTA

Make the working voice experience prominent.

Primary CTA:

**Start a conversation**

Supporting label:

"Talk naturally with Access. Discover the skills behind your experiences."

Secondary CTA:

**I'd rather type**

Both routes must connect to their actual existing functionality.

Do not skip existing onboarding, permissions or consent.

Do not request microphone access until the user explicitly initiates voice mode.

Do not automatically start a session on page load.

## 3.3 Hero visual

Create a visually stunning representation of Access's core experience.

The hero should demonstrate:

- A conversational exchange
- A voice-responsive visual motif
- Experiences becoming skill cards
- Skill cards connecting to opportunities

Use a clearly labelled fictional example for the landing-page preview.

Do not open a real Gemini Live session just to animate the landing page.

The hero should have a replay/pause mechanism and a static reduced-motion alternative.

## 3.4 Responsive design

Desktop:
- Oversized editorial headline
- Strong CTA hierarchy
- Large animated demonstration
- Spacious, intentional composition

Mobile:
- Readable headline
- Immediate CTA access
- Compact demonstration
- No horizontal overflow
- No hover-dependent information

---

# 4. THE LIVE INTERVIEW — PRIMARY DESIGN CENTREPIECE

**This is the highest-priority functional redesign target.**

The existing Gemini Live interview should become the most visually memorable and intuitive part of Access.

## 4.1 Conversation-first layout

Redesign the interview screen around three visual regions:

### A. Conversation stage

The dominant region.

Contains:
- Current AI question
- Realtime voice visualisation
- Listening and speaking state
- Primary microphone/session controls
- Clear status labels

This should feel spacious, calm and human.

### B. Live transcript

A readable record of the conversation, using the existing transcript data where available.

Requirements:
- Clearly distinguish candidate and AI turns.
- Preserve actual streaming transcript behaviour.
- Handle partial versus final transcripts accurately.
- Avoid excessive auto-scrolling.
- Allow users to review earlier turns.
- Preserve screen-reader accessibility.

### C. Living Career Canvas

A persistent or easily accessible region showing career evidence discovered during the conversation.

When the actual application confirms new information, show it appearing naturally.

Do not fabricate real-time extraction events.

If extraction only occurs at the end of a turn, animate at that moment.

If extraction only occurs after the interview, preserve that timing and design an appropriate transition.

## 4.2 Suggested desktop composition

Create a visually balanced experience:

- Main conversation stage: approximately 60–65% width
- Living Career Canvas: approximately 35–40% width
- Transcript: integrated into the conversation region or accessible through a clear panel

Adapt these proportions to actual content.

Do not force a fixed split if the existing application requires a different structure.

## 4.3 Suggested mobile composition

Mobile should prioritise:

1. Current question
2. Realtime voice state
3. Session controls
4. Transcript access
5. Career Canvas access

Use tabs, sheets or progressive disclosure where appropriate.

Do not hide important error states or microphone controls.

Do not make the interface dependent on hover.

---

# 5. REALTIME AUDIO VISUALISATION

Create a signature voice visualisation that responds to the **actual existing Gemini Live session state**.

The visualisation should feel premium, organic and controlled.

Avoid generic bouncing equaliser bars unless they genuinely fit the design.

Explore a restrained waveform, flowing signal line or concentric listening motif.

## 5.1 Real state mapping

Map the existing system's actual states to the UI.

Potential states include:

- Idle
- Requesting microphone permission
- Connecting
- Listening
- Candidate speaking
- AI thinking
- AI speaking
- Interrupted
- Reconnecting
- Error
- Ended

Only use states supported by the current implementation.

Do not infer that the AI is thinking merely because audio is silent.

## 5.2 Audio reactivity

If actual audio-level data is already available, use it to drive the visualisation.

If it is not available, determine whether a small, isolated, low-risk audio-level observer can be added without changing the streaming pipeline.

Requirements:

- Never alter or delay outgoing audio.
- Never interfere with playback.
- Never change the audio encoding.
- Never introduce echo or feedback.
- Never interrupt existing barge-in behaviour.
- Never block audio processing on React rendering.
- Throttle visual updates appropriately.
- Stop visual activity when the session stops.
- Clean up observers and animation frames.

If safe audio-level observation is not possible, use session-state animation instead of fake amplitude data.

## 5.3 Motion behaviour

Idle:
- Static, elegant visual.

Listening:
- Subtle active state.

Candidate speaking:
- Actual amplitude-responsive motion where available.

AI speaking:
- Distinct visual treatment driven by real playback state.

Interrupted:
- Immediate, understandable transition.

Reconnecting:
- Clear status with restrained feedback.

Error:
- Static, readable recovery interface.

Every state must also have a textual label.

Never rely on colour or motion alone.

---

# 6. THE LIVING CAREER CANVAS AS A LIVE COMPANION

The Career Canvas should feel connected to the conversation rather than like a separate dashboard.

## 6.1 Progressive discovery

When the real system produces a new experience, skill or evidence item:

- Animate the card into place.
- Briefly highlight it.
- Smoothly reposition existing cards.
- Preserve the actual data and confirmation state.
- Avoid unexpected scroll jumps.
- Preserve keyboard focus.

## 6.2 Evidence-to-opportunity connections

Use a signature visual motif:

**What you did → What it demonstrates → Where it applies**

Example:

Experience:
"Helped library visitors use computers"

Skill:
"Customer assistance"

Job requirement:
"Support customers with technical questions"

Create elegant SVG connectors or linked highlighting where the existing data supports these relationships.

Connections must reflect actual application data.

Provide equivalent text descriptions.

Do not imply a candidate's claims have been independently verified.

## 6.3 Candidate control

Preserve all existing ability to:

- Confirm suggestions
- Reject suggestions
- Edit experiences
- Correct inaccuracies
- Review generated claims

Animations must never delay or obscure these actions.

---

# 7. ACCESSIBILITY-FIRST VOICE EXPERIENCE

Voice-first must improve access without excluding users.

## 7.1 Equal text experience

Text mode must remain fully functional and equally capable.

Both modes must lead to the same core career outcomes.

Do not remove or downgrade text interviewing.

Allow switching between modes using existing supported behaviour.

If seamless mid-session switching is not currently supported, do not invent it. Present the actual available transition clearly.

## 7.2 Microphone consent and privacy

- Never record automatically.
- Request permission only after explicit user action.
- Show clear recording state.
- Make stopping straightforward.
- Do not introduce background recording.
- Preserve existing audio-data handling and privacy behaviour.
- Do not imply audio is stored or deleted differently from the actual implementation.

## 7.3 Captions and transcripts

Where transcripts exist:

- Keep them readable.
- Distinguish speakers.
- Avoid announcing every partial token to screen readers.
- Announce important state changes appropriately.
- Allow review without disrupting the session.

Do not fabricate transcripts where the backend does not supply them.

## 7.4 Reduced motion

Respect:
- System reduced-motion setting
- Existing Access reduced-motion setting

Disable:
- Cinematic entrances
- Animated waveform movement
- Connection-line drawing
- Decorative autoplay
- Unnecessary card movement

Replace them with clear static state changes.

## 7.5 High contrast and large text

Preserve existing controls and persistence.

Ensure the new voice stage, transcripts and Canvas remain readable in both modes.

Support zoom and text scaling without clipping.

## 7.6 Cognitive accessibility

- One obvious primary action at a time
- Clear, plain-language status labels
- Predictable navigation
- No time pressure introduced by animation
- Recoverable errors
- Visible stop controls
- Calm visual feedback

## 7.7 Keyboard and screen readers

- All controls keyboard-operable
- Visible focus indicators
- Stable focus during realtime updates
- Semantic controls and labels
- Accessible status announcements
- No screen-reader flooding from animation or streaming text

---

# 8. APPLICATION-WIDE MOTION DESIGN

Introduce a coherent motion system.

Suggested timing:

- Hover and press: 120–180 ms
- Card reveal: 200–350 ms
- Layout transition: 250–400 ms
- Page transition: 200–350 ms
- Hero reveal: under 900 ms

Use:
- CSS for simple interactions
- Motion for React where coordinated motion is necessary
- Lightweight SVG for meaningful connections

Create reusable primitives.

Avoid scattered animation constants and unnecessary dependencies.

## Microinteractions

Improve:

- Buttons
- Cards
- Navigation
- Inputs
- Preference toggles
- Job-match selection
- Document-generation loading
- CV and cover-letter editing
- Export feedback

Only animate real application states.

Do not create artificial delays.

---

# 9. PERFORMANCE AND ENGINEERING CONSTRAINTS

Realtime audio performance is more important than animation smoothness.

Do not compromise the audio experience to achieve visual effects.

Requirements:

- Avoid excessive React rerenders.
- Keep high-frequency audio visualisation out of global application state.
- Use requestAnimationFrame appropriately.
- Throttle audio visual updates.
- Avoid expensive layout measurements.
- Avoid animation-related memory leaks.
- Clean up timers, observers and event listeners.
- Preserve stable audio references and session lifecycle.
- Prevent hydration mismatches.
- Maintain responsive controls during streaming.
- Avoid unnecessary network requests.
- Preserve existing API credentials and security boundaries.

Never route raw realtime audio through unnecessary frontend state updates.

Prefer a lightweight visual observer over changes to the existing audio pipeline.

---

# 10. IMPLEMENTATION ORDER

Work autonomously in this order.

## P0 — Audit and preservation
- Inspect the repository.
- Identify existing Gemini Live architecture.
- Establish functional baseline.
- Establish accessibility baseline.
- Identify safe UI integration points.

## P1 — Live interview redesign
- Redesign the conversation stage.
- Implement genuine state-responsive voice visuals.
- Improve transcript presentation.
- Integrate Career Canvas.
- Preserve realtime behaviour.

## P2 — Cinematic landing page
- Editorial headline reveal.
- Voice-forward CTA.
- Animated example conversation.
- Animated example Career Canvas.
- Responsive composition.

## P3 — Living Career Canvas
- Progressive card entrances.
- Evidence relationship visuals.
- Confirmation and editing feedback.

## P4 — Application-wide polish
- Navigation.
- Buttons.
- Inputs.
- Cards.
- Loading states.
- Document workflows.

## P5 — Verification
- Functional regression tests.
- Realtime voice tests.
- Accessibility checks.
- Responsive visual QA.
- Build and lint.
- Documentation.
- Git commit.

Prioritise a flawless working voice interview over decorative enhancements.

---

# 11. REALTIME REGRESSION TESTS

Verify the existing voice functionality before and after the redesign.

Test:

1. Microphone permission granted.
2. Microphone permission denied.
3. Successful session connection.
4. Candidate speaks and AI responds.
5. AI audio playback works.
6. Candidate interrupts AI, if supported.
7. Session ends cleanly.
8. Audio resources are released.
9. Reconnection or error recovery works as previously implemented.
10. Transcript updates correctly, if supported.
11. Career Canvas updates correctly.
12. Switching to text works according to existing behaviour.
13. No duplicate sessions are created.
14. No unexpected recording begins.
15. Animations do not degrade audio responsiveness.

Use automated tests where possible.

Perform actual microphone/browser tests if the environment supports them.

Do not claim realtime audio was verified if only mocked tests were run.

---

# 12. ACCESSIBILITY REGRESSION TESTS

Verify:

- Reduced motion
- High contrast
- Large text
- Simple-language preferences
- Keyboard-only navigation
- Screen-reader semantics
- Focus stability
- Voice controls
- Text mode
- Error recovery
- Preference persistence

Preserve all previously working accessibility behaviour.

---

# 13. VISUAL QA

Inspect:

- 1440 px desktop
- 1024 px laptop
- 768 px tablet
- 390 px mobile
- 320 px small mobile

Check the live interview in all relevant states, not just idle.

Check the Career Canvas with both empty and populated content.

Check the transcript with long messages.

Check accessibility settings individually and in combination.

Use browser screenshots where available.

Do not claim visual inspection that was not performed.

---

# 14. DELIVERY

Run:
- Lint
- Typecheck
- Existing tests
- Production build

Fix regressions introduced by this task.

Update:
- `docs/PROGRESS.md`
- Relevant design documentation
- Accessibility documentation where necessary

Commit changes with a descriptive message.

Do not push unless explicitly authorised.

## Final report

Include:

1. Live interview redesign summary
2. Landing-page redesign summary
3. Audio visualisation implementation
4. Career Canvas improvements
5. Accessibility preservation results
6. Functional regression results
7. Tests and build status
8. Any unverified functionality
9. Commit hash

---

# FINAL QUALITY STANDARD

The live Gemini conversation is the centre of Access.

The user should feel that Access is genuinely listening and responding.

The Career Canvas should make their emerging skills visible.

The landing page should preview that experience beautifully.

The interface should be cinematic without becoming distracting.

Text users should receive the same quality of experience.

Accessibility must remain fully functional.

**Do not replace, mock, rewrite or compromise the working Gemini Live system.**

Build the best possible visual experience around the existing realtime implementation.

Implement, test, document and commit the redesign. Do not stop at planning.