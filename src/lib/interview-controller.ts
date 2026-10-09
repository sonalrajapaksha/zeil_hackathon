import { InterviewControllerSchema, type CandidateProfile } from './contracts.ts';
import type { z } from 'zod';

export const INTERVIEW_SECTIONS = ['introduction', 'experience', 'projects', 'education', 'review', 'complete'] as const;
export type InterviewSection = typeof INTERVIEW_SECTIONS[number];
export { InterviewControllerSchema };
export type InterviewController = z.infer<typeof InterviewControllerSchema>;
export const EMPTY_CONTROLLER: InterviewController = { section: 'introduction', guided: { experience: 0, projects: 0, education: 0 }, skipped: [], awaitingAnother: null, processed: [], completed: false, earlyCompletion: false };

const order: InterviewSection[] = ['introduction', 'experience', 'projects', 'education', 'review', 'complete'];
const caps = { experience: 2, projects: 2, education: 2 } as const;
const evidenceCount = (evidence: string | string[]) => Array.isArray(evidence) ? evidence.length : evidence.split(' · ').filter(Boolean).length;

/** Deterministic progression. Profile remains the evidence source; fingerprints only guard replays. */
export function advanceInterview(state: InterviewController, profile: CandidateProfile, event: { id: string; action: 'answer' | 'skip' | 'complete'; evidence?: string }): InterviewController {
  const current = InterviewControllerSchema.parse(state);
  if (current.processed.includes(event.id) || current.completed) return current;
  const processed = [...current.processed, event.id].slice(-200);
  const skipped = event.action === 'skip' && !current.skipped.includes(current.section) ? [...current.skipped, current.section] : current.skipped;
  const guided = { ...current.guided };
  let awaitingAnother = current.awaitingAnother;
  if (event.evidence && ['experience', 'projects', 'education'].includes(current.section)) {
    const section = current.section as keyof typeof caps;
    const evidenceFingerprint = event.evidence.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    if (!current.processed.some((id) => id === `evidence:${evidenceFingerprint}`)) guided[section] = Math.min(caps[section], guided[section] + 1);
  }
  let section = current.section;
  if (event.action === 'complete') return { ...current, processed, skipped, guided, section: 'complete', completed: true, earlyCompletion: true };
  if (awaitingAnother) {
    awaitingAnother = null;
    const wantsAnother = /\b(yes|another|more|add one|one more)\b/i.test(event.evidence ?? '');
    if (wantsAnother && guided[section as keyof typeof caps] < 2) return { ...current, processed, skipped, guided, awaitingAnother, section, completed: false };
    section = nextSection(section, skipped);
  } else if (section === 'introduction' && event.action === 'answer' || section === 'review' && event.action === 'answer') {
    section = section === 'introduction' ? 'experience' : 'complete';
  } else if (event.action === 'skip' || event.action === 'answer' && isSectionComplete(section, profile, guided, skipped)) {
    if (event.action === 'answer' && section in caps) {
      if (guided[section as keyof typeof caps] < 2) {
        awaitingAnother = section as keyof typeof caps;
        return { ...current, processed, skipped, guided, awaitingAnother, section, completed: false };
      }
    }
    section = nextSection(section, skipped);
  }
  if (section !== current.section && ['experience', 'projects', 'education'].includes(section) && isSectionComplete(section, profile, guided, skipped) && guided[section as keyof typeof caps] < 2)
    awaitingAnother = section as keyof typeof caps;
  const completed = section === 'complete';
  return { ...current, processed, skipped, guided, awaitingAnother, section, completed, earlyCompletion: false };
}

function nextSection(section: InterviewSection, skipped: InterviewSection[]) {
    const index = order.indexOf(section);
    return order.slice(index + 1).find((candidate) => !skipped.includes(candidate)) ?? 'complete';
}

export function isSectionComplete(section: InterviewSection, profile: CandidateProfile, guided: InterviewController['guided'], skipped: InterviewSection[] = []): boolean {
  if (skipped.includes(section)) return true;
  if (section === 'introduction' || section === 'review' || section === 'complete') return section === 'complete';
  const entries = section === 'experience' ? profile.experience : section === 'education' ? profile.education : profile.experience.filter((entry) => 'text' in entry && /project|designed|built|developed|created/i.test(entry.text));
  const sufficient = entries.some((entry) => evidenceCount(entry.evidence) >= 2);
  return sufficient || guided[section] >= 2;
}

export function controllerQuestion(state: InterviewController, profile: CandidateProfile): string {
  if (state.awaitingAnother) return `Would you like to add another ${state.awaitingAnother === 'experience' ? 'work or volunteer experience' : state.awaitingAnother === 'projects' ? 'project' : 'education or qualification'} before we move on?`;
  switch (state.section) {
    case 'introduction': return 'What kind of work are you interested in, and what is one experience you would like to include?';
    case 'experience': {
      const entry = profile.experience.find((item) => 'text' in item);
      return entry && 'text' in entry ? `You mentioned ${entry.text}. What did you personally do, and what changed because of it?` : state.guided.experience ? 'What did you do in that role, and what is one thing you learned or achieved?' : 'Tell me about a job, volunteer role, caring responsibility or other experience you would like included.';
    }
    case 'projects': {
      const entry = profile.experience.find((item) => 'text' in item && /project|designed|built|developed|created/i.test(item.text));
      return entry && 'text' in entry ? `You mentioned ${entry.text}. What was your part, and what did you make or learn?` : state.guided.projects ? 'What part did you take, and what did you make, change or learn?' : 'Have you worked on a project you would like included, such as something from study, volunteering or personal interests?';
    }
    case 'education': {
      const entry = profile.education.find((item) => evidenceCount(item.evidence) < 2);
      return entry ? `You mentioned ${entry.text}. What did you study, and when did you complete it, if you want to share?` : state.guided.education ? 'What did the course cover, and when did you complete it, if you want to share?' : 'What education, training or qualifications would you like included?';
    }
    case 'review': return 'Is there anything in your career canvas you would like to correct or add before we finish?';
    case 'complete': return 'Thank you. Your interview is complete, and you can review or correct your career canvas at any time.';
    default: return 'Thank you. Your interview is complete, and you can review or correct your career canvas at any time.';
  }
}
