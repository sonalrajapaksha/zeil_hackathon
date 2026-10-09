import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { POST } from '../src/app/api/profile-proposals/route.ts';
import { appendProfileSuggestions, validateProfileSuggestions } from '../src/lib/profile-suggestions.ts';
import { collectVoiceAnswer, type VoiceAnswerBuffer } from '../src/lib/live-answers.ts';
import type { CandidateProfile } from '../src/lib/contracts.ts';

const originalKey = process.env.GEMINI_API_KEY;
afterEach(() => { mock.restoreAll(); if (originalKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalKey; });
const request = (body: unknown) => new Request('http://localhost/api/profile-proposals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const suggestion = { kind: 'skill' as const, text: 'Customer assistance', evidence: 'helped library visitors' };
function provider(suggestions: unknown = [suggestion]) {
  process.env.GEMINI_API_KEY = 'test-secret';
  return mock.method(globalThis, 'fetch', async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ suggestions }) }] }, finishReason: 'STOP' }] }));
}

test('voice extraction uses only the bounded candidate answer and strict pending suggestion schema', async () => {
  const sdk = provider();
  const result = await POST(request({ answer: 'I helped library visitors use computers.' }));
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await result.json(), { suggestions: [suggestion] });
  assert.equal(sdk.mock.calls.length, 1, 'Does not generate another interview question');
  const sent = JSON.parse(String(sdk.mock.calls[0].arguments[1]?.body));
  assert.deepEqual(JSON.parse(sent.contents[0].parts[0].text), { candidateAnswer: 'I helped library visitors use computers.' });
  assert.equal(sent.generationConfig.responseMimeType, 'application/json');
  assert.match(sent.systemInstruction.parts[0].text, /untrusted data/);
  assert.match(sent.systemInstruction.parts[0].text, /clarification/);
});

test('voice input rejects blanks, extra fields, oversized streamed bodies and cross-origin requests before Gemini', async () => {
  const sdk = provider();
  for (const body of [{ answer: '' }, { answer: 'x'.repeat(4001) }, { answer: 'valid', confirmed: true }, { answer: 'x'.repeat(40000) }]) assert.equal((await POST(request(body))).status, 400);
  const crossOrigin = request({ answer: 'valid' }); crossOrigin.headers.set('origin', 'https://attacker.invalid');
  assert.equal((await POST(crossOrigin)).status, 400);
  assert.equal(sdk.mock.calls.length, 0);
});

test('voice proposals reject unsupported evidence and malformed shapes; sensitive items are excluded', async () => {
  for (const items of [[{ ...suggestion, evidence: 'managed 20 people' }], [{ ...suggestion, confirmed: true }], [{ ...suggestion, kind: 'diagnosis' }]]) {
    provider(items);
    const result = await POST(request({ answer: 'I helped library visitors.' }));
    assert.equal(result.status, 502);
    assert.equal((await result.json()).error.code, 'INVALID_RESPONSE');
    mock.restoreAll();
  }
  provider([{ ...suggestion, text: 'Wheelchair user', evidence: 'use a wheelchair' }, suggestion]);
  const result = await POST(request({ answer: 'I use a wheelchair. I helped library visitors.' }));
  assert.deepEqual(await result.json(), { suggestions: [suggestion] });
});

test('no-evidence and clarification outputs remain empty; missing keys/provider errors allow recovery', async () => {
  provider([]);
  assert.deepEqual(await (await POST(request({ answer: 'Could you clarify this question?' }))).json(), { suggestions: [] });
  mock.restoreAll(); delete process.env.GEMINI_API_KEY;
  assert.equal((await POST(request({ answer: 'I helped library visitors.' }))).status, 503);
  process.env.GEMINI_API_KEY = 'secret-never-return';
  mock.method(globalThis, 'fetch', async () => { throw new Error('secret-never-return'); });
  const failure = await POST(request({ answer: 'I helped library visitors.' }));
  assert.equal(failure.status, 502);
  assert.ok(!JSON.stringify(await failure.json()).includes('secret-never-return'));
});

const emptyBuffer = (): VoiceAnswerBuffer => ({ text: '', overflow: false, suppressed: false, interrupted: false });
test('voice collector waits for completion, ignores AI words and does not duplicate completed input', () => {
  const buffer = emptyBuffer();
  assert.equal(collectVoiceAnswer(buffer, { inputTranscription: { text: 'I helped ' } }), null);
  assert.equal(collectVoiceAnswer(buffer, { outputTranscription: { text: 'I was CEO.' } }), null);
  assert.deepEqual(collectVoiceAnswer(buffer, { inputTranscription: { text: 'library visitors.', finished: true } }), { answer: 'I helped library visitors.', tooLong: false });
  assert.equal(collectVoiceAnswer(buffer, { turnComplete: true }), null);
  assert.equal(collectVoiceAnswer(buffer, { turnComplete: true }), null);
  assert.equal(collectVoiceAnswer(buffer, { inputTranscription: { text: 'I studied mathematics.' } }), null);
  assert.deepEqual(collectVoiceAnswer(buffer, { turnComplete: true }), { answer: 'I studied mathematics.', tooLong: false });
});

test('interruption never completes unfinished input; explicit skip/clarify and oversized turns cannot create claims', () => {
  const buffer = emptyBuffer();
  assert.equal(collectVoiceAnswer(buffer, { interrupted: true, inputTranscription: { text: 'I organised ' } }), null);
  assert.equal(collectVoiceAnswer(buffer, { turnComplete: true }), null);
  assert.deepEqual(collectVoiceAnswer(buffer, { inputTranscription: { text: 'bookings.', finished: true } }), { answer: 'I organised bookings.', tooLong: false });
  buffer.suppressed = true;
  assert.equal(collectVoiceAnswer(buffer, { inputTranscription: { text: 'Please clarify.', finished: true } }), null);
  assert.equal(collectVoiceAnswer(buffer, { turnComplete: true }), null);
  assert.equal(buffer.suppressed, false);
  assert.deepEqual(collectVoiceAnswer(buffer, { inputTranscription: { text: 'x'.repeat(4001), finished: true } }), { answer: '', tooLong: true });
});

test('shared profile merge creates pending claims, deduplicates intakes and preserves candidate edits/approval', () => {
  const profile: CandidateProfile = { skills: [{ id: 'confirmed', name: suggestion.text, evidence: 'My reviewed source', confirmed: true }], experience: [], education: [], preferences: { largeText: true, highContrast: false, reducedMotion: true } };
  const items = [suggestion, { kind: 'experience' as const, text: 'Library volunteering', evidence: 'helped library visitors' }, { kind: 'education' as const, text: 'Mathematics study', evidence: 'studied mathematics' }];
  const next = appendProfileSuggestions(profile, [...items, ...items]);
  assert.deepEqual(next.skills, profile.skills);
  assert.equal(next.experience.length, 1); assert.equal(next.education.length, 1);
  assert.equal(next.experience[0].confirmed, false); assert.equal(next.education[0].confirmed, false);
  assert.equal(profile.experience.length, 0);
  assert.deepEqual(validateProfileSuggestions([suggestion, suggestion], 'I helped library visitors.'), [suggestion]);
});
