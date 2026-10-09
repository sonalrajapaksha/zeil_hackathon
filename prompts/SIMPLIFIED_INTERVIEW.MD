# ACCESS — MASTER MINIMALIST, ACCESSIBILITY-FIRST INTERVIEW REDESIGN

## Mission

You are a senior product designer, accessibility engineer, interaction designer, and Next.js frontend engineer.

Redesign the existing Access interview page into an exceptionally intuitive, editorial, futuristic, and accessibility-first experience.

The new interface should feel effortless, calm, human, and premium.

**Design philosophy: Radical simplicity through progressive disclosure.**

Access already has a functioning Gemini Live realtime voice interview, a text interview, and a Living Career Canvas.

Your task is to redesign how these features are presented and accessed, NOT to rebuild them.

The objective is to reduce cognitive load, visual clutter, and competing actions while preserving the complete functionality of the existing application.

Implement the redesign in the repository. Do not stop at a design proposal.

---

# 1. NON-NEGOTIABLE REQUIREMENTS

## 1.1 Preserve all existing functionality

Before making changes, inspect the existing implementation.

Preserve:
- Gemini Live realtime audio streaming
- Microphone capture and playback
- Session lifecycle
- Interruption and recovery behaviour
- Voice transcripts
- Gemini text interviewing
- Career evidence extraction
- Living Career Canvas
- Candidate confirmation and editing
- Existing onboarding
- Accessibility preferences
- Existing API contracts
- Career profile persistence
- Job matching
- CV and cover letter generation
- Document exports
- Navigation and error handling

Do not rewrite the Gemini Live backend.

Do not replace actual AI behaviour with mocks.

Do not remove existing capabilities to achieve a simpler appearance.

## 1.2 Accessibility is mandatory

Preserve and respect:
- Reduced-motion settings
- High-contrast settings
- Large-text settings
- Simple-language preferences
- Keyboard navigation
- Screen-reader support
- Existing preference persistence
- Accessible error messages
- Candidate control over information

Do not hide critical controls.

Do not introduce icon-only interactions without accessible labels.

Never require users to speak.

Never automatically start microphone recording.

---

# 2. REPOSITORY AUDIT

Read:
- `AGENTS.md`
- `docs/MASTER_SPEC.md`
- `docs/PROGRESS.md`
- Existing design documentation
- Existing accessibility documentation
- Existing interview page and component implementations

Inspect the actual Gemini Live integration and text interview architecture.

Identify:
- Current voice session states
- Current text interview states
- Existing transcript data flow
- Career Canvas update mechanism
- Existing mode preferences
- Current responsive layout
- Existing accessibility controls

Establish a functional baseline before modifying components.

Preserve uncommitted work.

---

# 3. CORE UX PRINCIPLE

The user should never feel like they are operating an AI system.

They should feel like they are having a natural conversation.

The default interview screen should answer only three questions:

1. What is Access asking me?
2. How do I respond?
3. What has Access discovered about my experiences?

Everything else should be secondary and accessible on demand.

Avoid displaying every feature simultaneously.

Use progressive disclosure, not feature removal.

---

# 4. UNIFIED VOICE / TEXT INTERACTION

The interview must have exactly two mutually exclusive modes:

**Speak | Type**

Voice is the default unless the user has previously selected Text in their communication preferences.

Only one interview interface is visible and active at a time.

Do not stack voice and text interviews vertically.

Do not display competing Start Interview and Start Voice buttons.

## Voice mode

Use the existing working Gemini Live integration.

The main stage should contain:
- Current question
- Elegant audio visualisation
- Clear listening/speaking status
- Start conversation
- Mute/unmute when supported
- Stop/end conversation
- A clearly accessible switch to Type

The user must explicitly start recording.

Do not request microphone permission when the page loads.

Do not automatically connect simply because Speak is selected.

## Text mode

Use the existing Gemini text interview.

Show:
- Current question
- Text input
- Send answer
- Skip/clarify controls
- End interview
- Loading and error states

Text mode must have equal functionality and quality.

Both modes should contribute to the same career profile.

## Switching modes

Switching must preserve existing candidate data.

