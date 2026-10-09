## 3A. NON-LINEAR INFORMATION EXTRACTION AND CROSS-SECTIONAL MEMORY

### Core principle

**The interview is structured, but the information extraction is non-linear.**

Access must not behave like a rigid questionnaire that only remembers information relevant to the current section.

The interviewer should maintain a coherent understanding of everything the candidate has shared throughout the conversation.

Information relevant to any CV section must be recognised and incorporated regardless of when it was mentioned.

### Example

The interviewer is currently collecting Work Experience.

Candidate:

"I worked part-time in retail, and at university I also led a robotics team where we designed and programmed a competition robot."

Access should:

1. Extract the retail role into Work Experience.
2. Recognise the robotics activity as a potential Project and possibly an Achievement.
3. Create or update the corresponding suggested entries in the Living Career Canvas.
4. Preserve the original statement as source evidence.
5. Continue the current work-experience conversation without unnecessarily changing topics.
6. Remember that the robotics project has already been mentioned.
7. When the Projects section is reached, assess which details are still missing.
8. Ask only relevant follow-up questions about the robotics project, rather than asking the candidate to describe it again from scratch.

For example:

"You mentioned leading a robotics team earlier. What was your personal contribution to designing or programming the robot?"

Do not ask:

"Have you ever worked on a project?"

when the candidate has already described one.

### Global information extraction

After every finalised candidate response, analyse the response for information relevant to all supported CV sections:

- Career interests
- Work experience
- Projects
- Education
- Skills
- Achievements
- Volunteering
- Certifications and qualifications
- Other relevant experience

Do not limit extraction to the currently active interview section.

Use the existing structured extraction and Career Canvas pipeline where possible.

Do not trigger duplicate AI calls if the existing pipeline can perform global extraction in one pass.

### Shared candidate memory

Maintain one canonical structured candidate profile across the entire interview.

The profile should contain:
- Entries discovered so far
- Their associated section/category
- Collected fields
- Missing important fields
- Supporting source-message references
- Candidate confirmation status
- Corrections and rejected suggestions
- Interview section coverage

The interview controller should read from this canonical profile when deciding what to ask next.

Do not create a separate memory system that can silently diverge from the Living Career Canvas.

### Cross-sectional extraction versus confirmation

Distinguish between:
1. Information the candidate explicitly stated.
2. AI-suggested interpretations of that information.
3. Information the candidate has confirmed.

For example, leading a robotics team may suggest teamwork or leadership, but those skill labels should remain suggestions until confirmed.

Never invent:
- Dates
- Employers
- Project results
- Metrics
- Qualifications
- Awards
- Responsibilities
- Skills unsupported by the candidate's statements

Preserve existing candidate review and correction workflows.

### Entry deduplication

When the candidate mentions the same project, job or qualification multiple times:

- Update the existing entry.
- Merge new non-conflicting details.
- Preserve supporting evidence references.
- Do not create a duplicate entry.
- Do not overwrite candidate-confirmed details with unconfirmed model output.
- Ask for clarification when statements materially conflict.

Use stable entry IDs and deterministic matching where possible.

Do not rely solely on fuzzy name matching.

### Section completeness based on global memory

When entering a section, inspect everything already collected.

If an entry is already sufficiently detailed:
- Count it toward the guided section limit.
- Do not ask introductory questions about it again.
- Ask whether the candidate wants to add another entry, if appropriate.

If an entry is partially detailed:
- Ask only for missing information.

If the section has no relevant entries:
- Ask an introductory question.

If the candidate has already clearly declined further entries:
- Respect that decision.

If the section is already complete:
- Move to the next relevant section.

### Cross-sectional question planning

The controller should choose the next question using:

1. Current interview objective
2. Existing candidate profile
3. Previously answered questions
4. Missing important information
5. Candidate corrections and preferences
6. Remaining question budget

Questions should maximise useful new information while minimising repetition.

Gemini may propose a question, but the deterministic controller must validate the intended section, entry and transition.

### Soft entry limits

The guided interview should aim for at most:
- 2 work experiences
- 2 projects
- 2 education entries

These limits apply to guided questioning, not extraction or storage.

If the candidate naturally mentions a third project:
- Do not discard it.
- Add it as a suggested profile entry where supported.
- Do not automatically initiate another full project interview.
- Allow the candidate to review or expand it later.

### Interview completion

Before concluding, assess completeness using the entire accumulated candidate profile, not merely which sections have been visited.

A section may already be complete before the interviewer formally reaches it.

The interview must terminate when:
- Required sections have sufficient information or are explicitly skipped.
- Guided entry limits have been respected.
- Important outstanding gaps have been addressed or acknowledged.
- The candidate has had an opportunity to review or correct information.

Do not continue asking questions merely because a fixed sequence contains unused questions.

### Voice and text consistency

Apply identical global extraction and memory rules to both Gemini Live and text interviews.

For realtime voice:
- Process finalised candidate turns only.
- Never treat partial transcripts as authoritative.
- Handle repeated final transcript events idempotently.
- Avoid duplicate extraction.
- Do not interrupt audio playback unnecessarily.

For text:
- Use the same canonical profile and section completeness logic.

When switching modes, preserve the entire accumulated profile and interview progress.

### Required tests

Add tests demonstrating:

1. A project mentioned during Work Experience is remembered in Projects.
2. A qualification mentioned during Introduction is remembered in Education.
3. A skill mentioned during Projects is available during Skills review.
4. An already complete project is not re-interviewed.
5. A partially complete project receives only missing-detail follow-ups.
6. Repeated mentions update existing entries rather than duplicating them.
7. A candidate correction replaces or flags conflicting information safely.
8. A third spontaneously mentioned project is retained without exceeding the guided questioning cap.
9. Voice and text modes produce compatible structured profile updates.
10. The interview concludes even when information arrives out of section order.

### Acceptance criterion

The interviewer must demonstrate genuine conversational memory.

It should feel like Access listened to the entire conversation, not like it is filling out one isolated form section at a time.

**The conversation has a structure. The candidate's story does not have to follow it.**