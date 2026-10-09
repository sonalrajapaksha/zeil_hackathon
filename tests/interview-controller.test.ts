import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EMPTY_CONTROLLER, advanceInterview, controllerQuestion, type InterviewController } from '../src/lib/interview-controller.ts';
import { appendProfileSuggestions } from '../src/lib/profile-suggestions.ts';
import type { CandidateProfile } from '../src/lib/contracts.ts';

const profile = (): CandidateProfile => ({ skills: [], experience: [], education: [], preferences: { largeText: false, highContrast: false, reducedMotion: false } });
test('out-of-section project and qualification evidence stays available and duplicate turns are idempotent', () => {
  let candidate = appendProfileSuggestions(profile(), [{ kind: 'experience', text: 'Robotics project', evidence: 'I led the robotics project' }, { kind: 'education', text: 'First aid certificate', evidence: 'I earned a first aid certificate' }], 'message-intro');
  candidate = appendProfileSuggestions(candidate, [{ kind: 'experience', text: 'Robotics project', evidence: 'I programmed the competition robot' }], 'message-work');
  assert.equal(candidate.experience.length, 1);
  assert.equal(candidate.experience[0].evidence.length, 2);
  assert.deepEqual(candidate.experience[0].sourceMessageIds, ['message-intro', 'message-work']);
  assert.equal(candidate.education.length, 1);
  assert.match(controllerQuestion({ ...EMPTY_CONTROLLER, section: 'projects' }, candidate), /Robotics project/);
  assert.match(controllerQuestion({ ...EMPTY_CONTROLLER, section: 'education' }, candidate), /First aid certificate/);
});

test('finite progression asks about another entry, respects a skip and concludes after review', () => {
  const one = appendProfileSuggestions(profile(), [{ kind: 'experience', text: 'Library assistant', evidence: 'I helped visitors use computers' }, { kind: 'experience', text: 'Library assistant', evidence: 'I showed visitors how to use the catalogue' }]);
  let state: InterviewController = { ...EMPTY_CONTROLLER, section: 'experience' };
  state = advanceInterview(state, one, { id: 'answer-1', action: 'answer', evidence: 'I helped visitors use computers' });
  assert.equal(state.awaitingAnother, 'experience');
  assert.match(controllerQuestion(state, one), /Would you like to add another/);
  const snapshot = advanceInterview(state, one, { id: 'answer-1', action: 'answer' });
  assert.deepEqual(snapshot, state);
  state = advanceInterview(state, one, { id: 'answer-2', action: 'answer', evidence: 'No, thank you' });
  assert.equal(state.section, 'projects');
  state = advanceInterview(state, one, { id: 'skip-projects', action: 'skip' });
  assert.equal(state.section, 'education');
  state = advanceInterview(state, one, { id: 'early-finish', action: 'complete' });
  assert.equal(state.completed, true);
  assert.equal(state.earlyCompletion, true);
});

test('a qualification mentioned early counts toward education completeness', () => {
  const candidate = appendProfileSuggestions(profile(), [{ kind: 'education', text: 'Food safety training', evidence: 'I completed food safety training' }, { kind: 'education', text: 'Food safety training', evidence: 'the course covered safe food handling' }]);
  let state: InterviewController = { ...EMPTY_CONTROLLER, section: 'education' };
  state = advanceInterview(state, candidate, { id: 'education-1', action: 'answer', evidence: 'the course covered safe food handling' });
  assert.equal(state.awaitingAnother, 'education');
});

test('a complete out-of-order project is not introduced again, and partial project evidence gets a specific follow-up', () => {
  const complete = appendProfileSuggestions(profile(), [{ kind: 'experience', text: 'Robotics project', evidence: 'I designed the robot' }, { kind: 'experience', text: 'Robotics project', evidence: 'I programmed it for competition' }]);
  let state: InterviewController = { ...EMPTY_CONTROLLER, section: 'experience', guided: { ...EMPTY_CONTROLLER.guided, experience: 2 } };
  state = advanceInterview(state, complete, { id: 'finish-work', action: 'answer' });
  assert.equal(state.section, 'projects');
  assert.equal(state.awaitingAnother, 'projects');
  assert.match(controllerQuestion(state, complete), /add another project/);

  const partial = appendProfileSuggestions(profile(), [{ kind: 'experience', text: 'Robotics project', evidence: 'I led the robotics team' }]);
  assert.match(controllerQuestion({ ...EMPTY_CONTROLLER, section: 'projects' }, partial), /You mentioned Robotics project/);
});

test('a third spontaneous project is retained without increasing guided project entries beyond two', () => {
  let candidate = profile();
  for (const [index, text] of ['Solar car project', 'Robotics project', 'Garden sensor project'].entries())
    candidate = appendProfileSuggestions(candidate, [{ kind: 'experience', text, evidence: `I worked on the ${index + 1} project` }]);
  assert.equal(candidate.experience.length, 3);
  const state = advanceInterview({ ...EMPTY_CONTROLLER, section: 'projects' }, candidate, { id: 'third-mentioned', action: 'answer', evidence: 'I worked on a garden sensor project' });
  assert.equal(state.guided.projects, 1);
  assert.equal(candidate.experience.length, 3);
});

test('text and finalized voice turns share compatible progression; confirmed corrections are preserved', () => {
  const starting = { ...EMPTY_CONTROLLER, section: 'experience' as const };
  const candidate = appendProfileSuggestions(profile(), [{ kind: 'experience', text: 'Retail assistant', evidence: 'I restocked shelves' }]);
  const typed = advanceInterview(starting, candidate, { id: 'text-1', action: 'answer', evidence: 'I restocked shelves' });
  const voiced = advanceInterview(starting, candidate, { id: 'voice:restockedshelves', action: 'answer', evidence: 'I restocked shelves' });
  assert.equal(typed.section, voiced.section);
  assert.equal(typed.guided.experience, voiced.guided.experience);
  const confirmed = { ...candidate, experience: candidate.experience.map((entry) => ({ ...entry, confirmed: true })) };
  const merged = appendProfileSuggestions(confirmed, [{ kind: 'experience', text: 'Retail assistant', evidence: 'I also trained a new starter' }]);
  assert.deepEqual(merged.experience, confirmed.experience);
});
