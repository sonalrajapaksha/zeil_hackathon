# Why an AI interviewer does not automatically earn Live +15

The screenshot states: “Something real-time. Talk to it out loud (Gemini Live API), or it watches a camera or screen and reacts as things happen. Show us: It running live, not edited together.”

Our baseline interview is async HTTP chat: user sends a message, waits, receives a response. This is **not** the Live bonus. Basic browser speech-to-text with async API calls is not a defensible Live claim either.

For a credible Live claim, implement actual Gemini Live API bidirectional real-time audio and visibly demonstrate unscripted interruption / speaking and response. Ensure endpoint uses server-minted ephemeral credentials or secure proxy approved by SDK; NEVER ship long-lived Gemini key in client. Provide a text alternative and never make audio mandatory. Reserve this until core product is working and other +50 route has been attempted.
