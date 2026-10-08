# Task 09 — Built for Hiring + Ship It

Role: main integrator or fast model for deployment/docs; strong model for safety review. First read AGENTS.md, MASTER_SPEC, BONUS_CHALLENGES, BONUS_EVIDENCE, PROGRESS and COMPETITION_RULES.

**B01 hiring:** Implement demonstrable candidate journey: realistic fictional persona with a documented accessibility barrier; conversational intake; pending evidence cards; human confirmation; choose fictional job; trustworthy CV and cover letter. On-screen copy explaining what repeated manual form entry is avoided. No unverified claim that product is WCAG-certified or that a certain number of minutes was saved. Make jobseeker's control visibly important. Add demo plan segment and visible labels for sample jobs.

**B02 ship:** Deploy public HTTPS app (Vercel or equivalent). No account, installation or password for judge. Server-only `GEMINI_API_KEY`, reasonable size limits/timeouts/rate limiting for public endpoint; refuse unsupported uploads and preserve content if API unavailable. Create README deployment guide (env vars, build command, smoke test) and record *actual* public URL only after deployment works. Don't fabricate a deploy if missing credentials.

Evidence: update `docs/BONUS_EVIDENCE.md` with file paths, actual URL, measured smoke-test results and demo timestamps after recording. No false claims. Run typecheck/build + manual candidate→export smoke test, and if deployment available test public URL. Update PROGRESS and commit.