When leaving an active voice session:
- Confirm that switching will stop the current voice session.
- Stop the session cleanly.
- Preserve finalised transcript information.
- Preserve the Career Canvas.
- Avoid duplicate extraction.

When switching into voice:
- Never activate the microphone automatically.

Preserve conversational continuity where supported. Do not fake continuity where it is not supported.

---

# 5. MINIMALIST INTERVIEW STAGE

Create a beautiful, spacious conversation stage.

Suggested hierarchy:

Small editorial label:
**YOUR CONVERSATION**

Large heading:
**Every experience matters.**

Supporting line:
"Take your time. There's no right or wrong answer."

Then:

**Speak | Type**

Then the current question, with the active response interface.

Use large, highly readable typography.

The current question should be the dominant content.

The interface should feel like an editorial page, not a dashboard.

Avoid excessive borders, nested cards, dense toolbars and unnecessary explanatory text.

Keep the primary action visually obvious.

Use refined typography, warm ivory surfaces, near-black text and restrained violet accents.

---

# 6. CAREER CANVAS — COMPACT LIVE COMPANION

The existing Career Canvas is a core differentiator.

Do not remove it.

Do not alter its underlying extraction, confirmation, editing or persistence behaviour.

Instead, create a compact presentation by default.

## Desktop

Display a small but visible Career Canvas companion beside the interview.

It should show:
- Number of experiences discovered
- Number of suggested skills
- Number of items awaiting review
- Most recently discovered evidence or skill
- A clear **View career profile** action

When new evidence arrives:
- Update the summary using real application data.
- Briefly highlight the new item.
- Respect reduced-motion preferences.
- Do not interrupt the conversation.

Users must be able to expand the Canvas to view the full existing interface.

## Mobile

Display a compact summary such as:

**Your career profile — 3 skills discovered**

Provide a clearly labelled action to expand it.

Do not allow the Canvas to dominate the limited mobile viewport.

## Expanded Canvas

Preserve all existing features:
- Experience cards
- Skill suggestions
- Evidence confirmation
- Editing
- Manual additions
- Review actions
- Existing job/CV integration

Do not hide important pending confirmation requests indefinitely.

Provide a visible indication when review is needed.

Do not automatically open the Canvas during a live conversation.

---

# 7. TRANSCRIPT — HIDDEN BY DEFAULT

The live voice transcript should be collapsed initially.

Use a simple disclosure control:

**View transcript (3 turns)**

When collapsed:
- Show the disclosure control and turn count.
- Continue collecting transcript events.
- Preserve all data.
- Do not force page scrolling.
- Do not show the full transcript underneath the voice stage.

When expanded:
- Display the real transcript.
- Distinguish candidate and AI turns.
- Provide a scrollable, readable panel.
- Preserve any existing review/correction functionality.
- Allow users to collapse it again.
- Avoid auto-scrolling if the user is reading earlier turns.

Use accessible disclosure semantics.

The transcript should remain expanded if the user chooses to keep it open.

Do not automatically collapse it after new messages.

Do not automatically expand it when a voice session begins.

Text mode must continue showing the conversation context necessary for typing and understanding the interview.

---

# 8. SECONDARY FEATURES — PROGRESSIVE DISCLOSURE

Remove secondary actions from the primary conversation stage.

These include, where implemented:
- PDF import
- Manual profile additions
- Detailed skill editing
- Full transcript
- Advanced audio settings
- Job role selection
- Detailed evidence review

Do not delete these features.

Move them into clearly labelled, accessible areas such as:

- View career profile
- Review transcript
- More options
- Import existing CV

Do not place critical safety, recording, stop, error or accessibility controls behind a generic More menu.

Do not create deeply nested menus.

Important secondary features should remain reachable within one or two actions.

---

# 9. EDITORIAL AND FUTURISTIC DESIGN

Preserve the Access visual identity:

- Electric violet: #8052FF
- Warm ivory: #F7F5F0
- Near-black: #17151D
- Soft lilac: #C2AFFC
- Electric lime: #D8FF74

Use expressive typography, intentional whitespace and subtle motion.

The aesthetic should feel:
- Editorial
- Human
- Sophisticated
- Futuristic
- Calm
- Accessible

