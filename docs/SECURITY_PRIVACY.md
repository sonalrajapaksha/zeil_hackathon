# Privacy, security and ethical constraints

Prototype is a drafting aid. Candidate owns all decisions and reviewed text. AI-generated claims must be grounded in candidate-confirmed statements. Employers should not be ranked against disability, and users should not be asked for diagnosis. No upload of real personal resumes during presentation.

API key belongs in `.env.local` server-side. Do not embed it in screenshots or logs. Set max request sizes, history truncation, schema validation, model timeout and meaningful errors. Session data stored in browser only; provide Reset/Delete session action; mention model provider processes submitted content. No DB or analytics. Seeded fictional employer data clearly marked.

For public deployment, avoid storing real applicants' sensitive information; assess consent, privacy policy and abuse controls before real-world deployment.

Completed voice answers also go to Gemini through a server extraction route, disclosed before microphone consent. Each answer is limited to 4,000 characters, with at most 12 queued answers per interview and one extraction at a time. Audio and full transcripts are never persisted by Access. Successful queued raw answers are discarded; failed answers remain only in memory for explicit retry. Source-checked suggestions are unconfirmed until candidate approval; existing browser storage retains confirmed claims and their evidence only. Reset/leaving cancels pending extraction. No new database, analytics, transcript logs or client API keys are introduced.
