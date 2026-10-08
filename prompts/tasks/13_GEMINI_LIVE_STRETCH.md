# Task 13 — OPTIONAL Gemini Live speech challenge (+15)

Only attempt after public baseline and bonus +50 target route or if owner explicitly prioritises live audio. Read docs/LIVE_VS_INTERVIEW.md and BONUS_CHALLENGES.md.

Implement genuine **Gemini Live API** bidirectional microphone streaming and model audio responses only as a dedicated optional stretch mode. The complete text interaction remains the baseline and must still support keyboard navigation, screen-reader announcements, access preferences, errors, skip, and clarification. Get explicit microphone permission; include stop/mute, visible status, cleanup, safe ephemeral credentials or server proxy, and recoverable connection errors. Never require voice or infer disability/communication preferences from voice use. Show unscripted turn-taking live (ideally interruption) and provide timestamp. No fake waveform, async HTTP disguised as realtime, or long-lived client API key. If Live is unavailable or fails, return to the complete text flow without losing candidate input.

Gate: real unscripted live spoken interaction tested, with video evidence, then optional claim. If Gemini Live integration threatens baseline, revert/feature flag it off.
