# Privacy, security and ethical constraints

Prototype is a drafting aid. Candidate owns all decisions and reviewed text. AI-generated claims must be grounded in candidate-confirmed statements. Employers should not be ranked against disability, and users should not be asked for diagnosis. No upload of real personal resumes during presentation.

API key belongs in `.env.local` server-side. Do not embed it in screenshots or logs. Set max request sizes, history truncation, schema validation, model timeout and meaningful errors. Session data stored in browser only; provide Reset/Delete session action; mention model provider processes submitted content. No DB or analytics. Seeded fictional employer data clearly marked.

For public deployment, avoid storing real applicants' sensitive information; assess consent, privacy policy and abuse controls before real-world deployment.
