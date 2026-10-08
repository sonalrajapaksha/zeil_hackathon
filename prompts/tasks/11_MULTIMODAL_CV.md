# Task 11 — Gemini Eyes and Ears: native file understanding

Role: stronger model for multimodal API, fast model for UI if disjoint. Read MASTER_SPEC, BONUS_CHALLENGES, SECURITY_PRIVACY, ACCESSIBILITY, PROGRESS.

Implement opt-in upload of sample CV PDF (or image) using Gemini **native multimodal input** with actual file bytes/mime type. Do not use only an external PDF-to-text extraction followed by a text-only Gemini call for this bonus. This is an optional input method, not a requirement for an accessible application; preserve the complete text route. Enforce strict MIME/type and size limits, no persistent storage, safe disposal, accessible file input, upload state, and error handling. Extract evidence-supported *pending* profile suggestions, validated server-side, never auto-confirm or automatically include sensitive disability/medical information in application materials. Show real upload → native Gemini processing → edit/approve in live demo. Keep text-only route fully usable.

Don't misrepresent file reading as universally accessible or production-grade. Test real PDF and invalid/oversize file if credentials available; record actual results in BONUS_EVIDENCE, PROGRESS and commit.
