# Accessibility requirements and manual test protocol

Implement semantic HTML, skip link, keyboard focus order, visible outlines, explicit labels, error associations, descriptive button names, no hover-only interaction. Conversation updates: polite live region with concise announcements (avoid announcing entire rewritten canvas). Support 200% browser zoom, viewport 320px, large text, high contrast, `prefers-reduced-motion`; buttons minimum ~44x44px where practical.

Voice is optional, never required. Ensure inputs are available without speech. Export meaningful text, not image-only CV. Document has sensible heading structure. Do not ask for diagnosis; do not auto-infer accessibility preferences from candidate chat. Never auto-disclose medical details in application materials.

Test: tab across onboarding → input → send → review proposal → edit → approve → choose job → generate → edit → download; Shift+Tab; Enter/Space on buttons; Escape where relevant; screen reader sample using VoiceOver; focus restored after modal close; error retry. Test 320px, 1280px, 200% zoom, reduced-motion setting.

Aim WCAG 2.2 AA; do not claim certified compliance based solely on automated scans.
