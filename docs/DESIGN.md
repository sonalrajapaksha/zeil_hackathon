# Design system — Boldly Human

Inspired by ZEIL's energetic purple and people-first brand but NOT an official ZEIL product or identity. Distinct editorial futurism; premium warm, approachable, high-legibility aesthetic.

Tokens: violet #8052FF, ivory #F7F5F0, ink #17151D, lilac #C2AFFC, lime #D8FF74 (success only). Check WCAG contrast and adjust actual text pairings; don't blindly use accents for small text.

Typography: Space Grotesk for display if available, accessible system sans/Inter for body; fallback fonts must work offline. Headline oversized; body >=16px, line height ~1.5.

Primary layout: large editorial welcome; accessible conversation workspace where Living Career Canvas grows; structured application preview. Desktop split view (conversation ~55%, canvas ~45%); mobile stacked tabs. Reserve space for loading to prevent layout shift.

Interactions: 180–250ms transitions respecting reduced motion; one striking progress transformation; obvious focus rings; generous 44px touch targets; keyboard-first navigation.

Do not: use generic nested cards, fake animations, excessive gradients, unreadable lilac-on-purple copy, dark-pattern disclosures, meaningless match percentages, tiny controls, interface that only works with voice.

Impeccable workflow: context/init once; run bounded desktop+mobile critique and a single fix pass. Design quality is NOT an excuse to neglect ARIA, keyboard semantics and user confirmation.
