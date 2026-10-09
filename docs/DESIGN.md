# Design system — Boldly Human

Inspired by ZEIL's energetic purple and people-first brand but NOT an official ZEIL product or identity. Distinct editorial futurism; premium warm, approachable, high-legibility aesthetic.

Product position: an accessibility-first AI career companion designed with people who face accessibility barriers in mind and available to everyone. Keep this editorial visual identity; accessibility is expressed through real user controls and robust interaction, not a separate or restricted mode.

Tokens: violet #8052FF, ivory #F7F5F0, ink #17151D, lilac #C2AFFC, lime #D8FF74 (success only). Check WCAG contrast and adjust actual text pairings; don't blindly use accents for small text.

Typography: Space Grotesk for display if available, accessible system sans/Inter for body; fallback fonts must work offline. Headline oversized; body >=16px, line height ~1.5.

Primary layout: large editorial welcome; accessible conversation workspace where Living Career Canvas grows; structured application preview. Desktop split view (conversation ~62%, canvas ~38%, easing to 60/40 on laptops); mobile uses the existing conversation/canvas panel controls. Reserve space for loading to prevent layout shift.

Interactions: 180–250ms transitions respecting reduced motion; one striking progress transformation; obvious focus rings; generous 44px touch targets; keyboard-first navigation.

Expose simple/standard question wording and high-contrast, large-text, and reduced-motion controls as clear, functional preferences. Present voice first through a consent panel; keep text as the complete baseline interaction and an explicit welcome choice. Opening the voice panel must not start a microphone or provider request. Labels, focus, errors, and screen-reader announcements belong to the visual system as much as color and type.

Do not: use generic nested cards, fake animations, excessive gradients, unreadable lilac-on-purple copy, dark-pattern disclosures, meaningless match percentages, tiny controls, interface that only works with voice.

Impeccable workflow: context/init once; run bounded desktop+mobile critique and a single fix pass. Design quality is NOT an excuse to neglect ARIA, keyboard semantics and user confirmation.

## Voice-first components and motion

The welcome pairs an editorial headline with `HeroPreview`, a visibly fictional, CSS-only conversation and discovery example. Its arrows connect written example labels (“What you did → What it demonstrates → Where it applies”); they are not realtime extraction or job matching. Pause/play and replay are real buttons. Both system and Access reduced-motion settings render the example statically and hide its motion controls.

The live stage uses concentric CSS rings and a decorative SVG signal with a readable state label. States come from the existing session lifecycle, playback sources, mute, interruption and errors. Ring motion represents state; the signal line observes actual microphone samples through a passive analyser branch at up to 20 updates per second. It does not infer candidate speech or model thinking. Idle, mute and errors are static; listening, connection and playback have distinct restrained treatments. Voice body copy is 16px; the current Gemini transcript text is prominent. Native transcript disclosure and a bounded scroll region keep review within the conversation. An empty text history takes no reserved chat space.

Actual profile cards reveal on mount with CSS and show confirmation through a static success treatment. Reveals can repeat when the panel remounts; they do not imply new provider events. Evidence remains visible and editable, and approval/removal controls stay available without animation delays. Completed candidate voice answers create pending profile suggestions with source evidence. Approval remains explicit; no automatic opportunity mapping is implied.

Use shared CSS motion tokens for short interaction and discovery transitions. Animate real UI state without artificial delays. The isolated microphone observer never changes the streaming or speaker path. Reduced motion disables animations, transitions and smooth scrolling; text labels and controls remain available. Keep the pinned Boldly Human palette and Space Grotesk/Inter pairing.

Microphone waveform: connected/listening/playback states fill the stage green (#237640) with white text and waveform, or darker green (#14532d) in high contrast, errors red (#b4232c), and muted/idle states remain neutral/violet. Labels communicate state independently of colour. Muting, stopping and reduced motion return the signal line to a static baseline.

The interview workspace now presents a two-choice Voice/Text segmented radio control above one active interface. Voice remains the default when no saved mode exists. The interview and Career Canvas use the established approximately 62/38 desktop split; mobile keeps the existing panel switch. The Live transcript is a compact, collapsed disclosure with speaker and partial/final labels, bounded scroll, and no forced scroll or announcement of streamed fragments. Voice/Text switching preserves the existing editorial palette, focus ring, high-contrast, large-text and reduced-motion behavior.