Avoid:
- Generic SaaS dashboards
- Excessive cards
- Heavy gradients
- Decorative particles
- Gratuitous glassmorphism
- Tiny text
- Constant movement
- Excessive visual controls

The design should remain beautiful with animations disabled.

---

# 10. MOTION AND MICROINTERACTIONS

Use motion only to communicate meaningful state changes.

Examples:
- Current question transitions
- Voice state changes
- New career evidence discovered
- Canvas expansion
- Transcript expansion
- Mode switching

Keep animations brief and restrained.

Suggested durations:
- Hover/press: 120–180 ms
- Content reveal: 180–300 ms
- Panel expansion: 200–350 ms

Respect both system and in-app reduced-motion preferences.

Do not animate layout in ways that interfere with focus or reading.

Never fake audio amplitude.

Never let animation affect Gemini Live audio performance.

---

# 11. RESPONSIVE DESIGN

Desktop:
- Spacious interview stage
- Compact persistent Career Canvas companion
- Transcript hidden unless requested
- No excessive unused width

Mobile:
- Conversation stage first
- Compact career summary
- Accessible expandable panels
- Large touch targets
- No horizontal overflow
- No hover-dependent actions

Test at:
- 1440 px
- 1024 px
- 768 px
- 390 px
- 320 px

Ensure large-text settings do not break layouts.

---

# 12. ACCESSIBILITY QUALITY GATES

Verify:
- Keyboard-only operation
- Screen-reader semantics
- Focus visibility
- Focus preservation during mode changes
- Accessible disclosure panels
- Reduced-motion support
- High-contrast support
- Large-text support
- Simple-language preferences
- Recording status clarity
- Microphone permission handling
- Text mode availability
- Error recovery
- Preference persistence

Accessibility must be tested, not merely asserted.

If the environment does not support a particular test, report that limitation.

---

# 13. FUNCTIONAL REGRESSION TESTS

Verify:

1. Voice is the default when no preference exists.
2. Saved text preference is honoured.
3. Only one interview mode is displayed.
4. Microphone permission is requested only after user action.
5. Gemini Live audio works as before.
6. Audio interruption and session ending still work.
7. Transcript remains collapsed by default.
8. Transcript can be expanded and collapsed.
9. Career Canvas updates from real conversation data.
10. Career Canvas editing and confirmation still work.
11. Text interview remains fully functional.
12. Switching modes preserves profile information.
13. No duplicate evidence extraction occurs.
14. Accessibility settings continue working.
15. Downstream job and CV functionality remains intact.

Run available lint, typecheck, tests and production build.

Fix regressions introduced by the redesign.

---

# 14. IMPLEMENTATION ORDER

Implement in this order:

1. Audit existing functionality and establish baseline.
2. Implement mutually exclusive Speak/Type modes.
3. Redesign the conversation stage.
4. Collapse the transcript by default.
5. Create compact/expandable Career Canvas presentation.
6. Reorganise secondary actions.
7. Add purposeful animations.
8. Test accessibility and functionality.
9. Perform responsive visual QA.
10. Update documentation and commit.

Do not stop after planning.

---

# 15. DELIVERY

Update:
- docs/PROGRESS.md
- Relevant design documentation
- Accessibility documentation if implementation details changed

Commit the completed changes.

Do not push without explicit authorisation.

Final report:
- What changed
- What functionality was preserved
- Voice/Text switching behaviour
- Career Canvas behaviour
- Transcript behaviour
- Accessibility test results
- Build/test results
- Known limitations
- Commit hash

---

# FINAL ACCEPTANCE CRITERIA

When a user opens the interview page:

1. They see a welcoming question.
2. Speak is the default unless they previously chose Type.
3. They see one clear way to respond.
4. The live transcript is hidden unless requested.
5. Their Career Canvas remains available and updates from real evidence.
6. Secondary features are accessible without cluttering the conversation.
7. Existing accessibility preferences still work.
8. Existing Gemini Live functionality is preserved.
9. The interface feels calm, editorial and exceptionally easy to use.

**The application should feel simpler without becoming less capable.**

Implement this redesign fully in the existing codebase, verify it, document it and commit it.