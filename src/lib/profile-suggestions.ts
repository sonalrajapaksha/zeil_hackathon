import type { z } from 'zod';
import type { CandidateProfile, ProfileProposalsResponseSchema } from './contracts.ts';

export type ProfileSuggestion = z.infer<typeof ProfileProposalsResponseSchema>['suggestions'][number];
export const SENSITIVE_PROFILE_CLAIM = /\b(?:disabilit\w*|autis\w*|adhd|diagnos\w*|medical\w*|health condition\w*|mental health|medicat\w*|wheelchair\w*|blind\w*|deaf\w*|screen reader|assistive technolog\w*|dyslex\w*|dysprax\w*|epilep\w*|bipolar|ptsd|chronic illness|hearing loss|access needs?|accommodat\w*|sexual orientation|gender identity|ethnic\w*|racial\w*|religio\w*|veteran status|military veteran|date of birth|\bage\b|citizenship|marital status|pregnan\w*)/i;

/** Shared text/voice boundary: source quotations, sensitivity and duplicate claims. */
export function validateProfileSuggestions(items: ProfileSuggestion[], answer: string): ProfileSuggestion[] {
  if (items.some(({ evidence }) => !answer.toLocaleLowerCase().includes(evidence.toLocaleLowerCase())))
    throw new Error('Evidence is not from the candidate answer');
  const unique = new Map<string, ProfileSuggestion>();
  for (const item of items) {
    if (SENSITIVE_PROFILE_CLAIM.test(item.text) || SENSITIVE_PROFILE_CLAIM.test(item.evidence)) continue;
    const key = `${item.kind}:${item.text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')}`;
    if (!unique.has(key)) unique.set(key, item);
  }
  return [...unique.values()];
}

/** Every intake creates pending claims; an existing candidate edit always wins. */
export function appendProfileSuggestions(profile: CandidateProfile, items: ProfileSuggestion[]): CandidateProfile {
  const next = { ...profile, skills: [...profile.skills], experience: [...profile.experience], education: [...profile.education] };
  const existing = new Set([
    ...profile.skills.map((item) => `skill:${item.name.trim().toLowerCase()}`),
    ...profile.experience.map((item) => `experience:${('text' in item ? item.text : item.role).trim().toLowerCase()}`),
    ...profile.education.map((item) => `education:${item.text.trim().toLowerCase()}`),
  ]);
  for (const item of items) {
    const text = item.text.trim();
    const key = `${item.kind}:${text.toLowerCase()}`;
    if (existing.has(key)) continue;
    existing.add(key);
    const id = crypto.randomUUID();
    if (item.kind === 'skill') next.skills.push({ id, name: text, evidence: item.evidence, confirmed: false });
    else if (item.kind === 'experience') next.experience.push({ id, text, evidence: [item.evidence], confirmed: false });
    else next.education.push({ id, text, evidence: item.evidence, confirmed: false });
  }
  return next;
}
